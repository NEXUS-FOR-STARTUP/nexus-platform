import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

import { AppError } from "../../domain/app-error.js";
import { walletService } from "../../../modules/wallet/application/wallet.service.js";
import { createReceivableUseCase } from "../../../modules/receivables/application/create-receivable.usecase.js";
import { body, GOOD_CONTACT, installCreateFakes, rejectsWith, restoreCreateFakes, world } from "./receivables-create-fakes.js";

beforeEach(installCreateFakes);
afterEach(restoreCreateFakes);

const walletCalls = () => world.calls.filter((c) => /^(grant|withdraw)/.test(c));

test("create receivable with a sponsored purchase", async (t) => {
  await t.test("grants exactly the order price, spends it, flags the lot as sponsored, links debt to order and grant", async () => {
    const out = await createReceivableUseCase("admin-1", body());
    assert.deepEqual(walletCalls(), ["grant:79000", "withdraw:79000"]);
    assert.equal(world.ledger.length, 1);
    assert.equal(world.ledger[0]!.metadata_json["price_per_credit"], 0);
    assert.equal(world.ledger[0]!.metadata_json["funded_by_receivable_id"], world.receivables[0]!.id);
    assert.equal(world.receivables[0]!.order_id, "order-1");
    assert.equal(world.receivables[0]!.grant_tx_id, "grant-tx-1");
    assert.match(out.code, /^CRDEBT[0-9A-F]{6}$/);
    assert.equal(out.amount_due, 79_000);
    assert.equal(out.outstanding, 79_000);
  });

  await t.test("same request_key and same data returns the old debt without a second grant", async () => {
    await createReceivableUseCase("admin-1", body());
    const again = await createReceivableUseCase("admin-1", body());
    assert.equal(again.replayed, true);
    assert.equal(world.receivables.length, 1);
    assert.equal(world.calls.filter((c) => c.startsWith("grant")).length, 1);
  });

  await t.test("replay after the case profile changed returns the original debt and snapshot", async () => {
    await createReceivableUseCase("admin-1", body());
    world.contact = { ...GOOD_CONTACT, full_name: "Ten Moi", zalo: "0911222333", email: "moi@x.vn" };
    const again = await createReceivableUseCase("admin-1", body());
    assert.equal(again.replayed, true);
    assert.equal(again.customer_name, "Nguyen Van A");
    assert.equal(world.receivables.length, 1);
    world.contact = null; // even a now-incomplete profile does not block a replay
    assert.equal((await createReceivableUseCase("admin-1", body())).replayed, true);
  });

  await t.test("same request_key with ANY different field is 409 and writes nothing", async () => {
    await createReceivableUseCase("admin-1", body());
    const before = world.calls.length;
    const purchase = (over: Record<string, unknown>) => ({
      package_id: "pkg_ai_audit", quantity: 1, ...over,
    });
    const variants: Record<string, unknown>[] = [
      { amount_due: 90_000 },
      { case_id: "case-2" },
      { due_at: "2026-10-25T00:00:00.000Z" },
      { purchase: purchase({ package_id: "pkg_cp2_audit" }) },
      { purchase: purchase({ quantity: 2 }) },
      { purchase: purchase({ manual_trigger: false }) },
      { purchase: undefined },
    ];
    for (const variant of variants) {
      await rejectsWith(createReceivableUseCase("admin-1", body(variant)), 409);
    }
    assert.equal(world.calls.length, before);
    assert.equal(world.receivables.length, 1);
  });
});

test("create receivable rejections leave nothing behind", async (t) => {
  const nothingWritten = () => assert.equal(world.receivables.length + world.calls.length, 0);

  await t.test("amount_due below the order price is 400", async () => {
    await rejectsWith(createReceivableUseCase("admin-1", body({ amount_due: 50_000 })), 400);
    nothingWritten();
  });

  await t.test("no configured system account is 409 and the client cannot pick a wallet", async () => {
    world.systemUser = null;
    await rejectsWith(createReceivableUseCase("admin-1", body()), 409);
    nothingWritten();
  });

  await t.test("a case that is not the beneficiary's is 403, with or without a purchase", async () => {
    world.caseOwner = "someone-else";
    await rejectsWith(createReceivableUseCase("admin-1", body()), 403);
    await rejectsWith(createReceivableUseCase("admin-1", body({ purchase: undefined })), 403);
    nothingWritten();
  });

  await t.test("a missing case is 404", async () => {
    world.caseMissing = true;
    await rejectsWith(createReceivableUseCase("admin-1", body()), 404);
    nothingWritten();
  });

  await t.test("incomplete case contact is 409 CASE_CONTACT_INCOMPLETE and writes nothing", async () => {
    const bad: (Record<string, string> | null)[] = [
      null,
      { ...GOOD_CONTACT, full_name: " " },
      { ...GOOD_CONTACT, zalo: "123" },
      { ...GOOD_CONTACT, email: "no-at" },
    ];
    for (const contact of bad) {
      world.contact = contact;
      await assert.rejects(
        createReceivableUseCase("admin-1", body({ purchase: undefined })),
        (e: unknown) => e instanceof AppError && e.status === 409 && e.code === "CASE_CONTACT_INCOMPLETE",
      );
    }
    nothingWritten();
  });

  await t.test("a sponsored purchase onto a case with real credits is 409, validated before any write", async () => {
    world.ledger.push({ metadata_json: { price_per_credit: 39_500 }, type: "purchase", amount: 2 });
    await rejectsWith(createReceivableUseCase("admin-1", body()), 409);
    assert.equal(world.receivables.length, 0);
    assert.equal(world.orderCreates, 0);
    assert.deepEqual(walletCalls(), []);
  });

  await t.test("a failure after the debt row is created rolls the debt back", async () => {
    Reflect.set(walletService, "withdraw", async () => {
      throw new AppError(402, "INSUFFICIENT", "no");
    });
    await rejectsWith(createReceivableUseCase("admin-1", body()), 402);
    assert.equal(world.receivables.length, 0);
  });

  await t.test("zero, negative, fractional and over-limit amounts are 400", async () => {
    for (const amount_due of [0, -5, 79_000.5, 1_000_001]) {
      await rejectsWith(createReceivableUseCase("admin-1", body({ amount_due })), 400);
    }
  });
});

test("a debt without purchase moves no wallet money and keeps the case link", async () => {
  const out = await createReceivableUseCase("admin-1", body({ purchase: undefined }));
  assert.equal(out.order_id, null);
  assert.deepEqual(world.calls, []);
  assert.equal(world.receivables[0]!.case_id, "case-1");
});

test("debtor is an immutable snapshot of the case contact, never the account profile", async () => {
  const out = await createReceivableUseCase("admin-1", body({ purchase: undefined }));
  assert.equal(out.customer_name, "Nguyen Van A");
  assert.equal(out.customer_phone, "0909000111");
  assert.equal(out.customer_email, "a@fpt.edu.vn");
  assert.equal(out.customer_contact, "0909000111 · a@fpt.edu.vn");
  assert.notEqual(out.customer_name, world.systemUser!.name);
});
