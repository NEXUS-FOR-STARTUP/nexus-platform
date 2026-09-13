import { EventEmitter } from "node:events";
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import type { EvaluationJob } from "@app/shared";
import { resolveRepoRoot } from "../../omp-audit.service.js";

class JobStoreRepository extends EventEmitter {
  private primaryFile: string;

  constructor() {
    super();
    const root = resolveRepoRoot();
    this.primaryFile = resolve(root, "storage", "jobs_db.json");
  }

  private readList(): EvaluationJob[] {
    if (existsSync(this.primaryFile)) {
      try {
        const raw = readFileSync(this.primaryFile, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  }

  private writeList(list: EvaluationJob[]): void {
    const raw = JSON.stringify(list, null, 2);
    const dir = resolve(this.primaryFile, "..");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const tmpFile = resolve(dir, `.jobs_db.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`);
    try {
      writeFileSync(tmpFile, raw, "utf-8");
      renameSync(tmpFile, this.primaryFile);
    } catch (err) {
      try { unlinkSync(tmpFile); } catch {}
      throw err;
    }
  }

  public get(id: string): EvaluationJob | undefined {
    const list = this.readList();
    return list.find((j) => j.id === id);
  }

  public set(job: EvaluationJob): void {
    const list = this.readList();
    const index = list.findIndex((j) => j.id === job.id);
    if (index !== -1) {
      list[index] = { ...list[index], ...job };
    } else {
      list.unshift(job);
    }
    this.writeList(list);
    this.emit(`job:${job.id}`, job);
    this.emit("updated", job);
  }

  public appendLog(jobId: string, agent: "omp" | "pi" | "system", message: string): void {
    const list = this.readList();
    const job = list.find((j) => j.id === jobId);
    if (!job) return;

    if (!job.logs) job.logs = [];
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent,
      message,
    };
    job.logs.push(logEntry);
    this.writeList(list);
    this.emit(`log:${jobId}`, logEntry);
    this.emit(`job:${jobId}`, job);
  }

  public cancel(id: string): EvaluationJob | undefined {
    const list = this.readList();
    const job = list.find((j) => j.id === id);
    if (!job) return undefined;
    job.status = "cancelled";
    if (job.ompStatus) job.ompStatus = "cancelled";
    job.logs = job.logs || [];
    job.logs.push({
      timestamp: new Date().toISOString(),
      agent: "system",
      message: "🛑 [HỦY] Tiến trình thẩm định đã bị ngắt bởi người dùng.",
    });
    this.writeList(list);
    this.emit(`job:${id}`, job);
    return job;
  }
}

export const jobStore = new JobStoreRepository();
