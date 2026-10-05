import { Queue } from "bullmq";
import logger from "../../../../shared/infrastructure/logger.js";

// ---------------------------------------------------------------------------
// Dedicated `authoring-queue` (plan §7, D3 option B). Kept deliberately separate
// from `omp-queue` and, critically, from the credit ledger / omp-audit-coordinator
// (plan §3 landmine): authoring jobs are NEVER a path that spends a credit. Guard
// test T9 enforces that no import path to the credit repository exists here.
// ---------------------------------------------------------------------------

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export const authoringQueue = new Queue("authoring-queue", { connection });

export interface AuthoringJobPayload {
  authoringJobId: string;
  caseId: string;
  kind: "generate" | "import";
  templateKey?: string;
  checkpointId?: string;
  inputRevisionSnapshot?: Record<string, number>;
}

export function buildAuthoringQueueJobId(caseId: string, authoringJobId: string): string {
  return `authoring-${caseId}--${authoringJobId}`;
}

export async function dispatchAuthoringJob(payload: AuthoringJobPayload): Promise<void> {
  const queueJobId = buildAuthoringQueueJobId(payload.caseId, payload.authoringJobId);
  logger.info(
    { authoringJobId: payload.authoringJobId, caseId: payload.caseId, queueJobId, kind: payload.kind },
    "Dispatching authoring task into BullMQ authoring-queue",
  );
  await authoringQueue.add("authoring-task", payload, {
    jobId: queueJobId,
    removeOnComplete: 100,
    removeOnFail: 200,
  });
}
