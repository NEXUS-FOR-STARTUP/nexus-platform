import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { getProvidersPath } from "./config.js";
import { logJob } from "./storage.js";

export function prepareJobDirectories(jobDir: string, outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });

  // Ensure workspace/output also exists or junctions to outputDir so agent never writes into a void
  try {
    const wsDir = resolve(jobDir, "workspace");
    mkdirSync(wsDir, { recursive: true });
    const wsOutputDir = resolve(wsDir, "output");
    if (!existsSync(wsOutputDir)) {
      mkdirSync(wsOutputDir, { recursive: true });
    }
  } catch {
    // ignore
  }

  // Ensure models.json exists in job directory and sandbox .omp/agent
  const jobModelsFile = resolve(jobDir, "models.json");
  const providersSrc = getProvidersPath();
  if (existsSync(providersSrc) && !existsSync(jobModelsFile)) {
    const content = readFileSync(providersSrc);
    writeFileSync(jobModelsFile, content);
    const jobAgentDir = resolve(jobDir, ".omp", "agent");
    mkdirSync(jobAgentDir, { recursive: true });
    writeFileSync(resolve(jobAgentDir, "models.json"), content);
  }
}

export function findOutputFile(jobDir: string, outputDir: string, fileName: string): string | undefined {
  const candidates = [
    resolve(outputDir, fileName),
    resolve(jobDir, "workspace", "output", fileName),
    resolve(jobDir, fileName),
    resolve(jobDir, "workspace", fileName),
    resolve("/workspace", "output", fileName),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return undefined;
}

export function syncOutputFiles(outputDir: string, files: Array<{ src?: string; name: string }>): void {
  try {
    for (const item of files) {
      if (item.src && item.src !== resolve(outputDir, item.name)) {
        writeFileSync(resolve(outputDir, item.name), readFileSync(item.src));
      }
    }
  } catch (e) {
    console.warn(`[Sync Warning] Failed syncing outputs:`, e);
  }
}

export function readJobInputDocuments(jobDir: string): string {
  const inputDirPath = resolve(jobDir, "input");
  let inputDocContent = "";
  if (existsSync(inputDirPath)) {
    const inputFiles = readdirSync(inputDirPath);
    for (const ifile of inputFiles) {
      try {
        const ifpath = resolve(inputDirPath, ifile);
        inputDocContent += `\n--- File: ${ifile} ---\n` + readFileSync(ifpath, "utf-8");
      } catch {
        // ignore binary read errors
      }
    }
  }
  return inputDocContent;
}

const MILESTONE_MESSAGE_BY_FILE: Record<string, string> = {
  "triad_handoff_packet.md": "📦 Cột mốc 1 - Hoàn thành xây dựng ma trận Vấn đề - Giải pháp - Khách hàng",
  "input_clarification_audit.md": "📦 Cột mốc 2 - Hoàn thành phản biện chuyên sâu các giả định và tiêu chí khởi nghiệp",
  "cp2_evidence.json": "📦 Cột mốc 1 - Hoàn thành trích xuất bằng chứng từ tài liệu nhóm",
  "report.md": "📦 Cột mốc 2 - Hoàn thành viết báo cáo thẩm định",
  "report.json": "📦 Cột mốc 3 - Hoàn thành tổng hợp điểm số và hoàn tất báo cáo thẩm định",
};

export function checkJobMilestones(
  jobId: string,
  jobDir: string,
  outputDir: string,
  milestoneSeen: Set<string>,
  outputFiles?: readonly string[],
): void {
  const targets = outputFiles ?? [
    "triad_handoff_packet.md",
    "input_clarification_audit.md",
    "report.json",
  ];
  for (const file of targets) {
    if (!milestoneSeen.has(file)) {
      const p = findOutputFile(jobDir, outputDir, file);
      if (p) {
        milestoneSeen.add(file);
        logJob(jobId, MILESTONE_MESSAGE_BY_FILE[file] ?? `📦 Hoàn thành ${file}`);
      }
    }
  }
}
