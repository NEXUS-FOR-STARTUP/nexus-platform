import type { EvaluationJob } from "@app/shared";
import { getWorkerRedis } from "./redis.js";

export interface PendingLog {
  jobId: string;
  caseId?: string;
  agent: "omp";
  message: string;
  timestamp: string;
}

const LOG_TTL_SECONDS = 86400; // 24 hours

export function logJob(jobId: string, message: string, caseId?: string): void {
  // Never broadcast or leak confidential system prompts
  if (
    message.includes("# SYSTEM PROMPT") ||
    message.includes("--- HƯỚNG DẪN BỔ SUNG") ||
    message.includes("Fixed Two-Step Workflow")
  ) {
    return;
  }

  const timestamp = new Date().toISOString();
  console.log(`[Worker-OMP][${jobId}${caseId && caseId !== jobId ? `/${caseId}` : ""}] ${message}`);

  const logEntry: PendingLog = {
    jobId,
    ...(caseId ? { caseId } : {}),
    agent: "omp",
    message,
    timestamp,
  };

  try {
    const redis = getWorkerRedis();
    const payload = JSON.stringify(logEntry);

    // 1. Append to Redis list for history replay (jobId)
    redis
      .rpush(`job:logs:${jobId}`, payload)
      .then(() => redis.expire(`job:logs:${jobId}`, LOG_TTL_SECONDS))
      .catch((err) => {
        console.warn(`[Worker-OMP][Redis] Failed to push log for ${jobId}:`, err.message);
      });

    // 2. Publish to live channel for active SSE streams (jobId)
    redis.publish(`job:log:${jobId}`, payload).catch((err) => {
      console.warn(`[Worker-OMP][Redis] Failed to publish log for ${jobId}:`, err.message);
    });

    // 3. Dual-publish to caseId channels if caseId provided and different from jobId
    if (caseId && caseId !== jobId) {
      redis
        .rpush(`job:logs:${caseId}`, payload)
        .then(() => redis.expire(`job:logs:${caseId}`, LOG_TTL_SECONDS))
        .catch((err) => {
          console.warn(`[Worker-OMP][Redis] Failed to push log for case ${caseId}:`, err.message);
        });

      redis.publish(`job:log:${caseId}`, payload).catch((err) => {
        console.warn(`[Worker-OMP][Redis] Failed to publish log for case ${caseId}:`, err.message);
      });
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[Worker-OMP][Redis] Logging error for ${jobId}:`, errMsg);
  }
}

export function flushLogsToStorage(): void {
  // No-op for Redis-backed real-time logging
}

export function updateJobInStorage(
  jobId: string,
  updater: (job: EvaluationJob) => void,
  caseId?: string,
): EvaluationJob | undefined {
  const jobState: EvaluationJob = {
    id: jobId,
    title: "",
    documentPath: "",
    documentOriginalName: "",
    requestedAgent: "omp",
    createdAt: new Date().toISOString(),
    status: "running",
    ompStatus: "running",
    results: {},
    logs: [],
  };

  updater(jobState);

  try {
    const redis = getWorkerRedis();
    const statusPayload = JSON.stringify({
      jobId,
      status: jobState.status,
      ompStatus: jobState.ompStatus,
      results: jobState.results,
      updatedAt: new Date().toISOString(),
    });

    redis.publish(`job:status:${jobId}`, statusPayload).catch((err) => {
      console.warn(`[Worker-OMP][Redis] Failed to publish status for ${jobId}:`, err.message);
    });
    if (caseId && caseId !== jobId) {
      redis.publish(`job:status:${caseId}`, statusPayload).catch(() => {});
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[Worker-OMP][Redis] Status update error for ${jobId}:`, errMsg);
  }

  return jobState;
}
