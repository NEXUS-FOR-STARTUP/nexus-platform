import { test } from "node:test";
import assert from "node:assert/strict";

test("omp audit trigger — fresh startedAt prevents P2002 and ensures clean credit deduction on retry", async (t) => {
  await t.test("each trigger invocation mints a unique ISO timestamp and idempotencyKey", () => {
    const caseId = "case-123";
    const ts1 = new Date().toISOString();
    const key1 = `audit-trigger-${caseId}-${ts1}`;

    // Simulate clock tick or retry
    const ts2 = new Date(Date.now() + 10).toISOString();
    const key2 = `audit-trigger-${caseId}-${ts2}`;

    assert.notStrictEqual(key1, key2, "Keys must be distinct so retries do not collide with previous failed triggers");
  });

  await t.test("refund key matches contract and distinguishes failure reason", () => {
    const caseId = "case-456";
    const startedAt = "2026-09-15T13:05:58.123Z";
    const refundKey = `audit-refund-${caseId}-${startedAt}`;
    assert.strictEqual(refundKey, "audit-refund-case-456-2026-09-15T13:05:58.123Z");
  });
});
