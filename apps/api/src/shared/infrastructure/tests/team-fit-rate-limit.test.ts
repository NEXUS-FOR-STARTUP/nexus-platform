import { test } from "node:test";
import assert from "node:assert";
import {
  checkTeamFitRateLimit,
  resetTeamFitRateLimitForTests,
} from "../../../modules/ai-engine/application/team-fit-rate-limit.js";

process.env.NODE_ENV = "test";

test("teamFitRateLimit", async (t) => {
  t.beforeEach(() => {
    resetTeamFitRateLimitForTests();
  });

  await t.test("cho phép 3 lượt/giờ, quá 3 lượt ném 429", async () => {
    for (let i = 0; i < 3; i++) {
      await checkTeamFitRateLimit("user-a", "1.1.1.1", 1_000 + i);
    }
    await assert.rejects(
      () => checkTeamFitRateLimit("user-a", "1.1.1.1", 1_010),
      (err: unknown) => {
        const e = err as { status?: number; message?: string };
        return e.status === 429 && /giờ này/.test(e.message ?? "");
      },
    );
  });

  await t.test("user khác không bị vạ lây", async () => {
    for (let i = 0; i < 3; i++) {
      await checkTeamFitRateLimit("user-a", "1.1.1.1", 1_000);
    }
    await checkTeamFitRateLimit("user-b", "2.2.2.2", 1_000);
  });

  await t.test("qua giờ mới được dùng tiếp nhưng tối đa 5 lượt/ngày", async () => {
    const hour = 60 * 60 * 1000;
    for (let i = 0; i < 3; i++) {
      await checkTeamFitRateLimit("user-a", "", 1_000);
    }
    for (let i = 0; i < 2; i++) {
      await checkTeamFitRateLimit("user-a", "", 1_000 + hour);
    }
    await assert.rejects(
      () => checkTeamFitRateLimit("user-a", "", 1_000 + hour + 1),
      (err: unknown) => {
        const e = err as { status?: number; message?: string };
        return e.status === 429 && /ngày hôm nay/.test(e.message ?? "");
      },
    );
  });

  await t.test("giới hạn theo IP chặn clone nhiều tài khoản", async () => {
    for (let i = 0; i < 15; i++) {
      await checkTeamFitRateLimit(`user-${i}`, "9.9.9.9", 1_000);
    }
    await assert.rejects(
      () => checkTeamFitRateLimit("user-extra", "9.9.9.9", 1_010),
      (err: unknown) => {
        const e = err as { status?: number; message?: string };
        return e.status === 429 && /mạng này/.test(e.message ?? "");
      },
    );
  });

  await t.test("reset xoá hết lượt đã dùng", async () => {
    for (let i = 0; i < 3; i++) {
      await checkTeamFitRateLimit("user-a", "1.1.1.1", 1_000);
    }
    resetTeamFitRateLimitForTests();
    await checkTeamFitRateLimit("user-a", "1.1.1.1", 1_000);
  });
});
