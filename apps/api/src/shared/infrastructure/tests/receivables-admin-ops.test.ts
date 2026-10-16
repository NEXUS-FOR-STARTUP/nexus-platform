import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

import { AppError } from "../../domain/app-error.js";
import { recordManualPaymentUseCase } from "../../../modules/receivables/application/record-receivable-payment.usecase.js";
import { writeOffReceivableUseCase } from "../../../modules/receivables/application/write-off-receivable.usecase.js";
import { installFakes, makeReceivable, restoreFakes } from "./receivables-fakes.js";

beforeEach(installFakes);
afterEach(restoreFakes);

const pay = (id: string, gross: number, ref: string) =>
  recordManualPaymentUseCase("admin-1", id, { gross_amount: gross, bank_ref: ref, paid_at: "2026-10-16T03:00:00.000Z" });
const writeOff = (id: string, amount: number, key: string, reason = "Khách xin giảm") =>
  writeOffReceivableUseCase("admin-1", id, { request_key: key, amount, reason });
const rejectsWith = (p: Promise<unknown>, status: number) =>
  assert.rejects(p, (e: unknown) => e instanceof AppError && e.status === status);

const KEY_A = "11111111-1111-4111-8111-111111111111";
const KEY_B = "22222222-2222-4222-8222-222222222222";

test("manual payment", async (t) => {
  await t.test("two part payments settle the debt", async () => {
    const r = makeReceivable();
    assert.equal((await pay(r.id, 30_000, "A1")).status, "partial");
    const done = await pay(r.id, 49_000, "A2");
    assert.equal(done.status, "settled");
    assert.equal(done.outstanding, 0);
  });

  await t.test("paying more than is owed is 409 and records nothing", async () => {
    const r = makeReceivable();
    await rejectsWith(pay(r.id, 80_000, "A1"), 409);
    assert.equal(r.payments.length, 0);
  });

  await t.test("the same bank reference twice is 409 and only the first counts", async () => {
    const r = makeReceivable();
    await pay(r.id, 30_000, "A1");
    await rejectsWith(pay(r.id, 30_000, "A1"), 409);
    assert.equal(r.payments.length, 1);
  });

  await t.test("zero, negative and fractional amounts are 400", async () => {
    const r = makeReceivable();
    for (const gross of [0, -1, 100.5]) await rejectsWith(pay(r.id, gross, "Z"), 400);
  });

  await t.test("unknown debt is 404", async () => {
    await rejectsWith(pay("missing", 1_000, "A1"), 404);
  });
});

test("write-off", async (t) => {
  await t.test("clearing the whole debt with no payment makes it written_off", async () => {
    const r = makeReceivable();
    const out = await writeOff(r.id, 79_000, KEY_A);
    assert.equal(out.status, "written_off");
    assert.equal(out.outstanding, 0);
  });

  await t.test("more than is still owed is 409, a missing or tiny reason is 400", async () => {
    const r = makeReceivable();
    await pay(r.id, 70_000, "A1");
    await rejectsWith(writeOff(r.id, 20_000, KEY_A), 409);
    await rejectsWith(writeOff(r.id, 1_000, KEY_A, ""), 400);
    assert.equal(r.adjustments.length, 0);
  });

  await t.test("retrying the same request_key does not write off twice", async () => {
    const r = makeReceivable();
    await writeOff(r.id, 10_000, KEY_A);
    const again = await writeOff(r.id, 10_000, KEY_A);
    assert.equal(r.adjustments.length, 1);
    assert.equal(again.outstanding, 69_000);
  });

  await t.test("a request_key already used by another debt is 409", async () => {
    const a = makeReceivable();
    const b = makeReceivable();
    await writeOff(a.id, 10_000, KEY_A);
    await rejectsWith(writeOff(b.id, 10_000, KEY_A), 409);
    assert.equal(b.adjustments.length, 0);
    await writeOff(b.id, 10_000, KEY_B);
  });

  await t.test("overdue only while owed: a written-off past-due debt is not overdue", async () => {
    const r = makeReceivable({ due_at: new Date("2026-01-01") });
    assert.equal((await pay(r.id, 10_000, "A1")).status, "overdue");
    assert.equal((await writeOff(r.id, 69_000, KEY_A)).status, "settled");
  });
});
