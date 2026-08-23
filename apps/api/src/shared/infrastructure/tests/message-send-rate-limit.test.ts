import { test } from "node:test";
import assert from "node:assert";
import {
  claimMessageSendSlot,
  resetMessageSendRateLimitForTests,
} from "../../../modules/cases/application/message-send-rate-limit.js";

process.env.NODE_ENV = "test";

test("claimMessageSendSlot", async (t) => {
  t.beforeEach(() => {
    resetMessageSendRateLimitForTests();
  });

  await t.test("user A first claim is ok", () => {
    const result = claimMessageSendSlot("user-a", 1_000);
    assert.deepEqual(result, { ok: true });
  });

  await t.test("user A second claim at same now is blocked", () => {
    claimMessageSendSlot("user-a", 1_000);
    const result = claimMessageSendSlot("user-a", 1_000);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.unlockInMs > 0);
      assert.ok(result.unlockInMs <= 1000);
      assert.equal(result.unlockInMs, 1000);
    }
  });

  await t.test("user A claim at now + 1000 is ok", () => {
    claimMessageSendSlot("user-a", 1_000);
    const result = claimMessageSendSlot("user-a", 2_000);
    assert.deepEqual(result, { ok: true });
  });

  await t.test("user B is independent of user A", () => {
    claimMessageSendSlot("user-a", 1_000);
    const result = claimMessageSendSlot("user-b", 1_000);
    assert.deepEqual(result, { ok: true });
  });

  await t.test("two sync claims same user: exactly one ok", () => {
    const first = claimMessageSendSlot("user-a", 1_000);
    const second = claimMessageSendSlot("user-a", 1_000);
    const okCount = [first, second].filter((r) => r.ok).length;
    assert.equal(okCount, 1);
    assert.equal(first.ok, true);
    assert.equal(second.ok, false);
  });

  await t.test("resetMessageSendRateLimitForTests clears occupied slot", () => {
    claimMessageSendSlot("user-a", 1_000);
    resetMessageSendRateLimitForTests();
    const result = claimMessageSendSlot("user-a", 1_000);
    assert.deepEqual(result, { ok: true });
  });
});
