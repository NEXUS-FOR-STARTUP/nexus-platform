import { createHash, randomUUID } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { StageCode } from "@app/shared";
import { prisma } from "../../../db.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { OmpAuditInputFile } from "../omp-audit.service.js";
import { manifestEntry, safeFileName, type AttachmentManifestEntry } from "./attachment-manifest.js";
import { findStageDocs, renderStageAnswers } from "./stage-audit-input.js";

/** Per-case folder, a sibling of the job folders, holding every earlier-stage file a run was given as context. */
export const LIBRARY_DIR = "_library";
/** `input/` is two levels below the case folder (`<case>/<job>/input`). */
const LIBRARY_PATH_FROM_INPUT = `../../${LIBRARY_DIR}`;
export const CONTEXT_DIR = "context";
const LIBRARY_FETCH_TIMEOUT_MS = Number(process.env.OMP_INPUT_FETCH_TIMEOUT_MS ?? 30_000);
const HASH_PREFIX_CHARS = 16;

/**
 * Key = hash of `download_url`: a Cloudinary-versioned URL changes when the file is re-uploaded, so a
 * replaced file never reuses an old copy. The URL is a cache identity, not a guarantee the CDN keeps old
 * versions; this folder is the only trustworthy copy of what the API downloaded, so it is never cleaned up.
 */
export function libraryFileName(url: string, name: string): string {
  return `${createHash("sha256").update(url).digest("hex").slice(0, HASH_PREFIX_CHARS)}_${safeFileName(name)}`;
}

/** Downloads the file into the library unless a copy exists. Temp file + rename, so a reader never sees a partial file. */
export async function ensureLibraryFile(libraryDir: string, url: string, name: string): Promise<string> {
  const fileName = libraryFileName(url, name);
  const dest = resolve(libraryDir, fileName);
  if (existsSync(dest)) return fileName;
  const res = await fetch(url, { signal: AbortSignal.timeout(LIBRARY_FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  mkdirSync(libraryDir, { recursive: true });
  const tmp = `${dest}.${randomUUID()}.tmp`;
  writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  renameSync(tmp, dest);
  return fileName;
}

/** Best-effort copy of library files next to a mirrored sandbox; the mirror is a dev convenience and never fails a run. */
export function copyLibraryFiles(fromDir: string, toDir: string, names: readonly string[]): void {
  for (const name of names) {
    const dest = resolve(toDir, name);
    if (existsSync(dest)) continue;
    try {
      mkdirSync(toDir, { recursive: true });
      copyFileSync(resolve(fromDir, name), dest);
    } catch (err) {
      logger.warn({ name, err: err instanceof Error ? err.message : String(err) }, "Failed to mirror library file");
    }
  }
}

export interface StageContext {
  /** Small copies written into this run's `input/`. */
  files: OmpAuditInputFile[];
  entries: AttachmentManifestEntry[];
  /** Library files the entries point at (the mirror copies these). */
  libraryNames: string[];
}

/**
 * Earlier-stage material for a later stage's run: the stage's answers copied into `input/context/`, its
 * files referenced in the library (not copied per job). An empty side is simply absent. A file that cannot
 * be downloaded is skipped with a warning; context must never fail a paid run.
 * `ownAnswersOnly`: render only this stage's own answers, so several stages can be loaded without repeating each other.
 */
export async function loadStageContext(caseId: string, stage: StageCode, libraryDir: string, opts: { ownAnswersOnly?: boolean } = {}): Promise<StageContext> {
  const context: StageContext = { files: [], entries: [], libraryNames: [] };

  const rows = await prisma.projectAnswer.findMany({ where: { case_id: caseId }, select: { question_id: true, answer_text: true } });
  const { markdown, answered } = renderStageAnswers(stage, Object.fromEntries(rows.map((r) => [r.question_id, r.answer_text])), { ownOnly: opts.ownAnswersOnly });
  if (answered > 0) {
    const fileName = `${CONTEXT_DIR}/${stage.toLowerCase()}_answers.md`;
    context.files.push({ name: fileName, content: markdown });
    context.entries.push(manifestEntry(fileName, { original_name: `${stage.toLowerCase()}_answers.md`, extension: "md", metadata_json: null }, stage, "context"));
  }

  for (const doc of await findStageDocs(caseId, stage)) {
    if (!doc.download_url) continue;
    const name = doc.original_name || doc.canonical_name || `document_${doc.id}.${doc.extension || "bin"}`;
    try {
      const libraryName = await ensureLibraryFile(libraryDir, doc.download_url, name);
      context.libraryNames.push(libraryName);
      context.entries.push(manifestEntry(`${LIBRARY_PATH_FROM_INPUT}/${libraryName}`, doc, stage, "context"));
    } catch (err) {
      logger.warn({ caseId, docId: doc.id, err: err instanceof Error ? err.message : String(err) }, "Skipping earlier-stage context file that could not be downloaded");
    }
  }
  return context;
}
