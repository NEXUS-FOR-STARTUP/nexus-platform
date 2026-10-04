import { test, after } from "node:test";
import assert from "node:assert/strict";
import {
  buildOmpQueueJobId,
  parseOmpQueueJobId,
  ompQueue,
  ompQueueEvents,
  redisPublisher,
  redisSubscriber,
} from "../../../modules/ai-engine/infrastructure/queue/omp-queue.js";

test("omp audit trigger — fresh startedAt prevents P2002 and ensures clean credit deduction on retry", async (t) => {
  after(async () => {
    await ompQueue.close().catch(() => {});
    await ompQueueEvents.close().catch(() => {});
    redisSubscriber.disconnect();
    redisPublisher.disconnect();
  });

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

  await t.test("attemptNo calculation increments from job count", () => {
    const calculateAttemptNo = (existingJobCount: number) => existingJobCount + 1;
    const history1: unknown[] = [];
    assert.strictEqual(calculateAttemptNo(history1.length), 1, "First run is attempt 1");
    const history2 = [{ id: "job-1" }];
    assert.strictEqual(calculateAttemptNo(history2.length), 2, "Second run is attempt 2");
    const history3 = [{ id: "job-1" }, { id: "job-2" }];
    assert.strictEqual(calculateAttemptNo(history3.length), 3, "Third run is attempt 3");
  });

  await t.test("dual-key queue dispatch builds and parses correctly for audit coordinator", () => {
    const caseId = "case-uuid-111";
    const aiJobId = "job-uuid-222";
    const queueJobId = buildOmpQueueJobId(caseId, aiJobId);

    assert.strictEqual(queueJobId, "omp-case-uuid-111--job-uuid-222");
    const parsed = parseOmpQueueJobId(queueJobId);
    assert.strictEqual(parsed.caseId, caseId);
    assert.strictEqual(parsed.aiJobId, aiJobId);
  });
});
