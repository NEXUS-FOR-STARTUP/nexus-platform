import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";

process.env.NODE_ENV = "test";

import { prisma } from "../../../db.js";
import { AppError } from "../../domain/app-error.js";
import { walletService } from "../../../modules/wallet/application/wallet.service.js";
import { createOrderUseCase } from "../../../modules/orders/application/create-order.usecase.js";
import { applyPercentOff } from "../../../modules/orders/application/discount.helpers.js";
import {
  claimDiscountCheckSlot,
  resetDiscountCheckRateLimitForTests,
  DISCOUNT_CHECK_MAX_ATTEMPTS,
  DISCOUNT_CHECK_WINDOW_MS,
} from "../../../modules/orders/application/discount-check-rate-limit.js";
import { checkDiscountCodeUseCase } from "../../../modules/orders/application/check-discount-code.usecase.js";
import { resolvePurchaseUnitPrice, computeFifoRefund } from "../../../services/credit-refund.js";

const CP2_TYPE_ID = "st-cp2";
const OTHER_TYPE_ID = "st-other";
const PACKAGE_PRICE = 79000;
const PACKAGE_CREDITS = 4;

interface FakeCode {
  id: string;
  code: string;
  percent_off: number;
  service_type_id: string;
  max_redemptions: number | null;
  redeemed_count: number;
  expires_at: Date | null;
  is_active: boolean;
}

interface FakeState {
  codes: FakeCode[];
  redemptions: { code_id: string; user_id: string; order_id: string }[];
  orders: { id: string; total_amount: number; status: string; metadata_json: unknown; items: unknown[] }[];
  ledger: { amount: number; metadata_json: Record<string, unknown> }[];
  outbox: { event_type: string; payload_json: Record<string, unknown> }[];
  withdraws: number[];
  orderSeq: number;
}

let state: FakeState;
const originals = {
  transaction: prisma.$transaction,
  pkgFind: prisma.servicePackage.findUnique,
  codeFind: prisma.discountCode.findUnique,
  redemptionFind: prisma.discountRedemption.findUnique,
  withdraw: walletService.withdraw,
};

function makeCode(overrides: Partial<FakeCode> = {}): FakeCode {
  const code: FakeCode = {
    id: `code-${state.codes.length + 1}`,
    code: "TANG4LUOT",
    percent_off: 100,
    service_type_id: CP2_TYPE_ID,
    max_redemptions: null,
    redeemed_count: 0,
    expires_at: null,
    is_active: true,
    ...overrides,
  };
  state.codes.push(code);
  return code;
}

function makeFakeTx(undo: (() => void)[]) {
  return {
    order: {
      create: async ({ data }: { data: { total_amount: number; metadata_json: unknown; items: { create: unknown[] } } }) => {
        const order = {
          id: `order-${++state.orderSeq}`,
          total_amount: data.total_amount,
          status: "pending",
          metadata_json: data.metadata_json,
          items: data.items.create,
        };
        state.orders.push(order);
        undo.push(() => state.orders.splice(state.orders.indexOf(order), 1));
        return order;
      },
      update: async ({ where, data }: { where: { id: string }; data: { status: string } }) => {
        const order = state.orders.find((o) => o.id === where.id)!;
        const previous = order.status;
        order.status = data.status;
        undo.push(() => {
          order.status = previous;
        });
        return order;
      },
    },
    discountCode: {
      fields: { max_redemptions: "MAX" },
      updateMany: async ({ where }: { where: { id: string; redeemed_count: { lt: string } } }) => {
        const record = state.codes.find((c) => c.id === where.id);
        if (!record || record.max_redemptions === null || record.redeemed_count >= record.max_redemptions) {
          return { count: 0 };
        }
        record.redeemed_count += 1;
        undo.push(() => {
          record.redeemed_count -= 1;
        });
        return { count: 1 };
      },
      update: async ({ where }: { where: { id: string } }) => {
        const record = state.codes.find((c) => c.id === where.id)!;
        record.redeemed_count += 1;
        undo.push(() => {
          record.redeemed_count -= 1;
        });
      },
    },
    discountRedemption: {
      create: async ({ data }: { data: { code_id: string; user_id: string; order_id: string } }) => {
        if (state.redemptions.some((r) => r.code_id === data.code_id && r.user_id === data.user_id)) {
          throw Object.assign(new Error("unique"), { code: "P2002" });
        }
        state.redemptions.push(data);
        undo.push(() => state.redemptions.splice(state.redemptions.indexOf(data), 1));
      },
    },
    case: {
      findUnique: async () => ({
        owner_auth_user_id: currentUser.getStore(),
        internal_status: "intake",
        package_id: null,
        locked_price: null,
      }),
    },
    creditLedger: {
      aggregate: async () => ({ _sum: { amount: state.ledger.reduce((s, l) => s + l.amount, 0) } }),
      create: async ({ data }: { data: { amount: number; metadata_json: Record<string, unknown> } }) => {
        state.ledger.push(data);
        undo.push(() => state.ledger.splice(state.ledger.indexOf(data), 1));
      },
    },
    domainEventOutbox: {
      create: async ({ data }: { data: { event_type: string; payload_json: Record<string, unknown> } }) => {
        state.outbox.push(data);
        undo.push(() => state.outbox.splice(state.outbox.indexOf(data), 1));
      },
    },
  };
}

// Per-call identity so parallel orders each see their own owner.
const currentUser = new AsyncLocalStorage<string>();

/** Undo journal so a thrown error discards only this transaction's writes, like Postgres would. */
async function fakeTransaction<T>(cb: (tx: ReturnType<typeof makeFakeTx>) => Promise<T>): Promise<T> {
  const undo: (() => void)[] = [];
  try {
    return await cb(makeFakeTx(undo));
  } catch (error) {
    for (const revert of undo.reverse()) revert();
    throw error;
  }
}

/** Test seam: swaps a method on a Prisma delegate / service for an in-memory fake. */
function patch(target: object, key: string, impl: unknown) {
  Reflect.set(target, key, impl);
}

beforeEach(() => {
  state = { codes: [], redemptions: [], orders: [], ledger: [], outbox: [], withdraws: [], orderSeq: 0 };
  resetDiscountCheckRateLimitForTests();

  patch(prisma, "$transaction", fakeTransaction);
  patch(prisma.servicePackage, "findUnique", async () => ({
    id: "pkg-cp2",
    is_active: true,
    price: PACKAGE_PRICE,
    credits_granted: PACKAGE_CREDITS,
    service_type: { id: CP2_TYPE_ID, code: "cp2_audit" },
    pricing_tiers: [],
  }));
  patch(prisma.discountCode, "findUnique", async ({ where }: { where: { code: string } }) =>
    state.codes.find((c) => c.code === where.code) ?? null);
  patch(
    prisma.discountRedemption,
    "findUnique",
    async ({ where }: { where: { code_id_user_id: { code_id: string; user_id: string } } }) =>
      state.redemptions.find(
        (r) => r.code_id === where.code_id_user_id.code_id && r.user_id === where.code_id_user_id.user_id,
      ) ?? null,
  );
  patch(walletService, "withdraw", async (_user: string, amount: number) => {
    state.withdraws.push(amount);
  });
});

afterEach(() => {
  patch(prisma, "$transaction", originals.transaction);
  patch(prisma.servicePackage, "findUnique", originals.pkgFind);
  patch(prisma.discountCode, "findUnique", originals.codeFind);
  patch(prisma.discountRedemption, "findUnique", originals.redemptionFind);
  patch(walletService, "withdraw", originals.withdraw);
});

let keySeq = 0;
function order(userId: string, discountCode?: string) {
  return currentUser.run(userId, () =>
    createOrderUseCase(userId, {
      idempotency_key: `key-${++keySeq}`,
      items: [{ package_id: "pkg-cp2", quantity: 1, metadata_json: { case_id: "case-1" } }],
      ...(discountCode !== undefined ? { discount_code: discountCode } : {}),
    }),
  );
}

async function assertAppError(promise: Promise<unknown>, status: number, code: string) {
  await assert.rejects(promise, (err: unknown) => {
    assert.ok(err instanceof AppError);
    assert.equal(err.status, status);
    assert.equal(err.code, code);
    return true;
  });
}

test("applyPercentOff rounds and handles 100%", () => {
  assert.equal(applyPercentOff(PACKAGE_PRICE, 100), 0);
  assert.equal(applyPercentOff(PACKAGE_PRICE, 50), 39500);
  assert.equal(applyPercentOff(PACKAGE_PRICE, 1), 78210);
});

test("100% code: order is 0đ, wallet untouched, order paid, credits granted, ORDER_PAID emitted", async () => {
  makeCode();
  const result = await order("user-1", "tang4luot ");

  assert.equal(result.totalAmount, 0);
  assert.equal(result.status, "paid");
  assert.equal(result.totalCredits, PACKAGE_CREDITS);
  assert.deepEqual(state.withdraws, []);
  assert.equal(state.orders[0]!.status, "paid");
  assert.deepEqual(state.orders[0]!.metadata_json, {
    list_price: PACKAGE_PRICE,
    discount_code: "TANG4LUOT",
    percent_off: 100,
  });
  assert.equal(state.ledger[0]!.amount, PACKAGE_CREDITS);
  assert.equal(state.outbox[0]!.event_type, "order.paid");
  assert.equal(state.codes[0]!.redeemed_count, 1);
});

test("partial code charges the discounted price through the wallet", async () => {
  makeCode({ percent_off: 50 });
  const result = await order("user-1", "TANG4LUOT");

  assert.equal(result.totalAmount, 39500);
  assert.deepEqual(state.withdraws, [39500]);
});

test("order without a code keeps the list price", async () => {
  const result = await order("user-1");
  assert.equal(result.totalAmount, PACKAGE_PRICE);
  assert.deepEqual(state.withdraws, [PACKAGE_PRICE]);
});

test("refund of a fully discounted purchase is 0đ", async () => {
  makeCode();
  await order("user-1", "TANG4LUOT");

  const pricePerCredit = await resolvePurchaseUnitPrice({} as never, state.ledger[0]!.metadata_json as never, "order-1", PACKAGE_CREDITS);
  assert.equal(pricePerCredit, 0);
  assert.equal(computeFifoRefund([{ amount: PACKAGE_CREDITS, unit_price: pricePerCredit }], PACKAGE_CREDITS), 0);
});

test("max_redemptions=1: second user gets 409 DISCOUNT_EXHAUSTED", async () => {
  makeCode({ max_redemptions: 1 });
  await order("user-1", "TANG4LUOT");
  await assertAppError(order("user-2", "TANG4LUOT"), 409, "DISCOUNT_EXHAUSTED");
  assert.equal(state.codes[0]!.redeemed_count, 1);
});

test("max_redemptions=null: many users can redeem", async () => {
  makeCode({ max_redemptions: null });
  for (const user of ["user-1", "user-2", "user-3"]) {
    await order(user, "TANG4LUOT");
  }
  assert.equal(state.codes[0]!.redeemed_count, 3);
});

test("same user redeeming twice gets 409 DISCOUNT_ALREADY_USED", async () => {
  makeCode();
  await order("user-1", "TANG4LUOT");
  await assertAppError(order("user-1", "TANG4LUOT"), 409, "DISCOUNT_ALREADY_USED");
});

test("expired, inactive, unknown and wrong-service codes all return the same 400", async () => {
  makeCode({ code: "EXPIRED", expires_at: new Date(Date.now() - 1000) });
  makeCode({ code: "OFF", is_active: false });
  makeCode({ code: "OTHER", service_type_id: OTHER_TYPE_ID });

  for (const code of ["EXPIRED", "OFF", "OTHER", "NOPE"]) {
    await assertAppError(order("user-1", code), 400, "DISCOUNT_INVALID");
  }
  assert.equal(state.orders.length, 0);
});

test("two parallel requests on a max=1 code: exactly one succeeds", async () => {
  makeCode({ max_redemptions: 1 });
  const results = await Promise.allSettled([order("user-1", "TANG4LUOT"), order("user-2", "TANG4LUOT")]);

  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
  assert.equal((rejected.reason as AppError).code, "DISCOUNT_EXHAUSTED");
  assert.equal(state.codes[0]!.redeemed_count, 1);
  assert.equal(state.redemptions.length, 1);
});

test("failed redemption rolls the whole order back (no orphan order, ledger or counter)", async () => {
  makeCode({ max_redemptions: 5 });
  await order("user-1", "TANG4LUOT");
  await assertAppError(order("user-1", "TANG4LUOT"), 409, "DISCOUNT_ALREADY_USED");

  assert.equal(state.orders.length, 1);
  assert.equal(state.ledger.length, 1);
  assert.equal(state.outbox.length, 1);
  assert.equal(state.codes[0]!.redeemed_count, 1);
});

test("discount check endpoint previews price and is rate limited", async () => {
  makeCode({ percent_off: 25 });
  const preview = await checkDiscountCodeUseCase("user-1", { code: " tang4luot", package_id: "pkg-cp2" });
  assert.deepEqual(preview, {
    code: "TANG4LUOT",
    percent_off: 25,
    list_price: PACKAGE_PRICE,
    discounted_price: 59250,
  });
  assert.equal(state.codes[0]!.redeemed_count, 0);

  for (let i = 1; i < DISCOUNT_CHECK_MAX_ATTEMPTS; i++) {
    await checkDiscountCodeUseCase("user-1", { code: "TANG4LUOT", package_id: "pkg-cp2" });
  }
  await assertAppError(
    checkDiscountCodeUseCase("user-1", { code: "TANG4LUOT", package_id: "pkg-cp2" }),
    429,
    "DISCOUNT_CHECK_RATE_LIMITED",
  );
});

test("rate limit window frees slots after it elapses and is per user", () => {
  const start = 1_000_000;
  for (let i = 0; i < DISCOUNT_CHECK_MAX_ATTEMPTS; i++) {
    assert.ok(claimDiscountCheckSlot("u", start).ok);
  }
  assert.equal(claimDiscountCheckSlot("u", start + 1).ok, false);
  assert.ok(claimDiscountCheckSlot("other", start + 1).ok);
  assert.ok(claimDiscountCheckSlot("u", start + DISCOUNT_CHECK_WINDOW_MS + 1).ok);
});
