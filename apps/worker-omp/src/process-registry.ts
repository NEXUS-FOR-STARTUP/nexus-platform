import Redis from "ioredis";

export interface ActiveJobEntry {
  cancel: () => void;
}

const activeJobs = new Map<string, ActiveJobEntry>();

export function registerActiveJob(jobId: string, entry: ActiveJobEntry): void {
  activeJobs.set(jobId, entry);
}

export function unregisterActiveJob(jobId: string): void {
  activeJobs.delete(jobId);
}

export function initCancellationListener(redisConfig: {
  host: string;
  port: number;
  password?: string;
}): Redis {
  const redisSub = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    maxRetriesPerRequest: null,
  });

  redisSub.subscribe("job-cancellation", (err) => {
    if (err) console.error("[Worker-OMP] Redis sub error:", err);
  });

  // Unhandled 'error' on an EventEmitter throws — that would crash the whole daemon.
  redisSub.on("error", (err) => {
    console.error("[Worker-OMP] Redis sub connection error:", err);
  });

  redisSub.on("message", (channel, message) => {
    if (channel === "job-cancellation") {
      try {
        const data = JSON.parse(message);
        if (data?.jobId || data?.caseId) {
          const entry = (data.jobId ? activeJobs.get(data.jobId) : undefined) ||
                        (data.caseId ? activeJobs.get(data.caseId) : undefined);
          if (entry) {
            entry.cancel();
          }
        }
      } catch (e) {
        console.warn("[Worker-OMP] Cancellation message parse error:", e);
      }
    }
  });

  return redisSub;
}
