import type { EvaluationJob } from "@app/shared";
import { getWorkerRedis } from "./redis.js";

export interface PendingLog {
  jobId: string;
  agent: "omp";
  message: string;
  timestamp: string;
}

const LOG_TTL_SECONDS = 86400; // 24 hours

export function logJob(jobId: string, message: string): void {
  // Never broadcast or leak confidential system prompts
  if (
    message.includes("# SYSTEM PROMPT") ||
    message.includes("--- HƯỚNG DẪN BỔ SUNG") ||
    message.includes("Fixed Two-Step Workflow")
  ) {
    return;
  }

  const timestamp = new Date().toISOString();
  console.log(`[Worker-OMP][${jobId}] ${message}`);

  const logEntry: PendingLog = {
    jobId,
    agent: "omp",
    message,
    timestamp,
  };

  try {
    const redis = getWorkerRedis();
    const payload = JSON.stringify(logEntry);

    // 1. Append to Redis list for history replay
    redis
      .rpush(`job:logs:${jobId}`, payload)
      .then(() => redis.expire(`job:logs:${jobId}`, LOG_TTL_SECONDS))
      .catch((err) => {
        console.warn(`[Worker-OMP][Redis] Failed to push log for ${jobId}:`, err.message);
      });

    // 2. Publish to live channel for active SSE streams
    redis.publish(`job:log:${jobId}`, payload).catch((err) => {
      console.warn(`[Worker-OMP][Redis] Failed to publish log for ${jobId}:`, err.message);
    });
  } catch (err: any) {
    console.warn(`[Worker-OMP][Redis] Logging error for ${jobId}:`, err.message);
  }
}

export function flushLogsToStorage(): void {
  // No-op for Redis-backed real-time logging
}

export function updateJobInStorage(
  jobId: string,
  updater: (job: EvaluationJob) => void
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
  } catch (err: any) {
    console.warn(`[Worker-OMP][Redis] Status update error for ${jobId}:`, err.message);
  }

  return jobState;
}
