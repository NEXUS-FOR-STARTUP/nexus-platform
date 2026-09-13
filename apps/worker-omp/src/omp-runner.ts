import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AgentExecutionResult, StartupReport } from "@app/shared";
import { STORAGE_DIR, DEFAULT_MODEL, PROMPT_CONFIG, resolveAgentRuntime } from "./config.js";
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
  documentPath: string;
  documentOriginalName: string;
  title: string;
  model?: string;
  ompModel?: string;
  promptMode?: "full" | "lite";
  submissionType?: "initial" | "resubmit" | "logic_check";
}

export async function executeOmpJob(data: OmpJobPayload): Promise<AgentExecutionResult> {
  const { jobId, documentOriginalName } = data;
  const selectedModel = data.ompModel || data.model || DEFAULT_MODEL;
  const startTime = Date.now();
  const startedAt = new Date().toISOString();

  logJob(jobId, `Bắt đầu thẩm định tài liệu đề án: ${documentOriginalName}`);
  logJob(jobId, "Khởi chạy môi trường thẩm định AI chuyên sâu");

  updateJobInStorage(jobId, (j) => {
    j.ompStatus = "running";
    j.status = "running";
  });

  const jobDir = resolve(STORAGE_DIR, "jobs", jobId);
  const outputDir = resolve(jobDir, "output");
  prepareJobDirectories(jobDir, outputDir);

  const { runCmd, baseArgs } = resolveAgentRuntime();
  const mode = data.promptMode === "lite" ? "lite" : "full";
  const submissionType = data.submissionType ?? "initial";

  // Select prompt file based on submissionType
  let submissionPromptFile: string;
  switch (submissionType) {
    case "resubmit":
      submissionPromptFile = "input_clarification_gate_v4_1_resubmit.md";
      break;
    case "logic_check":
      submissionPromptFile = "input_clarification_gate_v4_1_logic.md";
      break;
    default:
      submissionPromptFile = "input_clarification_gate_v4_1.md";
      break;
  }

  const promptFilesDesc = PROMPT_CONFIG[mode]
    .map((fileName) => `system_prompt/${fileName}`)
    .concat(`system_prompt/${submissionPromptFile}`)
    .join(", ");

  // Read submission-specific prompt instructions if available
  const promptFilePath = resolve(jobDir, "system_prompt", submissionPromptFile);
  let submissionInstructions = "";
  if (existsSync(promptFilePath)) {
    try {
      submissionInstructions = readFileSync(promptFilePath, "utf-8").trim();
    } catch { /* ignore */ }
  }

  const prompt =
    `Hãy đọc tệp AGENTS.md để nắm vững quy trình và tiêu chuẩn thẩm định 2 bước (Fixed Two-Step Workflow). Đọc kỹ các tài liệu chuẩn trong: ${promptFilesDesc}. Đọc toàn bộ tài liệu nhóm trong input/ (hỗ trợ đọc tài liệu .docx, .pdf, .md, .txt bao gồm cả các bản bóc tách văn bản .extracted.md), tra cứu đối chiếu kiến thức trong knowledge/ (startup_knowledge.db và startup_knowledge.json).` +
    (submissionInstructions
      ? `\n\n--- HƯỚNG DẪN BỔ SUNG (${submissionType}) ---\n${submissionInstructions}\n--- KẾT THÚC HƯỚNG DẪN ---\n\n`
      : "") +
    ` Sau đó thực hiện chuẩn xác Step 1 xuất output/triad_handoff_packet.md, rồi Step 2 xuất output/input_clarification_audit.md và output/report.json theo đúng cấu trúc quy định.`;
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
  });

  if (executionResult.error === "CANCELLED") {
    logJob(jobId, "🛑 [HỦY] Hoàn tất hủy job OMP theo yêu cầu.");
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
    });
    return cancelledResult;
  }

  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - startTime;

  // Check and sync output files
  const triadFile = findOutputFile(jobDir, outputDir, "triad_handoff_packet.md");
  const auditFile =
    findOutputFile(jobDir, outputDir, "input_clarification_audit.md") ||
    findOutputFile(jobDir, outputDir, "report.md");
  const jsonFile = findOutputFile(jobDir, outputDir, "report.json");

  syncOutputFiles(outputDir, [
    { src: triadFile, name: "triad_handoff_packet.md" },
    { src: auditFile, name: "input_clarification_audit.md" },
    { src: jsonFile, name: "report.json" },
  ]);

  const triadPacketMarkdown = triadFile ? readFileSync(triadFile, "utf-8") : undefined;
  let reportMarkdown = auditFile ? readFileSync(auditFile, "utf-8") : undefined;
  let reportJson: StartupReport | undefined = undefined;

  if (jsonFile) {
    try {
      reportJson = JSON.parse(readFileSync(jsonFile, "utf-8"));
    } catch (err) {
      logJob(jobId, `Cảnh báo: Parse report.json thất bại: ${err}`);
    }
  }

  const isSuccess = executionResult.exitCode === 0 && (Boolean(reportMarkdown) || Boolean(reportJson));
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
  });

  if (!isSuccess) {
    const failureMessage = executionResult.error || "Process failed to produce complete output";
    logJob(jobId, `Tiến trình thẩm định gián đoạn: ${failureMessage}`);
    throw new Error(failureMessage);
  }

  logJob(jobId, `Hoàn thành thẩm định đề án sau ${Math.round(durationMs / 1000)}s`);
  return agentResult;
}
