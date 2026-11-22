import { test } from "node:test";
import assert from "node:assert";
import { AppError } from "../../domain/app-error.js";
import {
  enforceRateLimit,
  resetRateLimiterMemoryForTests,
  type RateLimitBucket,
} from "../rate-limiter.js";

process.env.NODE_ENV = "test";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function bucket(key: string, max: number, windowMs: number): RateLimitBucket {
  return { key, max, windowMs, code: "RATE_LIMITED", message: "limited" };
}

test("rateLimiterMemory", async (t) => {
  t.beforeEach(() => {
    resetRateLimiterMemoryForTests();
  });

  // Regression: the sweep used the *current* bucket's window, so one claim on an
  // hourly bucket deleted a daily counter whose stamps were older than an hour.
  await t.test("sweep giữ nguyên counter ngày khi bị kích hoạt bởi bucket giờ", async () => {
    const t0 = 1_000;
    for (let i = 0; i < 5; i++) {
      await enforceRateLimit([bucket("daily:user-a", 5, DAY)], t0 + i);
    }

    const t1 = t0 + 2 * HOUR;
    for (let i = 0; i < 5_001; i++) {
      await enforceRateLimit([bucket(`ip:${i}`, 1, HOUR)], t1);
    }

    await assert.rejects(
      () => enforceRateLimit([bucket("daily:user-a", 5, DAY)], t1 + 1),
      (err: unknown) => err instanceof AppError && err.status === 429,
    );
  });

  await t.test("qua cửa sổ thì được dùng lại", async () => {
    await enforceRateLimit([bucket("hourly:user-b", 1, HOUR)], 1_000);
    await assert.rejects(
      () => enforceRateLimit([bucket("hourly:user-b", 1, HOUR)], 1_001),
      (err: unknown) => err instanceof AppError && err.status === 429,
    );
    await enforceRateLimit([bucket("hourly:user-b", 1, HOUR)], 1_000 + HOUR);
  });
});
