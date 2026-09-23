import { Queue, QueueEvents } from "bullmq";
import { Redis } from "ioredis";
import { existsSync, constants } from "node:fs";
import { access, readdir } from "node:fs/promises";
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

/**
 * Build dual-key BullMQ queue job id: omp-${caseId}--${aiJobId}
 */
export function buildOmpQueueJobId(caseId: string, aiJobId: string): string {
  return `omp-${caseId}--${aiJobId}`;
}

/**
 * Parse dual-key BullMQ queue job id.
 * Format: omp-${caseId}--${aiJobId}
 * Legacy fallback: omp-${caseId} or ${caseId} -> { caseId: raw, aiJobId: undefined }
 */
export function parseOmpQueueJobId(queueJobId: string): { caseId: string; aiJobId?: string } {
  const raw = queueJobId.startsWith("omp-") ? queueJobId.slice(4) : queueJobId;
  const separatorIndex = raw.indexOf("--");
  if (separatorIndex !== -1) {
    const caseId = raw.slice(0, separatorIndex);
    const aiJobId = raw.slice(separatorIndex + 2);
    return {
      caseId,
      aiJobId: aiJobId || undefined,
    };
  }
  return { caseId: raw, aiJobId: undefined };
}

export interface OmpJobPayload {
  jobId: string;
  caseId: string;
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
  const queueJobId = payload.caseId
    ? buildOmpQueueJobId(payload.caseId, payload.jobId)
    : `omp-${payload.jobId}`;
  logger.info(
    { jobId: payload.jobId, caseId: payload.caseId, queueJobId, title: payload.title },
    "Dispatching task into BullMQ omp-queue"
  );
  try {
    const existing = await ompQueue.getJob(queueJobId);
    if (existing) {
      await existing.remove();
      logger.info(
        { jobId: payload.jobId, caseId: payload.caseId, queueJobId },
        "Removed existing stale job from BullMQ queue before dispatch"
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(
      { jobId: payload.jobId, caseId: payload.caseId, queueJobId, err: message },
      "Could not remove existing BullMQ job before dispatch"
    );
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
export interface OmpJobMilestones {
  sandboxReady: boolean;
  triadPacket: boolean;
  auditReport: boolean;
  reportJson: boolean;
}
async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function getJobMilestones(jobId: string, aiJobId?: string): Promise<OmpJobMilestones> {
  const root = resolveRepoRoot();
  const candidateDirs: string[] = [];

  if (aiJobId) {
    candidateDirs.push(
      resolve(root, "storage", "jobs", jobId, aiJobId),
      resolve(root, "apps", "api", "storage", "jobs", jobId, aiJobId)
    );
  }

  const baseDirs = [
    resolve(root, "storage", "jobs", jobId),
    resolve(root, "apps", "api", "storage", "jobs", jobId),
  ];

  for (const base of baseDirs) {
    if (await pathExists(base)) {
      try {
        const subdirs = (await readdir(base, { withFileTypes: true }))
          .filter((d) => d.isDirectory() && d.name !== "input" && d.name !== "output");
        for (const d of subdirs) {
          candidateDirs.push(resolve(base, d.name));
        }
      } catch {
        // ignore
      }
    }
  }

  candidateDirs.push(...baseDirs);

  const [sandboxReady, triadPacket, auditReport, reportJson] = await Promise.all([
    (async () => {
      for (const dir of candidateDirs) {
        const inputDir = resolve(dir, "input");
        try {
          const files = await readdir(inputDir);
          if (files.length > 0) return true;
        } catch {
          // ignore
        }
      }
      return false;
    })(),
    (async () => {
      for (const dir of candidateDirs) {
        if (await pathExists(resolve(dir, "output/triad_handoff_packet.md"))) return true;
      }
      return false;
    })(),
    (async () => {
      for (const dir of candidateDirs) {
        if (await pathExists(resolve(dir, "output/input_clarification_audit.md"))) return true;
      }
      return false;
    })(),
    (async () => {
      for (const dir of candidateDirs) {
        if (await pathExists(resolve(dir, "output/report.json"))) return true;
      }
      return false;
    })(),
  ]);

  return { sandboxReady, triadPacket, auditReport, reportJson };
}

/**
 * Retrieve real status of a job from BullMQ and filesystem.
 */
export async function getOmpJobStatus(
  jobId: string,
  aiJobId?: string,
  preloadedMilestones?: OmpJobMilestones
): Promise<{
  state: "waiting" | "active" | "completed" | "failed" | "unknown";
  milestones: OmpJobMilestones;
  failedReason?: string;
}> {
  const milestones = preloadedMilestones ?? (await getJobMilestones(jobId, aiJobId));
  try {
    let job = await ompQueue.getJob(jobId);
    if (!job && aiJobId) {
      job = await ompQueue.getJob(buildOmpQueueJobId(jobId, aiJobId));
    }
    if (!job && !jobId.startsWith("omp-")) {
      job = await ompQueue.getJob(`omp-${jobId}`);
    }
    if (!job) {
      const activeJobs = await ompQueue.getJobs(["active", "waiting", "delayed"]);
      const found = activeJobs.find(
        (j) =>
          j.id === jobId ||
          j.id === `omp-${jobId}` ||
          (j.id && j.id.startsWith(`omp-${jobId}--`)) ||
          (j.data && (j.data.caseId === jobId || j.data.jobId === jobId))
      );
      if (found) {
        job = found;
      }
    }

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
    logger.warn({ jobId, aiJobId, err }, "Failed to get job state from BullMQ");
    return {
      state: milestones.reportJson ? "completed" : "unknown",
      milestones,
    };
  }
}

/**
 * Cancel an ongoing job by sending cancellation event to Redis.
 */
export async function cancelOmpJob(jobId: string, aiJobId?: string): Promise<boolean> {
  try {
    let job = await ompQueue.getJob(jobId);
    if (!job && aiJobId) {
      job = await ompQueue.getJob(buildOmpQueueJobId(jobId, aiJobId));
    }
    if (!job && !jobId.startsWith("omp-")) {
      job = await ompQueue.getJob(`omp-${jobId}`);
    }
    if (!job) {
      const activeJobs = await ompQueue.getJobs(["active", "waiting", "delayed"]);
      const found = activeJobs.find(
        (j) =>
          j.id === jobId ||
          j.id === `omp-${jobId}` ||
          (j.id && j.id.startsWith(`omp-${jobId}--`)) ||
          (j.data && (j.data.caseId === jobId || j.data.jobId === jobId))
      );
      if (found) {
        job = found;
      }
    }

    if (job && !(await job.isActive())) {
      await job.remove();
    }

    if (redisPublisher.status !== "ready") {
      await redisPublisher.connect().catch(() => {});
    }
    const targetJobId = job?.data?.jobId || aiJobId || jobId;
    const targetCaseId = job?.data?.caseId || (jobId !== targetJobId ? jobId : undefined);
    await redisPublisher.publish("job-cancellation", JSON.stringify({ jobId: targetJobId, caseId: targetCaseId }));
    return true;
  } catch (err) {
    logger.error({ jobId, aiJobId, err }, "Failed to cancel OMP job");
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
