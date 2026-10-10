import { existsSync, mkdirSync, copyFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import logger from "../../shared/infrastructure/logger.js";

export interface OmpAuditInputFile {
  name: string;
  content: string | Buffer;
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

function safeCopyFileSync(src: string, dest: string): void {
  try {
    copyFileSync(src, dest);
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error?.code === "EACCES" || error?.code === "EPERM") {
      try {
        if (existsSync(dest)) {
          rmSync(dest, { force: true });
          copyFileSync(src, dest);
          return;
        }
      } catch (rmErr: unknown) {
        const rmError = rmErr as NodeJS.ErrnoException;
        logger.warn({ src, dest, err: error?.message, rmErr: rmError?.message }, "Could not overwrite sandbox file due to permissions; proceeding with existing file");
        return;
      }
    }
    logger.warn({ src, dest, err: error?.message }, "safeCopyFileSync skipped file copy due to error");
  }
}

function safeWriteFileSync(dest: string, content: string | Buffer): void {
  try {
    if (Buffer.isBuffer(content)) {
      writeFileSync(dest, content);
    } else {
      writeFileSync(dest, content, "utf-8");
    }
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error?.code === "EACCES" || error?.code === "EPERM") {
      try {
        if (existsSync(dest)) {
          rmSync(dest, { force: true });
          if (Buffer.isBuffer(content)) {
            writeFileSync(dest, content);
          } else {
            writeFileSync(dest, content, "utf-8");
          }
          return;
        }
      } catch (rmErr: unknown) {
        const rmError = rmErr as NodeJS.ErrnoException;
        logger.error({ dest, err: error?.message, rmErr: rmError?.message }, "Failed to write input file to sandbox due to permissions");
        throw error;
      }
    }
    throw error;
  }
}

export interface SandboxOptions {
  /** Prompt files to copy; undefined copies the whole system-prompts directory. */
  promptFiles?: readonly string[];
  /** false skips the CP1 knowledge DB and AGENTS.md. */
  includeKnowledge?: boolean;
}

/**
 * Prepare job sandbox directory layout and copy SQLite DB + Prompts + Input files.
 */
export function prepareSandbox(jobDir: string, inputFiles: OmpAuditInputFile[], opts: SandboxOptions = {}): void {
  const projectRoot = resolveRepoRoot();
  const inputDir = resolve(jobDir, "input");
  const knowledgeDir = resolve(jobDir, "knowledge");
  const promptDir = resolve(jobDir, "system_prompt");
  const outputDir = resolve(jobDir, "output");
  const agentDir = resolve(jobDir, ".omp", "agent");

  [inputDir, knowledgeDir, promptDir, outputDir, agentDir].forEach((dir) =>
    mkdirSync(dir, { recursive: true })
  );

  // 1. Copy SQLite database and AGENTS.md (CP1 only: CP2 jobs get neither the knowledge DB nor CP1 rules)
  if (opts.includeKnowledge !== false) {
    const masterDb = resolve(projectRoot, "data/knowledge/startup_knowledge.db");
    const agentsMd = resolve(projectRoot, "data/knowledge/AGENTS.md");
    const masterJson = resolve(projectRoot, "data/knowledge/startup_knowledge.json");
    if (existsSync(masterDb)) {
      safeCopyFileSync(masterDb, resolve(knowledgeDir, "startup_knowledge.db"));
    }
    if (existsSync(agentsMd)) {
      safeCopyFileSync(agentsMd, resolve(jobDir, "AGENTS.md"));
    }
    if (existsSync(masterJson)) {
      safeCopyFileSync(masterJson, resolve(knowledgeDir, "startup_knowledge.json"));
    }
  }

  // 2. Copy System Prompts: only the files the job's prompt list names, or all when unrestricted (CP1)
  const promptsSourceDir = resolve(projectRoot, "data/system-prompts");
  if (existsSync(promptsSourceDir)) {
    const promptFiles = opts.promptFiles ?? readdirSync(promptsSourceDir);
    for (const file of promptFiles) {
      const src = resolve(promptsSourceDir, file);
      if (existsSync(src)) safeCopyFileSync(src, resolve(promptDir, file));
      else logger.warn({ file }, "Prompt file listed for job is missing in data/system-prompts");
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
    safeCopyFileSync(sourceModelsPath, resolve(jobDir, "models.json"));
    safeCopyFileSync(sourceModelsPath, resolve(agentDir, "models.json"));
  }

  // 4. Write input files (names may carry a sub-directory, e.g. attachments/x.xlsx)
  for (const file of inputFiles) {
    const dest = resolve(inputDir, file.name);
    mkdirSync(dirname(dest), { recursive: true });
    safeWriteFileSync(dest, file.content);
  }
}