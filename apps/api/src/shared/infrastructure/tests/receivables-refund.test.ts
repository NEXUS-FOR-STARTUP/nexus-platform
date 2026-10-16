import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

import { AppError } from "../../domain/app-error.js";
import { assertLotsNotMixed } from "../../../modules/orders/application/funded-lot.guard.js";
import { settleReceivablesForRefundedCreditsInTx } from "../../../modules/receivables/application/settle-refund.js";
import { fundedLot, installFakes, makeReceivable, makeTx, realLot, restoreFakes, store, type FakeReceivable } from "./receivables-fakes.js";

beforeEach(installFakes);
afterEach(restoreFakes);

test("sponsored vs real lots never mix on one (case, service type)", async (t) => {
  await t.test("real purchase onto a sponsored pair is rejected with 409", async () => {
    store.ledger = [fundedLot("r-1", 2, 1)];
    await assert.rejects(
      assertLotsNotMixed(makeTx(), "case-1", "cp1", false),
      (e: unknown) => e instanceof AppError && e.status === 409,
    );
  });

  await t.test("sponsored purchase onto a pair with real credits is rejected with 409", async () => {
    store.ledger = [realLot(2, 1)];
    await assert.rejects(
      assertLotsNotMixed(makeTx(), "case-1", "cp1", true),
      (e: unknown) => e instanceof AppError && e.status === 409,
    );
  });

  await t.test("a pair that was already refunded cannot be sponsored again", async () => {
    store.ledger = [fundedLot("r-1", 2, 1), { type: "refund", amount: -2, created_at: 2, metadata_json: {} }];
    await assert.rejects(assertLotsNotMixed(makeTx(), "case-1", "cp1", true), /đã từng hoàn/);
  });

  await t.test("more sponsored lots, or normal purchases on a clean pair, pass", async () => {
    store.ledger = [fundedLot("r-1", 2, 1)];
    await assertLotsNotMixed(makeTx(), "case-1", "cp1", true);
    store.ledger = [];
    await assertLotsNotMixed(makeTx(), "case-1", "cp1", false);
  });
});

test("refund of sponsored credits writes the right debt off", async (t) => {
  const settle = (balanceBefore: number, refundedCredits: number, eventKey: string) =>
    settleReceivablesForRefundedCreditsInTx(makeTx(), {
      caseId: "case-1",
      serviceTypeId: "cp1",
      balanceBefore,
      refundedCredits,
      eventKey,
    });
  const written = (r: FakeReceivable) => r.adjustments.reduce((s, a) => s + a.amount, 0);

  await t.test("no sponsored lot: nothing is touched", async () => {
    store.ledger = [realLot(2, 1)];
    const r = makeReceivable();
    await settle(2, 2, "k1");
    assert.equal(r.adjustments.length, 0);
  });

  await t.test("markup debt 120.000 on a 2-credit lot is cleared when both credits come back", async () => {
    const r = makeReceivable({ amount_due: 120_000 });
    store.ledger = [fundedLot(r.id, 2, 1)];
    await settle(2, 2, "k1");
    assert.equal(written(r), 120_000);
  });

  await t.test("two lots: the newest lot absorbs the refund first, the other debt is untouched", async () => {
    const a = makeReceivable({ amount_due: 120_000 });
    const b = makeReceivable({ amount_due: 100_000 });
    store.ledger = [fundedLot(a.id, 2, 1), fundedLot(b.id, 2, 2)];
    await settle(3, 1, "k1"); // 1 of the 3 unused credits comes back → newest lot B
    assert.equal(written(b), 50_000);
    assert.equal(written(a), 0);
  });

  await t.test("two lots: refunding all 3 unused clears B fully and A for its 1 unused credit", async () => {
    const a = makeReceivable({ amount_due: 120_000 });
    const b = makeReceivable({ amount_due: 100_000 });
    store.ledger = [fundedLot(a.id, 2, 1), fundedLot(b.id, 2, 2)];
    await settle(3, 3, "k1");
    assert.equal(written(b), 100_000);
    assert.equal(written(a), 60_000);
  });

  await t.test("replaying the same event writes nothing twice", async () => {
    const r = makeReceivable({ amount_due: 100_000 });
    store.ledger = [fundedLot(r.id, 2, 1)];
    await settle(2, 2, "k1");
    await settle(2, 2, "k1");
    assert.equal(r.adjustments.length, 1);
    assert.equal(written(r), 100_000);
  });

  await t.test("write-off never exceeds what is still owed after a part payment", async () => {
    const r = makeReceivable({ amount_due: 100_000 });
    r.payments.push({ applied_amount: 70_000, gross_amount: 70_000, paid_at: new Date(), bank_ref: "x", source: "manual" });
    store.ledger = [fundedLot(r.id, 2, 1)];
    await settle(2, 2, "k1");
    assert.equal(written(r), 30_000);
  });
});
