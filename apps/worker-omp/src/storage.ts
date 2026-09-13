import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import type { EvaluationJob } from "@app/shared";
import { STORAGE_DIR } from "./config.js";

export interface PendingLog {
  jobId: string;
  agent: "omp";
  message: string;
  timestamp: string;
}

const pendingLogs: PendingLog[] = [];
let flushTimer: NodeJS.Timeout | null = null;

function atomicWriteJson(filePath: string, data: unknown): void {
  const dir = resolve(filePath, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const tmpFile = resolve(
    dir,
    `.jobs_db_w.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
  );
  try {
    writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
    renameSync(tmpFile, filePath);
  } catch (err) {
    try { unlinkSync(tmpFile); } catch {}
    throw err;
  }
}

export function flushLogsToStorage(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pendingLogs.length === 0) return;
  const batch = pendingLogs.splice(0, pendingLogs.length);
  const byJob = new Map<string, Array<{ timestamp: string; agent: "omp"; message: string }>>();
  for (const item of batch) {
    if (!byJob.has(item.jobId)) byJob.set(item.jobId, []);
    byJob.get(item.jobId)!.push({
      timestamp: item.timestamp,
      agent: item.agent,
      message: item.message,
    });
  }

  const dbFile = resolve(STORAGE_DIR, "jobs_db.json");
  try {
    let list: EvaluationJob[] = [];
    if (existsSync(dbFile)) {
      try {
        const raw = readFileSync(dbFile, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      } catch {}
    }
    let updated = false;
    for (const [jid, newLogs] of byJob.entries()) {
      const j = list.find((job) => job.id === jid);
      if (j) {
        if (!j.logs) j.logs = [];
        j.logs.push(...newLogs);
        updated = true;
      }
    }
    if (updated) {
      atomicWriteJson(dbFile, list);
    }
  } catch (err) {
    console.error(`[Worker-OMP] Storage flush error:`, err);
  }
}

export function logJob(jobId: string, message: string): void {
  console.log(`[Worker-OMP][${jobId}] ${message}`);
  pendingLogs.push({
    jobId,
    agent: "omp",
    message,
    timestamp: new Date().toISOString(),
  });
  if (!flushTimer) {
    flushTimer = setTimeout(flushLogsToStorage, 600);
  }
}

export function updateJobInStorage(
  jobId: string,
  updater: (job: EvaluationJob) => void
): EvaluationJob | undefined {
  flushLogsToStorage();
  const dbFile = resolve(STORAGE_DIR, "jobs_db.json");
  try {
    let list: EvaluationJob[] = [];
    if (existsSync(dbFile)) {
      try {
        const raw = readFileSync(dbFile, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      } catch {}
    }
    const index = list.findIndex((j) => j.id === jobId);
    if (index === -1) return undefined;

    updater(list[index]);

    // Recalculate overall status
    const current = list[index];
    if (current.results.omp) {
      current.status = current.results.omp.status;
    }

    atomicWriteJson(dbFile, list);
    return list[index];
  } catch (err) {
    console.error(`[Worker-OMP] Storage update error for job ${jobId}:`, err);
    return undefined;
  }
}
