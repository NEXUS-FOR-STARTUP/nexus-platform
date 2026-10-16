import { test } from "node:test";
import assert from "node:assert/strict";

import {
  allocateRefundToLots,
  computeReceivableState,
  computeRefundWriteOff,
  generatePublicToken,
  generateReceivableCode,
  hashPublicToken,
} from "../../../modules/receivables/domain/receivable.domain.js";

const NOW = new Date("2026-10-16T00:00:00Z");
const FUTURE = new Date("2026-10-20T00:00:00Z");
const PAST = new Date("2026-10-10T00:00:00Z");
const totals = (o: Partial<{ amountDue: number; applied: number; gross: number; writtenOff: number }> = {}) => ({
  amountDue: 79_000,
  applied: 0,
  gross: 0,
  writtenOff: 0,
  ...o,
});

test("receivable status is derived from payments and adjustments", async (t) => {
  await t.test("open, partial, overdue, settled, written_off", () => {
    assert.equal(computeReceivableState(totals(), FUTURE, NOW).status, "open");
    assert.equal(computeReceivableState(totals({ applied: 30_000, gross: 30_000 }), FUTURE, NOW).status, "partial");
    assert.equal(computeReceivableState(totals({ applied: 79_000, gross: 79_000 }), FUTURE, NOW).status, "settled");
    assert.equal(computeReceivableState(totals({ writtenOff: 79_000 }), FUTURE, NOW).status, "written_off");
  });

  await t.test("overdue only while something is still owed", () => {
    assert.equal(computeReceivableState(totals(), PAST, NOW).status, "overdue");
    assert.equal(computeReceivableState(totals({ applied: 79_000, gross: 79_000 }), PAST, NOW).status, "settled");
    assert.equal(computeReceivableState(totals({ writtenOff: 79_000 }), PAST, NOW).status, "written_off");
  });

  await t.test("overpayment keeps gross, never makes outstanding negative", () => {
    // owed 79.000, bank reported 100.000: applied 79.000, 21.000 to give back
    const s = computeReceivableState(totals({ applied: 79_000, gross: 100_000 }), FUTURE, NOW);
    assert.equal(s.outstanding, 0);
    assert.equal(s.overpaid, 21_000);
    assert.equal(s.paid, 79_000);
  });

  await t.test("write-off plus payment can cover the debt together", () => {
    const s = computeReceivableState(totals({ applied: 50_000, gross: 50_000, writtenOff: 29_000 }), FUTURE, NOW);
    assert.equal(s.outstanding, 0);
    assert.equal(s.status, "settled");
  });
});

test("refund allocation across sponsored lots (newest first)", async (t) => {
  // A: old order, 2 credits. B: newer order, 2 credits. 1 credit consumed (older lot A first), 3 left.
  const lots = [
    { receivableId: "B", credits: 2 },
    { receivableId: "A", credits: 2 },
  ];

  await t.test("refunding all 3 unused: B takes 2, A takes 1", () => {
    assert.deepEqual(allocateRefundToLots(lots, 3, 3), [
      { receivableId: "B", credits: 2 },
      { receivableId: "A", credits: 1 },
    ]);
  });

  await t.test("refunding 1 credit goes to the newest lot only", () => {
    assert.deepEqual(allocateRefundToLots(lots, 3, 1), [{ receivableId: "B", credits: 1 }]);
  });

  await t.test("a refund larger than the unused credits fails instead of guessing", () => {
    assert.throws(() => allocateRefundToLots(lots, 3, 4), /allocation mismatch/);
  });

  await t.test("nothing unused allocates nothing", () => {
    assert.deepEqual(allocateRefundToLots(lots, 0, 0), []);
  });
});

test("cumulative refund write-off", async (t) => {
  const writeOffs = (amountDue: number, lotCredits: number, steps: number[], outstanding = amountDue) => {
    let credits = 0;
    let written = 0;
    const out: number[] = [];
    for (const step of steps) {
      credits += step;
      const delta = computeRefundWriteOff({
        amountDue,
        lotCredits,
        cumulativeRefundedCredits: credits,
        alreadyWrittenOffByRefund: written,
        outstanding: outstanding - written,
      });
      written += delta;
      out.push(delta);
    }
    return out;
  };

  await t.test("markup debt of 120.000 for a 79.000 order is fully cleared, not left at 41.000", () => {
    assert.deepEqual(writeOffs(120_000, 2, [2]), [120_000]);
    assert.deepEqual(writeOffs(120_000, 2, [1]), [60_000]);
  });

  await t.test("odd amounts add up exactly across events", () => {
    const deltas = writeOffs(100_001, 3, [1, 1, 1]);
    assert.deepEqual(deltas, [33_334, 33_333, 33_334]);
    assert.equal(deltas.reduce((a, b) => a + b, 0), 100_001);
    // same total whether refunded 1+1+1 or 2+1
    assert.equal(writeOffs(100_001, 3, [2, 1]).reduce((a, b) => a + b, 0), 100_001);
  });

  await t.test("never writes off more than is still owed (customer already paid part)", () => {
    // owed 100.000, customer paid 70.000 → 30.000 outstanding; refunding everything caps at 30.000
    const delta = computeRefundWriteOff({
      amountDue: 100_000,
      lotCredits: 2,
      cumulativeRefundedCredits: 2,
      alreadyWrittenOffByRefund: 0,
      outstanding: 30_000,
    });
    assert.equal(delta, 30_000);
  });
});

test("tokens, codes and policy", async (t) => {
  await t.test("token is random, only its hash is stable", () => {
    const a = generatePublicToken();
    const b = generatePublicToken();
    assert.notEqual(a.token, b.token);
    assert.equal(a.hash, hashPublicToken(a.token));
    assert.notEqual(a.hash, hashPublicToken(`${a.token}x`));
    assert.notEqual(a.hash, a.token);
    assert.match(a.token, /^[A-Za-z0-9_-]{43}$/);
  });

  await t.test("debt code starts with CR (SePay regex) but is not a top-up code", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReceivableCode();
      assert.match(code, /^CRDEBT[0-9A-F]{6}$/);
      assert.match(code, /CR[A-Z0-9]{6,}/);
      assert.ok(!code.startsWith("CRTOPUP"));
    }
  });
});
