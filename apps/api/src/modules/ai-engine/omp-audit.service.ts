import { spawn } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import logger from "../../shared/infrastructure/logger.js";
import { generateReportPdfBuffer } from "../reports/infrastructure/pdf/pdfService.js";

export interface OmpAuditInputFile {
  name: string;
  content: string | Buffer;
}

export interface OmpAuditOptions {
  caseId: string;
  projectName: string;
  inputFiles: OmpAuditInputFile[];
  model?: string;
  submissionType?: "initial" | "resubmit" | "logic_check";
}

export interface OmpAuditResult {
  reportJson: Record<string, unknown>;
  reportMarkdown: string;
  pdfBuffer: Buffer;
}

/**
 * Locate the OMP execution binary.
 * Priority: direct cli.js under .bun (bypasses Windows cmd.exe argument mangling) -> global omp binary.
 */
function resolveOmpCommand(): { command: string; baseArgs: string[] } {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "/root";
  const directCli = resolve(
    homeDir,
    ".bun/install/global/node_modules/@oh-my-pi/pi-coding-agent/dist/cli.js"
  );

  if (existsSync(directCli)) {
    return { command: "bun", baseArgs: [directCli] };
  }

  return { command: "omp", baseArgs: [] };
}

export function resolveRepoRoot(): string {
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

/**
 * Prepare job sandbox directory layout and copy SQLite DB + Prompts + Input files.
 */
export function prepareSandbox(jobDir: string, inputFiles: OmpAuditInputFile[]): void {
  const projectRoot = resolveRepoRoot();
  const inputDir = resolve(jobDir, "input");
  const knowledgeDir = resolve(jobDir, "knowledge");
  const promptDir = resolve(jobDir, "system_prompt");
  const outputDir = resolve(jobDir, "output");
  const agentDir = resolve(jobDir, ".omp", "agent");

  [inputDir, knowledgeDir, promptDir, outputDir, agentDir].forEach((dir) =>
    mkdirSync(dir, { recursive: true })
  );

  // 1. Copy SQLite database and AGENTS.md
  const masterDb = resolve(projectRoot, "data/knowledge/startup_knowledge.db");
  const agentsMd = resolve(projectRoot, "data/knowledge/AGENTS.md");
  const masterJson = resolve(projectRoot, "data/knowledge/startup_knowledge.json");

  if (existsSync(masterDb)) {
    copyFileSync(masterDb, resolve(knowledgeDir, "startup_knowledge.db"));
  }
  if (existsSync(agentsMd)) {
    copyFileSync(agentsMd, resolve(jobDir, "AGENTS.md"));
  }
  if (existsSync(masterJson)) {
    copyFileSync(masterJson, resolve(knowledgeDir, "startup_knowledge.json"));
  }

  // 2. Copy System Prompts
  const promptsSourceDir = resolve(projectRoot, "data/system-prompts");
  if (existsSync(promptsSourceDir)) {
    const promptFiles = readdirSync(promptsSourceDir);
    for (const file of promptFiles) {
      copyFileSync(resolve(promptsSourceDir, file), resolve(promptDir, file));
    }
  }

  // 3. Setup models.json for OMP
  const providersPath = resolve(projectRoot, "data/providers.json");
  const homeDir = process.env.HOME || process.env.USERPROFILE || "/root";
  const globalModelsPath = resolve(homeDir, ".omp/agent/models.json");
  const sourceModelsPath = existsSync(providersPath)
    ? providersPath
    : existsSync(globalModelsPath)
      ? globalModelsPath
      : null;

  if (sourceModelsPath) {
    copyFileSync(sourceModelsPath, resolve(jobDir, "models.json"));
    copyFileSync(sourceModelsPath, resolve(agentDir, "models.json"));
  }

  // 4. Write input files
  for (const file of inputFiles) {
    const dest = resolve(inputDir, file.name);
    if (Buffer.isBuffer(file.content)) {
      writeFileSync(dest, file.content);
    } else {
      writeFileSync(dest, file.content, "utf-8");
    }
  }
}

/**
 * Execute the OMP CLI in autonomous mode against the sandbox.
 */
export async function runOmpAudit(opts: OmpAuditOptions): Promise<OmpAuditResult> {
  const projectRoot = process.cwd();
  const jobDir = resolve(projectRoot, "storage", "jobs", opts.caseId);
  const outputDir = resolve(jobDir, "output");

  prepareSandbox(jobDir, opts.inputFiles);

  const { command, baseArgs } = resolveOmpCommand();
  const selectedModel = opts.model || process.env.OMP_MODEL || "mimo/mimo-v2.5";
  const promptFilesDir = resolve(projectRoot, "data/system-prompts");
  const submissionType = opts.submissionType ?? "initial";

  let promptFileName: string;
  switch (submissionType) {
    case "resubmit":
      promptFileName = "input_clarification_gate_v4_1_resubmit.md";
      break;
    case "logic_check":
      promptFileName = "input_clarification_gate_v4_1_logic.md";
      break;
    default:
      promptFileName = "input_clarification_gate_v4_1.md";
      break;
  }

  const promptFilePath = resolve(promptFilesDir, promptFileName);
  const promptInstructions = existsSync(promptFilePath)
    ? readFileSync(promptFilePath, "utf-8").trim()
    : "";

  const promptText =
    "Hãy đọc tệp AGENTS.md để nắm vững quy trình và tiêu chuẩn thẩm định 2 bước (Fixed Two-Step Workflow). " +
    `Đọc kỹ tài liệu chuẩn trong: system_prompt/${promptFileName}. ` +
    "Đọc toàn bộ tài liệu nhóm trong input/ (hỗ trợ đọc tài liệu .docx, .pdf, .md, .txt bao gồm cả các bản bóc tách văn bản .extracted.md), " +
    "tra cứu đối chiếu kiến thức trong knowledge/ (startup_knowledge.db và startup_knowledge.json). " +
    (promptInstructions
      ? `\n\n--- HƯỚNG DẪN BỔ SUNG (${submissionType}) ---\n${promptInstructions}\n--- KẾT THÚC HƯỚNG DẪN ---\n\n`
      : "") +
    "Sau đó thực hiện chuẩn xác Step 1 xuất output/triad_handoff_packet.md, rồi Step 2 xuất output/input_clarification_audit.md và output/report.json theo đúng cấu trúc quy định.";

  const args = [
    ...baseArgs,
    "--mode",
    "json",
    "-p",
    promptText,
    "--cwd",
    jobDir,
    "--model",
    selectedModel,
    "--auto-approve",
    "--approval-mode",
    "yolo",
    "--no-session",
  ];

  logger.info({ caseId: opts.caseId, selectedModel, command, argsCount: args.length }, "Spawning OMP audit worker...");

  await new Promise<void>((res, rej) => {
    const proc = spawn(command, args, {
      cwd: jobDir,
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        LANG: "C.UTF-8",
        LC_ALL: "C.UTF-8",
        OMP_SESSION_DIR: resolve(jobDir, ".omp-session"),
      },
      shell: false,
    });
    proc.stdin?.end();

    let stdoutData = "";
    let stderrData = "";

    proc.stdout?.on("data", (chunk: Buffer) => {
      stdoutData += chunk.toString();
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      stderrData += chunk.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        logger.info({ caseId: opts.caseId }, "OMP process finished successfully");
        res();
      } else {
        logger.error({ caseId: opts.caseId, code, stderrData }, "OMP process exited with error");
        rej(new Error(`OMP process failed with exit code ${code}: ${stderrData.slice(0, 500)}`));
      }
    });

    proc.on("error", (err) => {
      logger.error({ caseId: opts.caseId, err }, "Failed to spawn OMP process");
      rej(err);
    });
  });

  // Read output files
  const reportJsonPath = resolve(outputDir, "report.json");
  const reportMdPath = resolve(outputDir, "input_clarification_audit.md");

  if (!existsSync(reportJsonPath) || !existsSync(reportMdPath)) {
    throw new Error(`OMP finished but expected outputs not found in ${outputDir}`);
  }

  const rawJson = readFileSync(reportJsonPath, "utf-8");
  const reportJson = JSON.parse(rawJson) as Record<string, unknown>;
  const reportMarkdown = readFileSync(reportMdPath, "utf-8");

  // Compile PDF via Typst Engine
  const overallScore = typeof reportJson.overallScore === "number" ? reportJson.overallScore : 60;
  const verdict = typeof reportJson.verdict === "string" ? reportJson.verdict : "PARTIALLY READY FOR REALITY CHECK";
  const categoryScores =
    reportJson.categoryScores && typeof reportJson.categoryScores === "object"
      ? (reportJson.categoryScores as {
          problemClarity: number;
          marketViability: number;
          businessModel: number;
          competitiveMoat: number;
          executionFeasibility: number;
        })
      : {
          problemClarity: 60,
          marketViability: 60,
          businessModel: 60,
          competitiveMoat: 60,
          executionFeasibility: 60,
        };

  const pdfBuffer = await generateReportPdfBuffer({
    markdown: reportMarkdown,
    meta: {
      projectName: opts.projectName,
      jobId: opts.caseId,
      agentName: "omp",
      createdAt: new Date().toISOString(),
      overallScore,
      verdict,
      categoryScores,
      reportType: "input_clarification",
    },
    storageDir: resolve(projectRoot, "storage"),
    force: true,
  });

  return {
    reportJson,
    reportMarkdown,
    pdfBuffer,
  };
}
