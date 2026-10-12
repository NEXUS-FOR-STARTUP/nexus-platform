import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getAuditScopeEntry, type AgentExecutionResult, type AuditCheckpointCode } from "@app/shared";
import { STORAGE_DIR, DEFAULT_MODEL, resolveAgentRuntime } from "./config.js";
import { buildRunnerPrompt } from "./runner-instruction.js";
import { logJob, updateJobInStorage } from "./storage.js";
import {
  prepareJobDirectories,
  findOutputFile,
  syncOutputFiles,
  readJobInputDocuments,
  MILESTONE_MESSAGE_BY_FILE,
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
  lifecycleUnitId?: string;
  /** Self-contained execution contract built by the API; the worker runs it blindly. */
  specVersion?: 1;
  instruction?: string;
  requiredOutputs?: string[];
  optionalOutputs?: string[];
  milestones?: Record<string, string>;
  // Legacy fields for payloads queued before the JobSpec cutover; removed after queue drain.
  promptMode?: "full" | "lite";
  submissionType?: "initial" | "resubmit" | "logic_check";
  checkpoint?: AuditCheckpointCode;
  scope?: string;
}

/** Resolved execution contract: identical shape whether the payload is spec or legacy. */
interface ExecutionContract {
  instruction: string;
  requiredOutputs: readonly string[];
  optionalOutputs: readonly string[];
  milestones: Record<string, string>;
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

  // Spec payloads carry the whole contract; legacy ones (queued before the
  // cutover) are resolved from the checkpoint table until the queue drains.
  let contract: ExecutionContract;
  if (data.specVersion === 1 && data.instruction && data.requiredOutputs && data.milestones) {
    contract = {
      instruction: data.instruction,
      requiredOutputs: data.requiredOutputs,
      optionalOutputs: data.optionalOutputs ?? [],
      milestones: data.milestones,
    };
  } else {
    const submissionType = data.submissionType ?? "initial";
    const checkpoint = data.checkpoint ?? "CP1";
    const scope = data.scope ?? (data.promptMode === "lite" ? "lite" : "full");
    const entry = getAuditScopeEntry(checkpoint, scope, submissionType);
    if (!entry) {
      throw new Error(`Không có cấu hình prompt cho ${checkpoint}/${scope}/${submissionType}`);
    }
    let submissionInstructions = "";
    if (checkpoint === "CP1") {
      const promptFilePath = resolve(jobDir, "system_prompt", entry.prompts[entry.prompts.length - 1]);
      if (existsSync(promptFilePath)) {
        try {
          submissionInstructions = readFileSync(promptFilePath, "utf-8").trim();
        } catch { /* ignore */ }
      }
    }
    const milestones: Record<string, string> = {};
    for (const name of [...entry.outputs.required, ...entry.outputs.optional]) {
      milestones[name] = MILESTONE_MESSAGE_BY_FILE[name] ?? `📦 Hoàn thành ${name}`;
    }
    contract = {
      instruction: buildRunnerPrompt({ checkpoint, promptFiles: entry.prompts, submissionType, submissionInstructions }),
      requiredOutputs: entry.outputs.required,
      optionalOutputs: entry.outputs.optional,
      milestones,
    };
  }

  const args = [
    ...baseArgs,
    "--mode",
    "json",
    "-p",
    contract.instruction,
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
    milestones: contract.milestones,
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

  // Collect output files by the contract's name list; report contents are read
  // from disk by the API finalizer, so the worker never parses them.
  const found: Record<string, string> = {};
  for (const name of [...contract.requiredOutputs, ...contract.optionalOutputs]) {
    const p = findOutputFile(jobDir, outputDir, name);
    if (p) found[name] = p;
  }
  syncOutputFiles(outputDir, Object.entries(found).map(([name, src]) => ({ src, name })));

  const missingRequired = contract.requiredOutputs.filter((name) => !Object.hasOwn(found, name));
  const isSuccess = executionResult.exitCode === 0 && missingRequired.length === 0;
  if (!isSuccess && missingRequired.length > 0) {
    logJob(jobId, `Thiếu tệp output bắt buộc: ${missingRequired.join(", ")}`, caseId);
  }

  // Compute benchmark metrics
  const inputDocContent = readJobInputDocuments(jobDir);
  const metrics = executionResult.tracker
    ? await executionResult.tracker.stop(undefined, undefined, inputDocContent)
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
