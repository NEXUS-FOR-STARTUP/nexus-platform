import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db.js";

export interface FakeReceivable {
  id: string;
  code: string;
  amount_due: number;
  due_at: Date;
  created_at: Date;
  review_reason: string | null;
  case_id: string | null;
  order_id: string | null;
  public_token_hash: string | null;
  customer_name: string;
  customer_contact: string;
  payments: { applied_amount: number; gross_amount: number; paid_at: Date; bank_ref: string; source: string }[];
  adjustments: { amount: number; kind: string; credits: number | null; idempotency_key: string }[];
  case: { case_code: string } | null;
}

export interface LedgerRow {
  type: string;
  amount: number;
  created_at: number;
  metadata_json: Record<string, unknown>;
}

/** In-memory tables the fake transaction reads and writes. */
export const store: { receivables: FakeReceivable[]; ledger: LedgerRow[] } = { receivables: [], ledger: [] };

const originals = {
  transaction: prisma.$transaction,
  receivableFind: prisma.receivable.findUnique,
  depositFind: prisma.deposit.findFirst,
  adjustmentFind: prisma.receivableAdjustment.findUnique,
  paymentFind: prisma.receivablePayment.findUnique,
};

export function makeReceivable(over: Partial<FakeReceivable> = {}): FakeReceivable {
  const n = store.receivables.length + 1;
  const r: FakeReceivable = {
    id: `r-${n}`,
    code: `CRDEBT00000${n}`,
    amount_due: 79_000,
    due_at: new Date(Date.now() + 86_400_000),
    created_at: new Date(),
    review_reason: null,
    case_id: "case-1",
    order_id: "order-1",
    public_token_hash: null,
    customer_name: "Khach Zalo",
    customer_contact: "0909 000 111",
    payments: [],
    adjustments: [],
    case: { case_code: "CASE-1" },
    ...over,
  };
  store.receivables.push(r);
  return r;
}

export const fundedLot = (receivableId: string, amount: number, at: number): LedgerRow => ({
  type: "purchase",
  amount,
  created_at: at,
  metadata_json: { funded_by_receivable_id: receivableId, price_per_credit: 0 },
});

export const realLot = (amount: number, at: number): LedgerRow => ({
  type: "purchase",
  amount,
  created_at: at,
  metadata_json: { price_per_credit: 39_500 },
});

function uniqueViolation(): Error {
  return Object.assign(new Error("unique"), { code: "P2002" });
}

interface ReceivableWhere {
  id?: string;
  code?: string;
  public_token_hash?: string;
}

function findReceivable({ where }: { where: ReceivableWhere }): Promise<FakeReceivable | null> {
  const found = store.receivables.find(
    (r) =>
      (where.id && r.id === where.id) ||
      (where.code && r.code === where.code) ||
      (where.public_token_hash && r.public_token_hash === where.public_token_hash),
  );
  return Promise.resolve(found ?? null);
}

/**
 * Fake transaction client over `store`; unique clashes throw P2002 like Postgres.
 * The cast is the single boundary: the fake implements only the delegates the code under test calls.
 */
export function makeTx(): Prisma.TransactionClient {
  const tx = {
    $queryRaw: async () => [],
    creditLedger: {
      findMany: async ({ where }: { where: { type: string | { in: string[] } } }) => {
        const types = typeof where.type === "string" ? [where.type] : where.type.in;
        return store.ledger.filter((l) => types.includes(l.type)).sort((a, b) => b.created_at - a.created_at);
      },
    },
    receivable: {
      findUnique: findReceivable,
      update: async ({ where, data }: { where: { id: string }; data: Partial<FakeReceivable> }) => {
        Object.assign(store.receivables.find((r) => r.id === where.id)!, data);
      },
    },
    receivablePayment: {
      create: async ({ data }: { data: { receivable_id: string } & FakeReceivable["payments"][number] }) => {
        if (store.receivables.some((r) => r.payments.some((p) => p.bank_ref === data.bank_ref))) throw uniqueViolation();
        store.receivables.find((r) => r.id === data.receivable_id)!.payments.push(data);
      },
    },
    receivableAdjustment: {
      findUnique: async ({ where }: { where: { idempotency_key: string } }) =>
        store.receivables.flatMap((r) => r.adjustments).find((a) => a.idempotency_key === where.idempotency_key) ?? null,
      create: async ({ data }: { data: { receivable_id: string } & FakeReceivable["adjustments"][number] }) => {
        if (store.receivables.some((r) => r.adjustments.some((a) => a.idempotency_key === data.idempotency_key))) {
          throw uniqueViolation();
        }
        store.receivables.find((r) => r.id === data.receivable_id)!.adjustments.push(data);
      },
    },
  };
  return tx as unknown as Prisma.TransactionClient;
}

/** Empties the tables and routes prisma.$transaction / receivable lookups to the fakes. */
export function installFakes(): void {
  store.receivables = [];
  store.ledger = [];
  Reflect.set(prisma, "$transaction", async (cb: (tx: Prisma.TransactionClient) => unknown) => cb(makeTx()));
  Reflect.set(prisma.receivable, "findUnique", findReceivable);
  Reflect.set(prisma.receivableAdjustment, "findUnique", makeTx().receivableAdjustment.findUnique);
  Reflect.set(prisma.receivablePayment, "findUnique", async ({ where }: { where: { bank_ref: string } }) => {
    for (const r of store.receivables) {
      const p = r.payments.find((x) => x.bank_ref === where.bank_ref);
      if (p) return { receivable_id: r.id, gross_amount: p.gross_amount, source: p.source };
    }
    return null;
  });
}

export function restoreFakes(): void {
  Reflect.set(prisma, "$transaction", originals.transaction);
  Reflect.set(prisma.receivable, "findUnique", originals.receivableFind);
  Reflect.set(prisma.deposit, "findFirst", originals.depositFind);
  Reflect.set(prisma.receivableAdjustment, "findUnique", originals.adjustmentFind);
  Reflect.set(prisma.receivablePayment, "findUnique", originals.paymentFind);
}
