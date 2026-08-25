import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tryTransition, getAvailableTransitions } from '../../../modules/cases/domain/case-machine.js';
import { TARGET_STAGE } from '../../../modules/cases/domain/transition.types.js';
import type { TransitionEvent, TransitionName } from '../../../modules/cases/domain/transition.types.js';
import { isPreSubmissionStage, isPaymentComplete } from '../../../modules/cases/domain/case.types.js';
import { prisma } from '../../../db.js';
import { verifyPayment } from '../../../modules/payments/infrastructure/persistence/payment.repository.js';
import { createOrderUseCase } from '../../../modules/orders/application/create-order.usecase.js';
import { walletService } from '../../../modules/wallet/application/wallet.service.js';

process.env.NODE_ENV = 'test';

function event(t: TransitionName, overrides: Record<string, unknown> = {}): TransitionEvent {
  return {
    type: t,
    actor: { id: 'user-1', role: 'USER' },
    data: {
      actorId: 'user-1',
      roleVerified: 'USER',
      caseOwnerId: 'user-1',
      creditBalance: 1,
      lockedPrice: 39000,
      paymentStatus: 'paid',
      ...overrides,
    },
  };
}

type CaseUpdateCall = {
  where: { id: string };
  data: Record<string, unknown>;
};

// PrismaClient methods live behind a Proxy; `t.mock.method` cannot replace them
// (its property-descriptor lookup returns undefined), so we swap them by direct
// assignment and restore in `finally`.
type MockablePrisma = {
  $transaction: (cb: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
  case: { findUnique: (...args: unknown[]) => Promise<unknown> };
  servicePackage: { findUnique: (...args: unknown[]) => Promise<unknown> };
};

const mockablePrisma = prisma as unknown as MockablePrisma;

// ---------------------------------------------------------------------------
// Section A — Machine contract (không DB)
// ---------------------------------------------------------------------------

test('GA-02 path A/B — submit luôn hạ cánh "submitted"', () => {
  assert.equal(TARGET_STAGE.T2_SUBMIT_INTAKE, 'submitted');
  assert.equal(TARGET_STAGE.T16_EDIT_INTAKE, 'intake_ready'); // T16 giữ (compat) nhưng KHÔNG phải submit path
});

test('GA-02 path A/B — T2 khả dụng từ triage_pending (cả intake_pending lẫn intake_ready)', () => {
  // internal_status của cả 2 stage pre-submission đều là "triage_pending"
  assert.ok(tryTransition('triage_pending', event('T2_SUBMIT_INTAKE')));
  assert.ok(getAvailableTransitions('triage_pending').includes('T2_SUBMIT_INTAKE'));
});

test('GA-02 — cả intake_pending lẫn intake_ready là pre-submission stage', () => {
  assert.equal(isPreSubmissionStage('intake_pending'), true);
  assert.equal(isPreSubmissionStage('intake_ready'), true);
});

test('GA-02 — T16 không thể là submit path (guard isBeforeSubmission chặn sau nộp)', () => {
  assert.equal(tryTransition('triage_pending', event('T16_EDIT_INTAKE', { currentStage: 'submitted' })), null);
});

test('GA-02 — paid stamp giữ nguyên (T5 gate dựa vào nó)', () => {
  assert.equal(isPaymentComplete('paid'), true);
});

// ---------------------------------------------------------------------------
// Section B — Writer-removal (mock prisma singleton, không DB)
// ---------------------------------------------------------------------------

test('GA-02 verifyPayment — paid KHÔNG ghi user_facing_stage', async () => {
  const originalUseOrderDomain = process.env.USE_ORDER_DOMAIN;
  process.env.USE_ORDER_DOMAIN = 'true'; // bỏ qua credit branch → tx surface tối thiểu

  const caseUpdateCalls: CaseUpdateCall[] = [];
  const fakeTx = {
    payment: {
      update: async (): Promise<{ id: string; status: string }> => ({ id: 'pay-1', status: 'paid' }),
    },
    case: {
      update: async (args: CaseUpdateCall): Promise<Record<string, never>> => {
        caseUpdateCalls.push(args);
        return {};
      },
    },
    caseEvent: { create: async (): Promise<Record<string, never>> => ({}) },
  };

  const originalTransaction = mockablePrisma.$transaction;
  mockablePrisma.$transaction = (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx);
  try {
    await verifyPayment({
      paymentId: 'pay-1',
      caseId: 'case-1',
      status: 'paid',
      rejectionReason: null,
      adminId: 'admin-1',
      verificationSource: 'manual',
    });
  } finally {
    mockablePrisma.$transaction = originalTransaction;
    if (originalUseOrderDomain === undefined) {
      delete process.env.USE_ORDER_DOMAIN;
    } else {
      process.env.USE_ORDER_DOMAIN = originalUseOrderDomain;
    }
  }

  assert.equal(caseUpdateCalls.length, 1);
  assert.deepEqual(caseUpdateCalls[0].data, { payment_status: 'paid' });
  assert.ok(!('user_facing_stage' in caseUpdateCalls[0].data));
});

test('GA-02 createOrder — mua credit KHÔNG ghi user_facing_stage', async () => {
  const originalDualWritePayment = process.env.DUAL_WRITE_PAYMENT;
  delete process.env.DUAL_WRITE_PAYMENT; // không đi nhánh payment dual-write

  const caseUpdateCalls: CaseUpdateCall[] = [];
  const fakeTx = {
    order: {
      create: async (): Promise<{ id: string; items: unknown[] }> => ({ id: 'order-1', items: [] }),
      update: async (): Promise<Record<string, never>> => ({}),
    },
    creditLedger: {
      aggregate: async (): Promise<{ _sum: { amount: number } }> => ({ _sum: { amount: 0 } }),
      create: async (): Promise<Record<string, never>> => ({}),
    },
    case: {
      findUnique: async (): Promise<{
        owner_auth_user_id: string;
        internal_status: string;
        user_facing_stage: string;
      }> => ({
        owner_auth_user_id: 'user-1',
        internal_status: 'triage_pending',
        user_facing_stage: 'intake_pending',
      }),
      update: async (args: CaseUpdateCall): Promise<Record<string, never>> => {
        caseUpdateCalls.push(args);
        return {};
      },
    },
    domainEventOutbox: { create: async (): Promise<Record<string, never>> => ({}) },
  };

  const originalTransaction = mockablePrisma.$transaction;
  const originalCaseFindUnique = mockablePrisma.case.findUnique;
  const originalPackageFindUnique = mockablePrisma.servicePackage.findUnique;
  const mockableWallet = walletService as unknown as { withdraw: (...args: unknown[]) => Promise<unknown> };
  const originalWithdraw = mockableWallet.withdraw;

  mockablePrisma.$transaction = (cb: (tx: unknown) => Promise<unknown>) => cb(fakeTx);
  mockablePrisma.case.findUnique = async (): Promise<unknown> => ({ package_id: 'pkg-1' }); // resolveCreditAuditPrice
  mockablePrisma.servicePackage.findUnique = async (): Promise<unknown> => ({ pricing_tiers: [{ price: 39000 }] });
  mockableWallet.withdraw = async (): Promise<unknown> => undefined;

  try {
    await createOrderUseCase('user-1', {
      items: [{ service_type: 'credit_audit', quantity: 1, metadata_json: { case_id: 'case-1' } }],
    });
  } finally {
    mockablePrisma.$transaction = originalTransaction;
    mockablePrisma.case.findUnique = originalCaseFindUnique;
    mockablePrisma.servicePackage.findUnique = originalPackageFindUnique;
    mockableWallet.withdraw = originalWithdraw;
    if (originalDualWritePayment === undefined) {
      delete process.env.DUAL_WRITE_PAYMENT;
    } else {
      process.env.DUAL_WRITE_PAYMENT = originalDualWritePayment;
    }
  }

  assert.equal(caseUpdateCalls.length, 1);
  assert.deepEqual(caseUpdateCalls[0].data, { payment_status: 'paid' });
  assert.ok(!('user_facing_stage' in caseUpdateCalls[0].data));
});
