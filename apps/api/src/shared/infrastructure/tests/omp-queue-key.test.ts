import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import {
  buildOmpQueueJobId,
  parseOmpQueueJobId,
  ompQueue,
  ompQueueEvents,
  redisPublisher,
  redisSubscriber,
} from "../../../modules/ai-engine/infrastructure/queue/omp-queue.js";

describe("OMP Dual-Key Queue Job ID Helpers", () => {
  after(async () => {
    await ompQueue.close().catch(() => {});
    await ompQueueEvents.close().catch(() => {});
    redisSubscriber.disconnect();
    redisPublisher.disconnect();
  });

  describe("buildOmpQueueJobId", () => {
    it("builds dual-key queue job id in format omp-${caseId}--${aiJobId}", () => {
      const caseId = "case-abc-123";
      const aiJobId = "job-xyz-789";
      const queueJobId = buildOmpQueueJobId(caseId, aiJobId);

      assert.strictEqual(queueJobId, "omp-case-abc-123--job-xyz-789");
    });

    it("handles UUIDs and alphanumeric identifiers", () => {
      const caseId = "550e8400-e29b-41d4-a716-446655440000";
      const aiJobId = "c89b7e32-d15f-4a87-b9c1-8495a0fa0b88";
      const queueJobId = buildOmpQueueJobId(caseId, aiJobId);

      assert.strictEqual(
        queueJobId,
        "omp-550e8400-e29b-41d4-a716-446655440000--c89b7e32-d15f-4a87-b9c1-8495a0fa0b88"
      );
    });

    it("handles short IDs and edge cases", () => {
      assert.strictEqual(buildOmpQueueJobId("1", "2"), "omp-1--2");
      assert.strictEqual(buildOmpQueueJobId("case", ""), "omp-case--");
    });
  });

  describe("parseOmpQueueJobId", () => {
    it("parses dual-key id with omp- prefix correctly", () => {
      const parsed = parseOmpQueueJobId("omp-case-123--job-456");
      assert.deepStrictEqual(parsed, {
        caseId: "case-123",
        aiJobId: "job-456",
      });
    });

    it("parses dual-key id containing hyphens in both caseId and aiJobId", () => {
      const parsed = parseOmpQueueJobId(
        "omp-550e8400-e29b-41d4-a716-446655440000--c89b7e32-d15f-4a87-b9c1-8495a0fa0b88"
      );
      assert.deepStrictEqual(parsed, {
        caseId: "550e8400-e29b-41d4-a716-446655440000",
        aiJobId: "c89b7e32-d15f-4a87-b9c1-8495a0fa0b88",
      });
    });

    it("falls back gracefully for legacy omp-${caseId} without separator", () => {
      const parsed = parseOmpQueueJobId("omp-legacy-case-999");
      assert.deepStrictEqual(parsed, {
        caseId: "legacy-case-999",
        aiJobId: undefined,
      });
    });

    it("falls back gracefully for bare caseId without omp- prefix", () => {
      const parsed = parseOmpQueueJobId("bare-case-id-123");
      assert.deepStrictEqual(parsed, {
        caseId: "bare-case-id-123",
        aiJobId: undefined,
      });
    });

    it("handles trailing separator with empty aiJobId by returning undefined aiJobId", () => {
      const parsed = parseOmpQueueJobId("omp-case-with-empty-job--");
      assert.deepStrictEqual(parsed, {
        caseId: "case-with-empty-job",
        aiJobId: undefined,
      });
    });

    it("ensures round-trip symmetry: parse(build(caseId, aiJobId)) matches input", () => {
      const caseId = "case-round-trip-test";
      const aiJobId = "job-round-trip-test";
      const built = buildOmpQueueJobId(caseId, aiJobId);
      const parsed = parseOmpQueueJobId(built);

      assert.strictEqual(parsed.caseId, caseId);
      assert.strictEqual(parsed.aiJobId, aiJobId);
    });
  });
});
