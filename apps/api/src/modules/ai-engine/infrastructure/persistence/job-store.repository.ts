import { EventEmitter } from "node:events";
import type { EvaluationJob } from "@app/shared";
import { redisPublisher, redisSubscriber } from "../queue/omp-queue.js";
import logger from "../../../../shared/infrastructure/logger.js";

export interface StoredLogEntry {
  timestamp: string;
  agent?: string;
  message: string;
}

const LOG_TTL_SECONDS = 86400; // 24 hours

class JobStoreRepository extends EventEmitter {
  private activeJobs = new Map<string, EvaluationJob>();
  private isSubscribed = false;

  constructor() {
    super();
    this.initSubscriber();
  }

  private initSubscriber(): void {
    if (this.isSubscribed) return;
    this.isSubscribed = true;

    try {
      redisSubscriber.psubscribe("job:log:*", "job:status:*", (err) => {
        if (err) {
          logger.warn({ err }, "[JobStore] Redis psubscribe error");
        } else {
          logger.info("[JobStore] Subscribed to Redis channels job:log:* and job:status:*");
        }
      });

      redisSubscriber.on("pmessage", (_pattern, channel, message) => {
        try {
          if (channel.startsWith("job:log:")) {
            const jobId = channel.replace("job:log:", "");
            const entry = JSON.parse(message) as StoredLogEntry;
            if (
              entry.message?.includes("# SYSTEM PROMPT") ||
              entry.message?.includes("--- HƯỚNG DẪN BỔ SUNG") ||
              entry.message?.includes("Fixed Two-Step Workflow")
            ) {
              return;
            }

            const job = this.activeJobs.get(jobId);
            if (job) {
              if (!job.logs) job.logs = [];
              const isDuplicate = job.logs.some(
                (l) => l.timestamp === entry.timestamp && l.message === entry.message
              );
              if (!isDuplicate) {
                job.logs.push(entry as any);
              }
            }

            this.emit(`log:${jobId}`, entry);
          } else if (channel.startsWith("job:status:")) {
            const jobId = channel.replace("job:status:", "");
            const statusUpdate = JSON.parse(message);

            const job = this.activeJobs.get(jobId);
            if (job) {
              if (statusUpdate.status) job.status = statusUpdate.status;
              if (statusUpdate.ompStatus) job.ompStatus = statusUpdate.ompStatus;
              if (statusUpdate.results) job.results = { ...job.results, ...statusUpdate.results };
            }

            this.emit(`job:${jobId}`, statusUpdate);
            this.emit("updated", statusUpdate);
          }
        } catch (parseErr) {
          logger.warn({ channel, parseErr }, "[JobStore] Failed to parse pubsub message");
        }
      });
    } catch (subErr) {
      logger.warn({ subErr }, "[JobStore] Failed to initialize Redis subscriber");
    }
  }

  public get(id: string): EvaluationJob | undefined {
    return this.activeJobs.get(id);
  }

  public set(job: EvaluationJob): void {
    const initialLogs = [...(job.logs || [])];
    this.activeJobs.set(job.id, { ...job, logs: [] });

    // Clear previous logs in Redis for this new job run
    redisPublisher
      .del(`job:logs:${job.id}`)
      .catch((err) => logger.warn({ id: job.id, err }, "[JobStore] Failed to clear old redis logs"));

    this.emit(`job:${job.id}`, job);
    this.emit("updated", job);

    if (initialLogs.length > 0) {
      for (const log of initialLogs) {
        this.appendLog(job.id, (log.agent as any) || "system", log.message).catch(() => {});
      }
    }
  }

  public async getLogs(jobId: string): Promise<StoredLogEntry[]> {
    try {
      const rawLogs = await redisPublisher.lrange(`job:logs:${jobId}`, 0, -1);
      if (rawLogs && rawLogs.length > 0) {
        const parsedLogs = rawLogs.map((raw) => JSON.parse(raw) as StoredLogEntry);
        // Filter adjacent exact duplicates if any
        return parsedLogs.filter(
          (entry, index, arr) =>
            index === 0 ||
            entry.message !== arr[index - 1].message ||
            entry.timestamp !== arr[index - 1].timestamp
        );
      }
    } catch (err) {
      logger.warn({ jobId, err }, "[JobStore] Failed to fetch logs from Redis, fallback to memory");
    }

    return (this.activeJobs.get(jobId)?.logs as StoredLogEntry[]) || [];
  }

  public async appendLog(
    jobId: string,
    agent: "omp" | "pi" | "system",
    message: string
  ): Promise<void> {
    if (
      message.includes("# SYSTEM PROMPT") ||
      message.includes("--- HƯỚNG DẪN BỔ SUNG") ||
      message.includes("Fixed Two-Step Workflow")
    ) {
      return;
    }

    const logEntry: StoredLogEntry = {
      timestamp: new Date().toISOString(),
      agent,
      message,
    };

    const job = this.activeJobs.get(jobId);
    if (job) {
      if (!job.logs) job.logs = [];
      const isDuplicate = job.logs.some(
        (l) =>
          (l.timestamp === logEntry.timestamp && l.message === logEntry.message) ||
          (l.message === logEntry.message &&
            Math.abs(new Date(l.timestamp).getTime() - new Date(logEntry.timestamp).getTime()) < 1000)
      );
      if (isDuplicate) {
        return;
      }
      job.logs.push(logEntry as any);
    }

    try {
      const payload = JSON.stringify(logEntry);
      await redisPublisher.rpush(`job:logs:${jobId}`, payload);
      await redisPublisher.expire(`job:logs:${jobId}`, LOG_TTL_SECONDS);
      await redisPublisher.publish(`job:log:${jobId}`, payload);
    } catch (err) {
      logger.warn({ jobId, err }, "[JobStore] Redis appendLog warning");
    }
  }

  public cancel(id: string): EvaluationJob | undefined {
    const job = this.activeJobs.get(id);
    if (job) {
      job.status = "cancelled";
      if (job.ompStatus) job.ompStatus = "cancelled";
    }

    this.appendLog(id, "system", "🛑 [HỦY] Tiến trình thẩm định đã bị ngắt bởi người dùng.").catch(
      () => {}
    );

    this.emit(`job:${id}`, job || { id, status: "cancelled" });
    return job;
  }
}

export const jobStore = new JobStoreRepository();
