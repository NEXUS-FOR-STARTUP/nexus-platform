import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

import { prisma } from "../../../db.js";
import { AppError } from "../../domain/app-error.js";
import { getPublicReceivableUseCase } from "../../../modules/receivables/application/public-receivable.usecase.js";
import {
  PUBLIC_RECEIVABLE_MAX_TRACKED_IPS,
  checkPublicReceivableRateLimit,
  resetPublicReceivableRateLimitForTests,
} from "../../../modules/receivables/application/public-receivable-rate-limit.js";
import { hashPublicToken } from "../../../modules/receivables/domain/receivable.domain.js";
import { sepayWebhookUseCase } from "../../../modules/payments/application/sepay-webhook.usecase.js";
import { installFakes, makeReceivable, restoreFakes } from "./receivables-fakes.js";

beforeEach(() => {
  installFakes();
  resetPublicReceivableRateLimitForTests();
});
afterEach(restoreFakes);

test("SePay webhook for debt codes", async (t) => {
  const pay = (id: number, amount: number, code = "CRDEBT000001") =>
    sepayWebhookUseCase({
      id,
      gateway: "BIDV",
      transactionDate: "2026-10-16 10:00:00",
      accountNumber: "1",
      code,
      content: `CK ${code}`,
      transferType: "in",
      transferAmount: amount,
      accumulated: 0,
      subAccount: null,
      referenceCode: "x",
    });

  await t.test("exact payment settles; resending the same id records nothing new", async () => {
    const r = makeReceivable();
    assert.deepEqual(await pay(5001, 79_000), { matched: true, action: "verified" });
    assert.deepEqual(await pay(5001, 79_000), { matched: true, action: "duplicate" });
    assert.equal(r.payments.length, 1);
    assert.equal(r.payments[0]!.applied_amount, 79_000);
    assert.equal(r.review_reason, null);
  });

  await t.test("underpayment records the partial amount", async () => {
    const r = makeReceivable();
    await pay(5002, 30_000);
    assert.equal(r.payments[0]!.applied_amount, 30_000);
  });

  await t.test("overpayment keeps the real money in gross and flags the debt for review", async () => {
    const r = makeReceivable();
    await pay(5001, 100_000);
    assert.equal(r.payments.length, 1);
    assert.equal(r.payments[0]!.gross_amount, 100_000);
    assert.equal(r.payments[0]!.applied_amount, 79_000);
    assert.equal(r.review_reason, "overpaid");
    await pay(5001, 100_000); // replay
    assert.equal(r.payments.length, 1);
  });

  await t.test("a debt that is already settled still records new money with applied 0", async () => {
    const r = makeReceivable();
    await pay(5001, 79_000);
    await pay(5002, 10_000);
    assert.equal(r.payments[1]!.gross_amount, 10_000);
    assert.equal(r.payments[1]!.applied_amount, 0);
  });

  await t.test("the same bank id under another debt code or another amount is NOT acknowledged as a duplicate", async () => {
    const a = makeReceivable();
    const b = makeReceivable();
    await pay(5001, 79_000, a.code);
    await assert.rejects(pay(5001, 79_000, b.code), (e: unknown) => e instanceof AppError && e.status === 409);
    await assert.rejects(pay(5001, 50_000, a.code), (e: unknown) => e instanceof AppError && e.status === 409);
    assert.equal(b.payments.length, 0);
    assert.equal(a.payments.length, 1);
  });

  await t.test("a manually recorded payment with the same bank id is a conflict, not a processed SePay event", async () => {
    const r = makeReceivable();
    r.payments.push({ applied_amount: 79_000, gross_amount: 79_000, paid_at: new Date(), bank_ref: "5001", source: "manual" });
    await assert.rejects(pay(5001, 79_000, r.code), (e: unknown) => e instanceof AppError && e.status === 409);
  });

  await t.test("unknown debt code is no_match", async () => {
    assert.deepEqual(await pay(5003, 79_000, "CRDEBTFFFFFF"), { matched: false, action: "no_match" });
  });

  await t.test("debt codes never reach the Deposit lookup; top-up codes still do", async () => {
    let depositLookups = 0;
    Reflect.set(prisma.deposit, "findFirst", async () => {
      depositLookups++;
      return null;
    });
    makeReceivable();
    await pay(5004, 79_000);
    assert.equal(depositLookups, 0);
    await pay(5005, 79_000, "CRTOPUP1A2B3C");
    assert.equal(depositLookups, 1);
  });
});

test("public payment page by token", async (t) => {
  const TOKEN = "t".repeat(43);

  await t.test("returns only the minimal DTO, no customer or internal data", async () => {
    makeReceivable({ public_token_hash: hashPublicToken(TOKEN) });
    const dto = await getPublicReceivableUseCase(TOKEN);
    assert.deepEqual(Object.keys(dto).sort(), ["amount_due", "bank_info", "code", "created_at", "outstanding", "paid_at", "status"]);
    const raw = JSON.stringify(dto);
    for (const secret of ["Khach Zalo", "0909 000 111", "case-1", "order-1", "r-1"]) {
      assert.ok(!raw.includes(secret), `leaked ${secret}`);
    }
    assert.equal(dto.outstanding, 79_000);
    assert.ok(dto.bank_info.qr_url.includes("amount=79000"));
  });

  await t.test("QR follows the remaining amount after a part payment, and settled shows paid_at", async () => {
    const r = makeReceivable({ public_token_hash: hashPublicToken(TOKEN) });
    r.payments.push({ applied_amount: 30_000, gross_amount: 30_000, paid_at: new Date("2026-10-15"), bank_ref: "a", source: "manual" });
    assert.ok((await getPublicReceivableUseCase(TOKEN)).bank_info.qr_url.includes("amount=49000"));
    r.payments.push({ applied_amount: 49_000, gross_amount: 49_000, paid_at: new Date("2026-10-16"), bank_ref: "b", source: "manual" });
    const done = await getPublicReceivableUseCase(TOKEN);
    assert.equal(done.status, "settled");
    assert.equal(done.paid_at, new Date("2026-10-16").toISOString());
  });

  await t.test("wrong token, near-miss token and rotated token all give the same 404", async () => {
    const r = makeReceivable({ public_token_hash: hashPublicToken(TOKEN) });
    const same = (token: string) =>
      assert.rejects(
        getPublicReceivableUseCase(token),
        (e: unknown) => e instanceof AppError && e.status === 404 && e.message === "Liên kết không hợp lệ hoặc đã hết hạn",
      );
    await same("nope");
    await same(`${TOKEN.slice(0, -1)}u`);
    r.public_token_hash = hashPublicToken("rotated-token"); // link was rotated: old token dies
    await same(TOKEN);
    assert.equal((await getPublicReceivableUseCase("rotated-token")).code, r.code);
  });

  await t.test("with 5000 active IPs tracked, an unseen IP is rejected while tracked IPs keep working", () => {
    for (let i = 0; i < PUBLIC_RECEIVABLE_MAX_TRACKED_IPS; i++) checkPublicReceivableRateLimit(`10.0.${i >> 8}.${i & 255}`, 1_000);
    assert.throws(() => checkPublicReceivableRateLimit("203.0.113.9", 1_000), (e: unknown) => e instanceof AppError && e.status === 429);
    checkPublicReceivableRateLimit("10.0.0.0", 1_000); // already tracked: still served
    checkPublicReceivableRateLimit("203.0.113.9", 61_001); // old entries expired: room again
  });

  await t.test("rate limit blocks the 61st request in a minute and recovers after it", () => {
    for (let i = 0; i < 60; i++) checkPublicReceivableRateLimit("1.2.3.4", 1_000);
    assert.throws(() => checkPublicReceivableRateLimit("1.2.3.4", 1_000), (e: unknown) => e instanceof AppError && e.status === 429);
    checkPublicReceivableRateLimit("5.6.7.8", 1_000); // other IP unaffected
    checkPublicReceivableRateLimit("1.2.3.4", 61_001);
  });
});
