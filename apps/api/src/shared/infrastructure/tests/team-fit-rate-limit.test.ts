import { test } from "node:test";
import assert from "node:assert";
import {
  claimTeamFitSlot,
  checkTeamFitRateLimit,
  resetTeamFitRateLimitForTests,
} from "../../../modules/ai-engine/application/team-fit-rate-limit.js";

process.env.NODE_ENV = "test";

test("teamFitRateLimit", async (t) => {
  t.beforeEach(() => {
    resetTeamFitRateLimitForTests();
  });

  await t.test("lượt đầu qua, quá N lượt bị chặn", () => {
    for (let i = 0; i < 10; i++) {
      assert.deepEqual(claimTeamFitSlot("user-a", 1_000 + i), { ok: true });
    }
    assert.deepEqual(claimTeamFitSlot("user-a", 1_010), { ok: false });
  });

  await t.test("user khác không bị vạ lây", () => {
    for (let i = 0; i < 10; i++) claimTeamFitSlot("user-a", 1_000);
    assert.deepEqual(claimTeamFitSlot("user-b", 1_000), { ok: true });
  });

  await t.test("qua cửa sổ mới lại được dùng", () => {
    for (let i = 0; i < 10; i++) claimTeamFitSlot("user-a", 1_000);
    assert.deepEqual(claimTeamFitSlot("user-a", 1_000 + 10 * 60 * 1000), { ok: true });
  });

  await t.test("check ném lỗi 429 tiếng Việt", () => {
    for (let i = 0; i < 10; i++) claimTeamFitSlot("user-a", 1_000);
    const now = 1_000 + 10 * 60 * 1000 - 1;
    assert.throws(() => checkTeamFitRateLimit("user-a", now), (err: unknown) => {
      const e = err as { status?: number; message?: string };
      return e.status === 429 && /hết lượt/.test(e.message ?? "");
    });
  });

  await t.test("reset xoá hết lượt đã dùng", () => {
    for (let i = 0; i < 10; i++) claimTeamFitSlot("user-a", 1_000);
    resetTeamFitRateLimitForTests();
    assert.deepEqual(claimTeamFitSlot("user-a", 1_000), { ok: true });
  });
});
