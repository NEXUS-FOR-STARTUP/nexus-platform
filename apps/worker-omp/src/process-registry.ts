import type { ChildProcess } from "node:child_process";
import Redis from "ioredis";

export interface ActiveProcessEntry {
  proc: ChildProcess;
  cancel: () => void;
}

const activeProcesses = new Map<string, ActiveProcessEntry>();

export function registerActiveProcess(jobId: string, entry: ActiveProcessEntry): void {
  activeProcesses.set(jobId, entry);
}

export function unregisterActiveProcess(jobId: string): void {
  activeProcesses.delete(jobId);
}

export function getActiveProcess(jobId: string): ActiveProcessEntry | undefined {
  return activeProcesses.get(jobId);
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

  redisSub.on("message", (channel, message) => {
    if (channel === "job-cancellation") {
      try {
        const data = JSON.parse(message);
        if (data?.jobId) {
          const entry = activeProcesses.get(data.jobId);
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
