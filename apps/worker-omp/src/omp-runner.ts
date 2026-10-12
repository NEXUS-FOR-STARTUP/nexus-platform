import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getAuditScopeEntry, type AgentExecutionResult, type AuditCheckpointCode, type StartupReport } from "@app/shared";
import { STORAGE_DIR, DEFAULT_MODEL, resolveAgentRuntime } from "./config.js";
import { buildRunnerPrompt } from "./runner-instruction.js";
import { logJob, updateJobInStorage } from "./storage.js";
import {
  prepareJobDirectories,
  findOutputFile,
  syncOutputFiles,
  readJobInputDocuments,
} from "./job-sandbox.js";
import { spawnOmpProcess } from "./process-spawner.js";

export interface OmpJobPayload {
  jobId: string;
  caseId?: string;
  documentPath: string;
  documentOriginalName: string;
  title: string;
  model?: string;
  ompModel?: string;
  promptMode?: "full" | "lite";
  submissionType?: "initial" | "resubmit" | "logic_check";
  lifecycleUnitId?: string;
  checkpoint?: AuditCheckpointCode;
  scope?: string;
}

export async function executeOmpJob(data: OmpJobPayload): Promise<AgentExecutionResult> {
  const { jobId, caseId, documentOriginalName } = data;
  const selectedModel = data.ompModel || data.model || DEFAULT_MODEL;
  const startTime = Date.now();
  const startedAt = new Date().toISOString();

  logJob(jobId, `Bắt đầu thẩm định tài liệu đề án: ${documentOriginalName}`, caseId);
  logJob(jobId, "Khởi chạy môi trường thẩm định AI chuyên sâu", caseId);
  updateJobInStorage(jobId, (j) => {
    j.ompStatus = "running";
    j.status = "running";
  }, caseId);

  // Record the resolved unit in durable job storage (Redis-backed job logs)
  // so finalizer/status can trace which unit this run belongs to even if
  // BullMQ job.data is later lost (worker restart). The authoritative
  // fallback remains aiJob.input_json.lifecycle_unit_id on the API side.
  if (data.lifecycleUnitId) {
    logJob(jobId, `Đơn vị vòng đời (lifecycle_unit_id): ${data.lifecycleUnitId}`, caseId);
  }

  const jobDir = data.caseId
    ? resolve(STORAGE_DIR, "jobs", data.caseId, data.jobId)
    : resolve(STORAGE_DIR, "jobs", data.jobId);
  const outputDir = resolve(jobDir, "output");
  prepareJobDirectories(jobDir, outputDir);

  const { runCmd, baseArgs } = resolveAgentRuntime();
  const submissionType = data.submissionType ?? "initial";
  // CP1 jobs carry no checkpoint (legacy payloads): scope is the prompt mode.
  const checkpoint = data.checkpoint ?? "CP1";
  const scope = data.scope ?? (data.promptMode === "lite" ? "lite" : "full");

  const entry = getAuditScopeEntry(checkpoint, scope, submissionType);
  if (!entry) {
    throw new Error(`Không có cấu hình prompt cho ${checkpoint}/${scope}/${submissionType}`);
  }

  // CP1 inlines the submission-specific prompt (always last in its list) into the instruction.
  let submissionInstructions = "";
  if (checkpoint === "CP1") {
    const promptFilePath = resolve(jobDir, "system_prompt", entry.prompts[entry.prompts.length - 1]);
    if (existsSync(promptFilePath)) {
      try {
        submissionInstructions = readFileSync(promptFilePath, "utf-8").trim();
      } catch { /* ignore */ }
    }
  }

  const prompt = buildRunnerPrompt({ checkpoint, promptFiles: entry.prompts, submissionType, submissionInstructions });
  const args = [
    ...baseArgs,
    "--mode",
    "json",
    "-p",
    prompt,
    "--cwd",
    jobDir,
    "--model",
    selectedModel,
    "--auto-approve",
    "--approval-mode",
    "yolo",
    "--no-session",
  ];

  const executionResult = await spawnOmpProcess({
    jobId,
    jobDir,
    outputDir,
    runCmd,
    args,
    milestoneFiles: [...entry.outputs.required, ...entry.outputs.optional],
  });

  if (executionResult.error === "CANCELLED") {
    logJob(jobId, "🛑 [HỦY] Hoàn tất hủy job OMP theo yêu cầu.", caseId);
    const cancelledResult: AgentExecutionResult = {
      agent: "omp",
      modelUsed: selectedModel,
      status: "cancelled",
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      rawLogs: executionResult.rawLogs,
      error: "Tiến trình đã bị người dùng chủ động ngắt ngang / hủy bỏ.",
    };
    updateJobInStorage(jobId, (j) => {
      j.ompStatus = "cancelled";
      j.status = "cancelled";
      j.results.omp = cancelledResult;
    }, caseId);
    return cancelledResult;
  }

  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - startTime;

  // Collect output files from the per-checkpoint contract (shared audit-checkpoints.ts).
  const found: Record<string, string> = {};
  for (const name of [...entry.outputs.required, ...entry.outputs.optional]) {
    const p = findOutputFile(jobDir, outputDir, name);
    if (p) found[name] = p;
  }
  syncOutputFiles(outputDir, Object.entries(found).map(([name, src]) => ({ src, name })));

  const readFound = (name: string): string | undefined => {
    const p = found[name];
    return p ? readFileSync(p, "utf-8") : undefined;
  };
  const triadPacketMarkdown = checkpoint === "CP1" ? readFound("triad_handoff_packet.md") : undefined;
  let reportMarkdown = checkpoint === "CP1" ? readFound("input_clarification_audit.md") : readFound("report.md");
  let reportJson: StartupReport | undefined = undefined;

  const jsonRaw = readFound("report.json");
  if (jsonRaw) {
    try {
      reportJson = JSON.parse(jsonRaw);
    } catch (err) {
      logJob(jobId, `Cảnh báo: Parse report.json thất bại: ${err}`, caseId);
    }
  }

  const missingRequired = entry.outputs.required.filter((name) => !Object.hasOwn(found, name));
  const isSuccess = executionResult.exitCode === 0 && missingRequired.length === 0;
  if (!isSuccess && missingRequired.length > 0) {
    logJob(jobId, `Thiếu tệp output bắt buộc (${checkpoint}): ${missingRequired.join(", ")}`, caseId);
  }
  if (!isSuccess && !reportMarkdown) {
    reportMarkdown = `# BÁO CÁO THẨM ĐỊNH (OMP) - LỖI TIẾN TRÌNH\n\nOMP kết thúc với mã lỗi: ${executionResult.exitCode}\n\nChi tiết lỗi: ${executionResult.error || "Không sinh được tệp output/report.md"}\n\n### Log tiến trình:\n\`\`\`\n${executionResult.rawLogs}\n\`\`\``;
  }

  // Compute benchmark metrics
  const inputDocContent = readJobInputDocuments(jobDir);
  const metrics = executionResult.tracker
    ? await executionResult.tracker.stop(reportMarkdown, reportJson, inputDocContent)
    : undefined;

  if (metrics) {
    console.log(
      `[Worker-OMP][${jobId}][Metrics] RAM: ${metrics.system.peakMemoryMb}MB | CPU: ${metrics.system.avgCpuPercent}% | Disk: ${metrics.system.workspaceSizeKb}KB`
    );
  }

  const agentResult: AgentExecutionResult = {
    agent: "omp",
    modelUsed: selectedModel,
    status: isSuccess ? "completed" : "failed",
    startedAt,
    finishedAt,
    durationMs,
    metrics,
    reportMarkdown,
    triadPacketMarkdown,
    reportJson,
    rawLogs: executionResult.rawLogs,
    error: isSuccess ? undefined : executionResult.error || "Process failed to produce complete output",
  };

  updateJobInStorage(jobId, (j) => {
    j.ompStatus = agentResult.status;
    j.results.omp = agentResult;
  }, caseId);

  if (!isSuccess) {
    const failureMessage = executionResult.error || "Process failed to produce complete output";
    logJob(jobId, `Tiến trình thẩm định gián đoạn: ${failureMessage}`, caseId);
    throw new Error(failureMessage);
  }

  logJob(jobId, `Hoàn thành thẩm định đề án sau ${Math.round(durationMs / 1000)}s`, caseId);
  return agentResult;
}
