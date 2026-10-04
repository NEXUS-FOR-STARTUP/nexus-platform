import { Worker, type Job } from "bullmq";
import {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  STORAGE_DIR,
  syncAgentProviders,
} from "./config.js";
import { initCancellationListener } from "./process-registry.js";
import { executeOmpJob, type OmpJobPayload } from "./omp-runner.js";
import { logJob } from "./storage.js";

// Ensure agent providers are synchronized
syncAgentProviders();

// Subscribe to job-cancellation events
initCancellationListener({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
});

console.log("[Worker-OMP] Starting OMP Worker daemon...");
console.log(`[Worker-OMP] Redis: ${REDIS_HOST}:${REDIS_PORT}, Storage: ${STORAGE_DIR}`);

export const worker = new Worker(
  "omp-queue",
  async (job: Job<OmpJobPayload>) => {
    return executeOmpJob(job.data);
  },
  {
    connection: {
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      maxRetriesPerRequest: null,
    },
    concurrency: 2,
    lockDuration: 600000,
    stalledInterval: 600000,
    maxStalledCount: 1,
  }
);

worker.on("failed", (job, err) => {
  if (job) {
    logJob(job.data.jobId, `Job OMP thất bại ngoại lệ: ${err.message}`);
  }
});
