import { test } from "node:test";
import assert from "node:assert/strict";

test("phase-08 refund — computeFifoRefund walks purchases DESC (newest first)", async (t) => {
  const { computeFifoRefund } = await import("../../../services/credit-refund.js");

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
  const { refundIdempotencyKey, REFUND_CREDIT_KEY_PREFIX } = await import(
    "../../../services/credit-refund.js"
  );

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
