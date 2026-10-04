import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { ProcessResourceTracker } from "@app/shared";
import { logJob, flushLogsToStorage } from "./storage.js";
import { parseAndLogAgentEvent } from "./event-parser.js";
import { registerActiveProcess, unregisterActiveProcess } from "./process-registry.js";
import { checkJobMilestones } from "./job-sandbox.js";

export interface SpawnOmpProcessOptions {
  jobId: string;
  jobDir: string;
  outputDir: string;
  runCmd: string;
  args: string[];
}

export interface ProcessRunResult {
  exitCode: number;
  error?: string;
  rawLogs: string;
  tracker: ProcessResourceTracker | null;
}

export async function spawnOmpProcess(options: SpawnOmpProcessOptions): Promise<ProcessRunResult> {
  const { jobId, jobDir, outputDir, runCmd, args } = options;

  logJob(jobId, "Khởi chạy tiến trình sandbox AI (OMP Runner)...");
  let rawLogs = "";
  let tracker: ProcessResourceTracker | null = null;

  const result = await new Promise<{ exitCode: number; error?: string }>((done) => {
    let isCancelled = false;
    const proc = spawn(runCmd, args, {
      cwd: jobDir,
      env: {
        ...process.env,
        LANG: "C.UTF-8",
        LC_ALL: "C.UTF-8",
        OMP_SESSION_DIR: resolve(jobDir, ".omp-session"),
      },
    });

    const cancelHandler = () => {
      isCancelled = true;
      logJob(jobId, "🛑 [HỦY] Đã nhận tín hiệu ngắt từ người dùng. Đang dừng tiến trình OMP...");
      try {
        proc.kill("SIGTERM");
        setTimeout(() => {
          try {
            proc.kill("SIGKILL");
          } catch {}
        }, 1200);
      } catch {}
    };
    registerActiveProcess(jobId, { proc, cancel: cancelHandler });

    proc.stdin?.end();
    if (proc.pid) {
      tracker = new ProcessResourceTracker(proc.pid, jobDir);
      tracker.start(350);
    }

    let stdoutBuffer = "";
    const milestoneSeen = new Set<string>();
    const milestoneTimer = setInterval(() => {
      checkJobMilestones(jobId, jobDir, outputDir, milestoneSeen);
    }, 3000);

    proc.stdout.on("data", (chunk: Buffer) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          rawLogs += trimmed + "\n";
          parseAndLogAgentEvent(jobId, trimmed);
        }
      }
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      rawLogs += text;
      logJob(jobId, `[stderr] ${text.trim()}`);
    });

    proc.on("error", (err: Error) => {
      clearInterval(milestoneTimer);
      logJob(jobId, `Lỗi khởi chạy OMP process: ${err.message}`);
      flushLogsToStorage();
      done({ exitCode: 1, error: err.message });
    });

    proc.on("close", (code: number | null) => {
      unregisterActiveProcess(jobId);
      clearInterval(milestoneTimer);
      if (stdoutBuffer.trim()) {
        rawLogs += stdoutBuffer.trim() + "\n";
        parseAndLogAgentEvent(jobId, stdoutBuffer.trim());
      }
      const exitCode = code ?? 0;
      if (isCancelled) {
        logJob(jobId, `OMP process đã dừng do người dùng hủy bỏ.`);
        flushLogsToStorage();
        done({ exitCode: 130, error: "CANCELLED" });
      } else {
        logJob(jobId, `OMP process kết thúc với mã thoát: ${exitCode}`);
        flushLogsToStorage();
        done({ exitCode });
      }
    });
  });

  return {
    exitCode: result.exitCode,
    error: result.error,
    rawLogs,
    tracker,
  };
}
