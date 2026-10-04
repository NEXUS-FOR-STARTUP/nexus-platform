import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeFifoRefund,
  resolvePurchaseUnitPrice,
  refundRemainingCreditInTx,
  refundCaseAllInTx,
  refundIdempotencyKey,
  REFUND_CREDIT_KEY_PREFIX,
} from "../../../services/credit-refund.js";
import { walletService } from "../../../modules/wallet/application/wallet.service.js";

test("phase-08 refund — computeFifoRefund walks purchases DESC (newest first)", async (t) => {

  await t.test("mua 3@39k rồi 2@49k, tiêu 2 → hoàn 137,000 VND", () => {
    const purchases = [
      { amount: 2, unit_price: 49000 },
      { amount: 3, unit_price: 39000 },
    ];
    assert.strictEqual(computeFifoRefund(purchases, 3), 137000);
  });

  await t.test("consumption ăn credit cũ trước — refund ăn giá mới trước (DESC)", () => {
    const purchases = [
      { amount: 1, unit_price: 50000 },
      { amount: 3, unit_price: 30000 },
    ];
    assert.strictEqual(computeFifoRefund(purchases, 2), 80000);
  });

  await t.test("balance 0 → không hoàn gì", () => {
    assert.strictEqual(computeFifoRefund([{ amount: 2, unit_price: 39000 }], 0), 0);
  });

  await t.test("không có purchase → 0", () => {
    assert.strictEqual(computeFifoRefund([], 3), 0);
  });

  await t.test("unit_price 0 (không resolve được giá) → tiêu credit nhưng không hoàn VND", () => {
    assert.strictEqual(computeFifoRefund([{ amount: 2, unit_price: 0 }], 2), 0);
  });

  await t.test("balance vượt tổng purchase → cap theo tổng số credit đã mua", () => {
    assert.strictEqual(computeFifoRefund([{ amount: 2, unit_price: 39000 }], 5), 78000);
  });

  await t.test("một purchase đúng bằng balance", () => {
    assert.strictEqual(computeFifoRefund([{ amount: 2, unit_price: 49000 }], 2), 98000);
  });

  await t.test("walk không vượt quá balance (partial take ở purchase cuối)", () => {
    const purchases = [
      { amount: 4, unit_price: 49000 },
      { amount: 4, unit_price: 39000 },
    ];
    assert.strictEqual(computeFifoRefund(purchases, 6), 274000);
  });
});

test("phase-08 refund — idempotency key refund-credit-{caseId} chống hoàn kép", async (t) => {
  await t.test("prefix đúng contract", () => {
    assert.strictEqual(REFUND_CREDIT_KEY_PREFIX, "refund-credit");
  });

  await t.test("key format refund-credit-{caseId}", () => {
    assert.strictEqual(refundIdempotencyKey("case-abc"), "refund-credit-case-abc");
  });

  await t.test("deterministic — cùng caseId luôn cùng key", () => {
    assert.strictEqual(
      refundIdempotencyKey("case-abc"),
      refundIdempotencyKey("case-abc"),
    );
  });

  await t.test("key khác nhau theo caseId", () => {
    assert.notStrictEqual(
      refundIdempotencyKey("case-1"),
      refundIdempotencyKey("case-2"),
    );
  });

  await t.test("key chứa đầy đủ caseId (định danh 1:1)", () => {
    const key = refundIdempotencyKey("9f3d2c1b");
    assert.ok(key.endsWith("-9f3d2c1b"));
    assert.strictEqual(key.split("-").length, 3);
  });
});

test("phase-08 refund — resolvePurchaseUnitPrice resolves price per credit correctly", async (t) => {

  await t.test("metadata có price_per_credit: 39500 → ưu tiên trả về 39500", async () => {
    const dummyTx = {} as any;
    const result = await resolvePurchaseUnitPrice(
      dummyTx,
      { price_per_credit: 39500, unit_price: 79000, credits_granted: 2 },
      null,
      2,
    );
    assert.strictEqual(result, 39500);
  });

  await t.test("mua gói 79k được 2 lượt (metadata cũ có unit_price: 79000, credits_granted: 2) → 39500", async () => {
    const dummyTx = {} as any;
    const result = await resolvePurchaseUnitPrice(
      dummyTx,
      { order_id: "order-1", quantity: 1, unit_price: 79000, credits_granted: 2 },
      null,
      2,
    );
    assert.strictEqual(result, 39500);
  });

  await t.test("mua 2 gói 79k được 4 lượt (quantity: 2, unit_price: 79000, credits_granted: 4) → 39500", async () => {
    const dummyTx = {} as any;
    const result = await resolvePurchaseUnitPrice(
      dummyTx,
      { order_id: "order-2", quantity: 2, unit_price: 79000, credits_granted: 4 },
      null,
      4,
    );
    assert.strictEqual(result, 39500);
  });

  await t.test("mua gói 1 lượt 39k (quantity: 1, unit_price: 39000, credits_granted: 1) → 39000", async () => {
    const dummyTx = {} as any;
    const result = await resolvePurchaseUnitPrice(
      dummyTx,
      { order_id: "order-3", quantity: 1, unit_price: 39000, credits_granted: 1 },
      null,
      1,
    );
    assert.strictEqual(result, 39000);
  });

  await t.test("fallback orderItem: orderItem.amount 79000 với 2 credits → 39500", async () => {
    const mockTx = {
      orderItem: {
        findFirst: async () => ({ unit_price: 79000, amount: 79000 }),
      },
    } as any;
    const result = await resolvePurchaseUnitPrice(mockTx, null, "order-item-ref", 2);
    assert.strictEqual(result, 39500);
  });

  await t.test("fallback payment: payment.amount 39000 với 1 credit → 39000", async () => {
    const mockTx = {
      orderItem: {
        findFirst: async () => null,
      },
      payment: {
        findUnique: async () => ({ amount: 39000 }),
      },
    } as any;
    const result = await resolvePurchaseUnitPrice(mockTx, null, "payment-ref", 1);
    assert.strictEqual(result, 39000);
  });
});

test("phase-08 refund regression — mua gói 79k có 2 lượt, xoá case không bị hoàn 158k", async (t) => {

  await t.test("còn nguyên 2 lượt: hoàn đúng 79,000 VND (KHÔNG PHẢI 158,000 VND)", async () => {
    const dummyTx = {} as any;
    const unitPricePerCredit = await resolvePurchaseUnitPrice(
      dummyTx,
      { order_id: "order-79k", quantity: 1, unit_price: 79000, credits_granted: 2 },
      null,
      2,
    );
    assert.strictEqual(unitPricePerCredit, 39500);

    const purchases = [{ amount: 2, unit_price: unitPricePerCredit }];
    const refundVnd = computeFifoRefund(purchases, 2);
    assert.strictEqual(refundVnd, 79000);
  });

  await t.test("đã dùng 1 lượt (còn 1 lượt): hoàn 39,500 VND (KHÔNG PHẢI 79,000 VND)", async () => {
    const dummyTx = {} as any;
    const unitPricePerCredit = await resolvePurchaseUnitPrice(
      dummyTx,
      { order_id: "order-79k", quantity: 1, unit_price: 79000, credits_granted: 2 },
      null,
      2,
    );
    const purchases = [{ amount: 2, unit_price: unitPricePerCredit }];
    const refundVnd = computeFifoRefund(purchases, 1);
    assert.strictEqual(refundVnd, 39500);
  });

  await t.test("đã dùng hết 2 lượt (còn 0 lượt): hoàn 0 VND", async () => {
    const dummyTx = {} as any;
    const unitPricePerCredit = await resolvePurchaseUnitPrice(
      dummyTx,
      { order_id: "order-79k", quantity: 1, unit_price: 79000, credits_granted: 2 },
      null,
      2,
    );
    const purchases = [{ amount: 2, unit_price: unitPricePerCredit }];
    const refundVnd = computeFifoRefund(purchases, 0);
    assert.strictEqual(refundVnd, 0);
  });
});

test("phase-08 refund regression — refundRemainingCreditInTx hoàn đúng 79k khi xoá case có 2 credit từ gói 79k", async () => {
  const refundCalls: any[] = [];
  const creditLedgerCreateCalls: any[] = [];

  const mockableWallet = walletService as unknown as { refund: (...args: any[]) => Promise<void> };
  const originalRefund = mockableWallet.refund;
  mockableWallet.refund = async (...args: any[]) => {
    refundCalls.push(args);
  };

  try {
    const mockTx = {
      creditLedger: {
        aggregate: async () => ({ _sum: { amount: 2 } }),
        findMany: async () => [
          {
            amount: 2,
            reference_id: "order-79k",
            metadata_json: {
              order_id: "order-79k",
              quantity: 1,
              unit_price: 79000,
              credits_granted: 2,
            },
          },
        ],
        create: async (data: any) => {
          creditLedgerCreateCalls.push(data);
          return data;
        },
      },
      case: {
        findUnique: async () => ({ owner_auth_user_id: "user-123" }),
      },
      walletTransaction: {
        findUnique: async () => null,
      },
    } as any;

    await refundRemainingCreditInTx(mockTx, "case-test-1", "user-123");

    assert.strictEqual(refundCalls.length, 1);
    assert.strictEqual(refundCalls[0][0], "user-123");
    assert.strictEqual(refundCalls[0][1], 79000); // 79,000 VND (NOT 158,000 VND!)
    assert.strictEqual(refundCalls[0][2], "case_refund");
    assert.strictEqual(refundCalls[0][3], "case-test-1");

    assert.strictEqual(creditLedgerCreateCalls.length, 1);
    assert.strictEqual(creditLedgerCreateCalls[0].data.amount, -2);
    assert.strictEqual(creditLedgerCreateCalls[0].data.metadata_json.refund_vnd, 79000);
  } finally {
    mockableWallet.refund = originalRefund;
  }
});

test("phase-08 refund regression — refundCaseAllInTx không cộng trùng lockedPrice và fifoVnd", async (t) => {
  await t.test("gói 79k có 2 lượt, T13_VETO hoàn đúng 79k (KHÔNG PHẢI 158k)", async () => {
    const refundCalls: any[] = [];
    const mockableWallet = walletService as unknown as { refund: (...args: any[]) => Promise<void> };
    const originalRefund = mockableWallet.refund;
    mockableWallet.refund = async (...args: any[]) => {
      refundCalls.push(args);
    };

    try {
      const mockTx = {
        creditLedger: {
          aggregate: async () => ({ _sum: { amount: 2 } }),
          findMany: async () => [
            {
              amount: 2,
              reference_id: "order-79k",
              metadata_json: {
                order_id: "order-79k",
                quantity: 1,
                unit_price: 79000,
                credits_granted: 2,
              },
            },
          ],
          create: async (data: any) => data,
        },
        walletTransaction: {
          findUnique: async () => null,
        },
      } as any;

      await refundCaseAllInTx(mockTx, "case-veto-1", "user-1", 79000);

      assert.strictEqual(refundCalls.length, 1);
      assert.strictEqual(refundCalls[0][0], "user-1");
      assert.strictEqual(refundCalls[0][1], 79000); // 79,000 VND (NOT 158,000 VND!)
    } finally {
      mockableWallet.refund = originalRefund;
    }
  });

  await t.test("gói 79k đã dùng 1 lượt (còn 1 lượt = 39.5k), T13_VETO hoàn đúng giá trị lượt chưa dùng 39.5k", async () => {
    const refundCalls: any[] = [];
    const mockableWallet = walletService as unknown as { refund: (...args: any[]) => Promise<void> };
    const originalRefund = mockableWallet.refund;
    mockableWallet.refund = async (...args: any[]) => {
      refundCalls.push(args);
    };

    try {
      const mockTx = {
        creditLedger: {
          aggregate: async () => ({ _sum: { amount: 1 } }),
          findMany: async () => [
            {
              amount: 2,
              reference_id: "order-79k",
              metadata_json: {
                order_id: "order-79k",
                quantity: 1,
                unit_price: 79000,
                credits_granted: 2,
              },
            },
          ],
          create: async (data: any) => data,
        },
        walletTransaction: {
          findUnique: async () => null,
        },
      } as any;

      await refundCaseAllInTx(mockTx, "case-veto-2", "user-1", 79000);

      assert.strictEqual(refundCalls.length, 1);
      assert.strictEqual(refundCalls[0][1], 39500); // fifoVnd = 39500 (lượt đã dùng không hoàn)
    } finally {
      mockableWallet.refund = originalRefund;
    }
  });

  await t.test("mua thêm gói nâng cao (4 lượt = 158k), T13_VETO hoàn đủ 158k", async () => {
    const refundCalls: any[] = [];
    const mockableWallet = walletService as unknown as { refund: (...args: any[]) => Promise<void> };
    const originalRefund = mockableWallet.refund;
    mockableWallet.refund = async (...args: any[]) => {
      refundCalls.push(args);
    };

    try {
      const mockTx = {
        creditLedger: {
          aggregate: async () => ({ _sum: { amount: 4 } }),
          findMany: async () => [
            {
              amount: 4,
              reference_id: "order-158k",
              metadata_json: {
                order_id: "order-158k",
                quantity: 2,
                unit_price: 79000,
                credits_granted: 4,
              },
            },
          ],
          create: async (data: any) => data,
        },
        walletTransaction: {
          findUnique: async () => null,
        },
      } as any;

      await refundCaseAllInTx(mockTx, "case-veto-3", "user-1", 79000);

      assert.strictEqual(refundCalls.length, 1);
      assert.strictEqual(refundCalls[0][1], 158000); // fifoVnd = 158000
    } finally {
      mockableWallet.refund = originalRefund;
    }
  });

  await t.test("case legacy không có credit purchases trong ledger → hoàn lockedPrice", async () => {
    const refundCalls: any[] = [];
    const mockableWallet = walletService as unknown as { refund: (...args: any[]) => Promise<void> };
    const originalRefund = mockableWallet.refund;
    mockableWallet.refund = async (...args: any[]) => {
      refundCalls.push(args);
    };

    try {
      const mockTx = {
        creditLedger: {
          aggregate: async () => ({ _sum: { amount: 0 } }),
          findMany: async () => [],
          create: async (data: any) => data,
        },
        walletTransaction: {
          findUnique: async () => null,
        },
      } as any;

      await refundCaseAllInTx(mockTx, "case-legacy-1", "user-1", 149000);

      assert.strictEqual(refundCalls.length, 1);
      assert.strictEqual(refundCalls[0][1], 149000); // lockedPrice = 149000
    } finally {
      mockableWallet.refund = originalRefund;
    }
  });
});
