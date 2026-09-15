import { Queue, QueueEvents } from "bullmq";
import { Redis } from "ioredis";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import logger from "../../../../shared/infrastructure/logger.js";

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export const ompQueue = new Queue("omp-queue", { connection });
export const ompQueueEvents = new QueueEvents("omp-queue", { connection });

export const redisPublisher = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export const redisSubscriber = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

export interface OmpJobPayload {
  jobId: string;
  documentPath: string;
  documentOriginalName: string;
  title: string;
  model?: string;
  ompModel?: string;
  promptMode?: "full" | "lite";
  submissionType?: "initial" | "resubmit" | "logic_check";
  lifecycleUnitId?: string;
}

/**
 * Dispatch an evaluation task into BullMQ omp-queue.
 */
export async function dispatchOmpJob(payload: OmpJobPayload): Promise<void> {
  const queueJobId = `omp-${payload.jobId}`;
  logger.info({ jobId: payload.jobId, title: payload.title }, "Dispatching task into BullMQ omp-queue");
  try {
    const existing = await ompQueue.getJob(queueJobId);
    if (existing) {
      await existing.remove();
      logger.info({ jobId: payload.jobId }, "Removed existing stale job from BullMQ queue before dispatch");
    }
  } catch (err: any) {
    logger.warn({ jobId: payload.jobId, err: err.message }, "Could not remove existing BullMQ job before dispatch");
  }

  await ompQueue.add("evaluate-omp", payload, {
    jobId: queueJobId,
    removeOnComplete: 100,
    removeOnFail: 200,
  });
}

/**
 * Check real-time milestone files on disk for a job.
 */
export function getJobMilestones(jobId: string): {
  sandboxReady: boolean;
  triadPacket: boolean;
  auditReport: boolean;
  reportJson: boolean;
} {
  const root = resolveRepoRoot();
  const candidateDirs = [
    resolve(root, "storage", "jobs", jobId),
    resolve(root, "apps", "api", "storage", "jobs", jobId),
  ];

  const checkExists = (subPath: string): boolean => {
    return candidateDirs.some((dir) => existsSync(resolve(dir, subPath)));
  };

  const sandboxReady = candidateDirs.some((dir) => {
    const inputDir = resolve(dir, "input");
    return existsSync(inputDir) && readdirSync(inputDir).length > 0;
  });

  const triadPacket = checkExists("output/triad_handoff_packet.md");
  const auditReport = checkExists("output/input_clarification_audit.md");
  const reportJson = checkExists("output/report.json");

  return { sandboxReady, triadPacket, auditReport, reportJson };
}

/**
 * Retrieve real status of a job from BullMQ and filesystem.
 */
export async function getOmpJobStatus(jobId: string): Promise<{
  state: "waiting" | "active" | "completed" | "failed" | "unknown";
  milestones: ReturnType<typeof getJobMilestones>;
  failedReason?: string;
}> {
  const milestones = getJobMilestones(jobId);
  try {
    const job = await ompQueue.getJob(`omp-${jobId}`);
    if (!job) {
      if (milestones.reportJson) {
        return { state: "completed", milestones };
      }
      return { state: "unknown", milestones };
    }

    const state = await job.getState();
    const mappedState =
      state === "completed"
        ? "completed"
        : state === "failed"
          ? "failed"
          : state === "active"
            ? "active"
            : "waiting";

    return {
      state: mappedState,
      milestones,
      failedReason: job.failedReason,
    };
  } catch (err) {
    logger.warn({ jobId, err }, "Failed to get job state from BullMQ");
    return {
      state: milestones.reportJson ? "completed" : "unknown",
      milestones,
    };
  }
}

/**
 * Cancel an ongoing job by sending cancellation event to Redis.
 */
export async function cancelOmpJob(jobId: string): Promise<boolean> {
  try {
    const job = await ompQueue.getJob(`omp-${jobId}`);
    if (job && !(await job.isActive())) {
      await job.remove();
    }

    if (redisPublisher.status !== "ready") {
      await redisPublisher.connect().catch(() => {});
    }
    await redisPublisher.publish("job-cancellation", JSON.stringify({ jobId }));
    return true;
  } catch (err) {
    logger.error({ jobId, err }, "Failed to cancel OMP job");
    return false;
  }
}

function resolveRepoRoot(): string {
  if (process.env.APP_ROOT && existsSync(process.env.APP_ROOT)) {
    return resolve(process.env.APP_ROOT);
  }
  let current = process.cwd();
  for (let i = 0; i < 4; i++) {
    if (existsSync(resolve(current, "data/knowledge/startup_knowledge.db"))) {
      return current;
    }
    const parent = resolve(current, "..");
    if (parent === current) break;
    current = parent;
  }
  return process.cwd();
}
