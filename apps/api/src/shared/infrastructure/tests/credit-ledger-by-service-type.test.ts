import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../db.js';
import { AppError } from '../../../shared/domain/app-error.js';
import { createOrderUseCase } from '../../../modules/orders/application/create-order.usecase.js';
import { walletService } from '../../../modules/wallet/application/wallet.service.js';
import {
  createCreditEntry,
  getCreditBalance,
  getCreditBalances,
} from '../../../modules/cases/infrastructure/persistence/credit-ledger.repository.js';
import {
  refundCaseAllInTx,
  refundRemainingCreditInTx,
  resolvePurchaseUnitPrice,
} from '../../../services/credit-refund.js';

process.env.NODE_ENV = 'test';

const CP1_ID = 'st-cp1';
const CP2_ID = 'st-cp2';
const SERVICE_TYPES = [
  { id: CP1_ID, code: 'cp1_audit' },
  { id: CP2_ID, code: 'cp2_audit' },
];

interface LedgerRow {
  case_id: string;
  service_type_id: string;
  amount: number;
  type: string;
  reference_id?: string | null;
  metadata_json?: Record<string, unknown> | null;
  idempotency_key?: string;
  balance_after?: number;
}

// In-memory ledger honouring the filters the production code relies on.
function fakeDb(rows: LedgerRow[]) {
  const matches = (row: LedgerRow, where: Record<string, unknown>) =>
    (where.case_id === undefined || row.case_id === where.case_id) &&
    (where.service_type_id === undefined || typeof where.service_type_id === 'object' || row.service_type_id === where.service_type_id) &&
    (where.type === undefined || row.type === where.type);
  const wallet: Array<{ ownerId: string; amount: number; key: string }> = [];
  const db = {
    creditLedger: {
      aggregate: async ({ where }: { where: Record<string, unknown> }) => ({
        _sum: { amount: rows.filter((r) => matches(r, where)).reduce((s, r) => s + r.amount, 0) },
      }),
      groupBy: async ({ where }: { where: Record<string, unknown> }) => {
        const sums = new Map<string, number>();
        for (const r of rows.filter((x) => matches(x, where))) {
          sums.set(r.service_type_id, (sums.get(r.service_type_id) ?? 0) + r.amount);
        }
        return [...sums].map(([service_type_id, amount]) => ({ service_type_id, _sum: { amount } }));
      },
      findMany: async ({ where }: { where: Record<string, unknown> }) =>
        rows.filter((r) => matches(r, where) && r.amount > 0),
      create: async ({ data }: { data: LedgerRow }) => {
        rows.push(data);
        return data;
      },
    },
    serviceType: {
      findMany: async () => SERVICE_TYPES,
      findUnique: async ({ where }: { where: { code: string } }) =>
        SERVICE_TYPES.find((t) => t.code === where.code) ?? null,
    },
    walletTransaction: { findUnique: async () => null },
    case: { findUnique: async () => ({ owner_auth_user_id: 'user-1' }) },
  };
  return { db, wallet };
}

function withWalletSpy<T>(wallet: Array<{ ownerId: string; amount: number; key: string }>, run: () => Promise<T>): Promise<T> {
  const mockable = walletService as unknown as { refund: (...args: unknown[]) => Promise<void> };
  const original = mockable.refund;
  mockable.refund = async (ownerId: unknown, amount: unknown, _src: unknown, _case: unknown, key: unknown) => {
    wallet.push({ ownerId: ownerId as string, amount: amount as number, key: key as string });
  };
  return run().finally(() => {
    mockable.refund = original;
  });
}

const purchase = (service_type_id: string, amount: number, pricePerCredit: number): LedgerRow => ({
  case_id: 'case-1',
  service_type_id,
  amount,
  type: 'purchase',
  reference_id: 'order-x',
  metadata_json: { price_per_credit: pricePerCredit, credits_granted: amount },
});

test('balance: consume CP2 does not touch CP1 balance', async () => {
  const rows: LedgerRow[] = [purchase(CP1_ID, 2, 39500), purchase(CP2_ID, 4, 19750)];
  const { db } = fakeDb(rows);

  await createCreditEntry(db as never, {
    caseId: 'case-1',
    serviceTypeId: CP2_ID,
    amount: -1,
    balanceAfter: 3,
    type: 'consumption',
    idempotencyKey: 'k-consume-cp2',
  });

  assert.equal(await getCreditBalance(db as never, 'case-1', CP1_ID), 2);
  assert.equal(await getCreditBalance(db as never, 'case-1', CP2_ID), 3);
  assert.deepEqual(await getCreditBalances(db as never, 'case-1'), { cp1_audit: 2, cp2_audit: 3 });
});

test('refund: two service types are refunded independently', async () => {
  const rows: LedgerRow[] = [
    purchase(CP1_ID, 2, 39500),
    purchase(CP2_ID, 4, 19750),
    { case_id: 'case-1', service_type_id: CP2_ID, amount: -1, type: 'consumption' },
  ];
  const { db, wallet } = fakeDb(rows);

  await withWalletSpy(wallet, () => refundRemainingCreditInTx(db as never, 'case-1', 'user-1'));

  const byKey = Object.fromEntries(wallet.map((w) => [w.key, w.amount]));
  assert.equal(byKey['refund-credit-case-1'], 79000); // CP1: 2 x 39.500, legacy key kept
  assert.equal(byKey['refund-credit-case-1-cp2_audit'], 59250); // CP2: 3 unused x 19.750
  assert.equal(wallet.length, 2);

  const zeroing = rows.filter((r) => r.type === 'refund');
  assert.deepEqual(
    zeroing.map((r) => [r.service_type_id, r.amount]).sort(),
    [[CP1_ID, -2], [CP2_ID, -3]],
  );
  assert.equal(await getCreditBalance(db as never, 'case-1', CP1_ID), 0);
  assert.equal(await getCreditBalance(db as never, 'case-1', CP2_ID), 0);
});

test('refund: zero-priced credits refund 0 VND and still zero the ledger', async () => {
  const rows: LedgerRow[] = [purchase(CP2_ID, 4, 0)];
  const { db, wallet } = fakeDb(rows);

  await withWalletSpy(wallet, () => refundRemainingCreditInTx(db as never, 'case-1', 'user-1'));

  assert.equal(wallet.length, 0);
  assert.equal(await getCreditBalance(db as never, 'case-1', CP2_ID), 0);
  const refundRow = rows.find((r) => r.type === 'refund');
  assert.equal(refundRow?.amount, -4);
  assert.deepEqual(refundRow?.metadata_json, { refund_vnd: 0 });
});

test('refund: refundCaseAll sums per-service FIFO into one wallet refund', async () => {
  const rows: LedgerRow[] = [purchase(CP1_ID, 2, 39500), purchase(CP2_ID, 4, 0)];
  const { db, wallet } = fakeDb(rows);

  await withWalletSpy(wallet, () => refundCaseAllInTx(db as never, 'case-1', 'user-1', 79000));

  assert.deepEqual(wallet, [{ ownerId: 'user-1', amount: 79000, key: 'refund-case-case-1' }]);
  assert.equal(rows.filter((r) => r.type === 'refund').length, 2);
});

test('resolvePurchaseUnitPrice: explicit price_per_credit 0 is honoured', async () => {
  const price = await resolvePurchaseUnitPrice(
    {} as never,
    { price_per_credit: 0, unit_price: 79000, credits_granted: 4, quantity: 1 },
    null,
    4,
  );
  assert.equal(price, 0);
});

// ---------------------------------------------------------------------------
// createOrder: grant per package / ServiceType
// ---------------------------------------------------------------------------

interface CapturedOrder {
  ledgerCreates: Array<{ data: Record<string, unknown> }>;
  caseUpdates: unknown[];
  outbox: Array<{ data: { payload_json: Record<string, unknown> } }>;
  orderItems: Array<Record<string, unknown>>;
}

async function runCreateOrder(
  pkg: Record<string, unknown> | null,
  item: { package_id: string; quantity: number },
): Promise<CapturedOrder> {
  const captured: CapturedOrder = { ledgerCreates: [], caseUpdates: [], outbox: [], orderItems: [] };
  const fakeTx = {
    order: {
      create: async ({ data }: { data: { items: { create: Array<Record<string, unknown>> } } }) => {
        captured.orderItems = data.items.create;
        return { id: 'order-1', items: [] };
      },
      update: async () => ({}),
    },
    creditLedger: {
      aggregate: async () => ({ _sum: { amount: 0 } }),
      create: async (args: { data: Record<string, unknown> }) => {
        captured.ledgerCreates.push(args);
        return {};
      },
    },
    case: {
      findUnique: async () => ({
        owner_auth_user_id: 'user-1',
        internal_status: 'triage_pending',
        package_id: 'pkg_ai_audit',
        locked_price: 79000,
      }),
      update: async (args: unknown) => {
        captured.caseUpdates.push(args);
        return {};
      },
    },
    caseEvent: { create: async () => ({}) },
    domainEventOutbox: {
      create: async (args: { data: { payload_json: Record<string, unknown> } }) => {
        captured.outbox.push(args);
        return {};
      },
    },
  };

  const mockablePrisma = prisma as unknown as {
    $transaction: (cb: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
    servicePackage: { findUnique: () => Promise<unknown> };
  };
  const mockableWallet = walletService as unknown as { withdraw: (...args: unknown[]) => Promise<unknown> };
  const originalTransaction = mockablePrisma.$transaction;
  const originalFindUnique = mockablePrisma.servicePackage.findUnique;
  const originalWithdraw = mockableWallet.withdraw;
  mockablePrisma.$transaction = (cb) => cb(fakeTx);
  mockablePrisma.servicePackage.findUnique = async () => pkg;
  mockableWallet.withdraw = async () => undefined;
  try {
    await createOrderUseCase('user-1', {
      items: [{ ...item, metadata_json: { case_id: 'case-1' } }],
    });
  } finally {
    mockablePrisma.$transaction = originalTransaction;
    mockablePrisma.servicePackage.findUnique = originalFindUnique;
    mockableWallet.withdraw = originalWithdraw;
  }
  return captured;
}

const cp2Package = {
  id: 'pkg_cp2_audit',
  is_active: true,
  price: 79000,
  credits_granted: 4,
  service_type: { id: CP2_ID, code: 'cp2_audit' },
  pricing_tiers: [{ price: 79000 }],
};

test('createOrder: CP2 package grants credits_granted x quantity on the CP2 service type only', async () => {
  const out = await runCreateOrder(cp2Package, { package_id: 'pkg_cp2_audit', quantity: 2 });

  assert.equal(out.ledgerCreates.length, 1);
  const entry = out.ledgerCreates[0]!.data;
  assert.equal(entry.service_type_id, CP2_ID);
  assert.equal(entry.amount, 8);
  assert.equal(entry.type, 'purchase');
  assert.equal((entry.metadata_json as Record<string, unknown>).price_per_credit, 19750);
  assert.equal(out.orderItems[0]!.service_type, 'cp2_audit');
  assert.equal(out.orderItems[0]!.package_id, 'pkg_cp2_audit');
  // a CP2 purchase never rewrites the CP1 case (payment status / package)
  assert.equal(out.caseUpdates.length, 0);
  const payload = out.outbox[0]!.data.payload_json;
  assert.equal(payload.serviceTypeCode, 'cp2_audit');
  assert.equal(payload.totalCredits, 8);
});

test('createOrder: CP1 package grants on cp1_audit and marks the case paid', async () => {
  const cp1Package = {
    ...cp2Package,
    id: 'pkg_ai_audit',
    credits_granted: 2,
    service_type: { id: CP1_ID, code: 'cp1_audit' },
  };
  const out = await runCreateOrder(cp1Package, { package_id: 'pkg_ai_audit', quantity: 1 });

  assert.equal(out.ledgerCreates[0]!.data.service_type_id, CP1_ID);
  assert.equal(out.ledgerCreates[0]!.data.amount, 2);
  assert.equal(out.caseUpdates.length, 1);
});

test('createOrder: inactive package -> 400 PACKAGE_INACTIVE', async () => {
  await assert.rejects(
    runCreateOrder({ ...cp2Package, is_active: false }, { package_id: 'pkg_cp2_audit', quantity: 1 }),
    (err: unknown) => err instanceof AppError && err.status === 400 && err.code === 'PACKAGE_INACTIVE',
  );
});

test('createOrder: unknown package -> 404 PACKAGE_NOT_FOUND', async () => {
  await assert.rejects(
    runCreateOrder(null, { package_id: 'pkg_missing', quantity: 1 }),
    (err: unknown) => err instanceof AppError && err.status === 404 && err.code === 'PACKAGE_NOT_FOUND',
  );
});
