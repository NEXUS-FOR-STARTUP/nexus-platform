import type { Cp2InputSource } from "@app/shared";
import { CP3_GRADED_QUESTION_IDS, QUESTION_REGISTRY } from "@repo/validation";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import { findLatestCp3FullReport } from "../../reports/infrastructure/persistence/report.repository.js";
import type { OmpAuditInputFile } from "../omp-audit.service.js";
import { buildAttachmentManifest, manifestEntry, uniqueSandboxName, type AttachmentManifestEntry } from "./attachment-manifest.js";
import { loadStageContext } from "./case-library.js";
import { findStageDocs, NO_CHANGE_SUMMARY_TEXT } from "./stage-audit-input.js";

export const CP3_CHECKPOINT_CODE = "CP3";
export const CP3_ANSWERS_FILE = "cp3_answers.md";
export const CP3_ATTACHMENTS_DIR = "attachments";
const UNANSWERED_TEXT = "(Nhóm chưa trả lời)";
const ATTACHMENT_FETCH_TIMEOUT_MS = Number(process.env.OMP_INPUT_FETCH_TIMEOUT_MS ?? 30_000);
/** Minimum bar before a CP3 trigger may burn a credit, counted over the graded questions only. Env-overridable, documented in README. */
const CP3_MIN_ANSWERED = Number(process.env.CP3_MIN_ANSWERED ?? 5);
const CP3_MIN_AVG_WORDS = Number(process.env.CP3_MIN_AVG_WORDS ?? 10);
/** Fields the worker/API add around the model's own report.json; not part of the earlier decisions. */
const PROVENANCE_KEYS = ["pdfUrl", "pdfPublicId", "submission_type", "prompt_version", "prompt_mode", "triggerStartedAt", "model", "checkpoint", "scope", "evidenceUnverified", "evidenceUnchecked"];

type AnswerMap = Readonly<Record<string, string | undefined>>;

function questionText(id: string): string {
  const entry = (QUESTION_REGISTRY as Record<string, { text: string } | undefined>)[id];
  return entry?.text ?? id;
}

/**
 * Only the graded questions: the product-demo/UX phase is never sent to the grader. Answers are copied
 * verbatim so quotes can be checked as substrings of this file. Not `renderStageAnswers("CP3")`: that
 * accumulates earlier stages and would turn their answers into evidence.
 */
export function renderCp3Answers(answers: AnswerMap): string {
  const sections = CP3_GRADED_QUESTION_IDS.map((id) => {
    const answer = (answers[id] ?? "").trim();
    return `## [${id}] ${questionText(id)}\n\n${answer === "" ? UNANSWERED_TEXT : answers[id]}`;
  });
  return `# Tài liệu CP3 của nhóm\n\n${sections.join("\n\n")}\n`;
}

/** Same bar the trigger enforces. Exported so the stage summary reports readiness at read time (thresholds are env-driven). */
export function evaluateCp3Answers(answers: AnswerMap): { answered: number; total: number; avgWords: number; ok: boolean } {
  const texts = CP3_GRADED_QUESTION_IDS.map((id) => (answers[id] ?? "").trim()).filter((t) => t !== "");
  const totalWords = texts.reduce((sum, t) => sum + t.split(/\s+/).filter(Boolean).length, 0);
  const avgWords = texts.length === 0 ? 0 : totalWords / texts.length;
  return { answered: texts.length, total: CP3_GRADED_QUESTION_IDS.length, avgWords, ok: texts.length >= CP3_MIN_ANSWERED && avgWords >= CP3_MIN_AVG_WORDS };
}

function assertCp3AnswerQuality(caseId: string, answers: AnswerMap): void {
  const result = evaluateCp3Answers(answers);
  if (result.ok) return;
  logger.warn({ caseId, answered: result.answered, avgWords: result.avgWords }, "CP3 trigger rejected: answers too thin");
  throw new AppError(
    400,
    "CP3_ANSWERS_TOO_THIN",
    `Bạn mới trả lời ${result.answered}/${result.total} câu và nội dung còn ngắn. Hãy trả lời ít nhất ${CP3_MIN_ANSWERED} câu, trung bình từ ${CP3_MIN_AVG_WORDS} từ mỗi câu, hoặc chọn chấm bằng tài liệu.`,
  );
}

/**
 * Gate by the chosen input source (same contract as CP2, copied so the paid CP2 path stays untouched):
 * answers = answer bar only; files = at least one eligible file; both = files AND the answer bar.
 * Undefined (admin retry of a job without a source) behaves like answers plus opportunistic files.
 */
export function assertCp3InputSource(caseId: string, answers: AnswerMap, source: Cp2InputSource | undefined, fileCount: number): void {
  if (source === undefined) {
    if (fileCount === 0) assertCp3AnswerQuality(caseId, answers);
    return;
  }
  if (source !== "answers" && fileCount === 0) {
    logger.warn({ caseId, source }, "CP3 trigger rejected: files source without eligible files");
    throw new AppError(400, "CP3_FILES_REQUIRED", "Bạn chọn chấm bằng tài liệu nhưng giai đoạn này chưa có tệp nào. Tải tệp lên ở tab Tài liệu hoặc chọn chấm bằng câu trả lời.");
  }
  if (source !== "files") assertCp3AnswerQuality(caseId, answers);
}

async function loadCp3Attachments(caseId: string): Promise<{ files: OmpAuditInputFile[]; entries: AttachmentManifestEntry[] }> {
  const files: OmpAuditInputFile[] = [];
  const entries: AttachmentManifestEntry[] = [];
  const used = new Set<string>();
  for (const doc of await findStageDocs(caseId, CP3_CHECKPOINT_CODE)) {
    if (!doc.download_url) continue;
    const res = await fetch(doc.download_url, { signal: AbortSignal.timeout(ATTACHMENT_FETCH_TIMEOUT_MS) });
    if (!res.ok) {
      logger.error({ caseId, docId: doc.id, status: res.status }, "CP3 attachment fetch failed");
      throw new AppError(502, "ATTACHMENT_FETCH_FAILED", "Không tải được tệp đính kèm để chấm. Vui lòng thử lại.");
    }
    const name = uniqueSandboxName(doc.original_name || doc.canonical_name || `document_${doc.id}.${doc.extension || "bin"}`, doc.id, used);
    const fileName = `${CP3_ATTACHMENTS_DIR}/${name}`;
    files.push({ name: fileName, content: Buffer.from(await res.arrayBuffer()) });
    entries.push(manifestEntry(fileName, doc, CP3_CHECKPOINT_CODE));
  }
  return { files, entries };
}

export interface Cp3InputRequest {
  caseId: string;
  submissionType: string;
  changeSummary?: string;
  /** Free note from the team (e.g. which part to focus on). Written as input/user_note.md. */
  userNote?: string;
  /** Which student inputs the grader reads. Undefined = legacy (answers + opportunistic attachments). */
  inputSource?: Cp2InputSource;
  /** Case library folder; earlier-stage files the run reads as context are stored there. */
  libraryDir: string;
}

/** Stand-in for cp3_answers.md when grading on files only; keeps the "missing question = unanswered" rule from firing. */
const FILES_ONLY_ANSWERS_TEXT =
  "# Tài liệu CP3 của nhóm\n\nNhóm chọn chấm chỉ bằng tệp đính kèm trong `input/attachments/`. Nhóm không dùng mẫu câu hỏi ở lần chấm này: không coi câu hỏi vắng mặt là chưa trả lời, hãy lấy nội dung từ các tệp.\n";

/** CP3 sandbox input by chosen source, plus the previous report on resubmit and CP1/CP2 as context (never evidence). */
export async function assembleCp3InputFiles(req: Cp3InputRequest): Promise<{ inputFiles: OmpAuditInputFile[]; resolvedLifecycleUnitId: null; libraryNames: string[] }> {
  const source = req.inputSource;
  const rows = await prisma.projectAnswer.findMany({ where: { case_id: req.caseId }, select: { question_id: true, answer_text: true } });
  const answers = Object.fromEntries(rows.map((r) => [r.question_id, r.answer_text]));
  const loaded = source === "answers" ? { files: [], entries: [] } : await loadCp3Attachments(req.caseId);
  assertCp3InputSource(req.caseId, answers, source, loaded.files.length);

  // ownAnswersOnly: each earlier stage renders only its own answers, so CP1 is not repeated inside CP2's file.
  const cp1 = await loadStageContext(req.caseId, "CP1", req.libraryDir, { ownAnswersOnly: true });
  const cp2 = await loadStageContext(req.caseId, "CP2", req.libraryDir, { ownAnswersOnly: true });
  const context = { files: [...cp1.files, ...cp2.files], entries: [...cp1.entries, ...cp2.entries], libraryNames: [...cp1.libraryNames, ...cp2.libraryNames] };
  const manifest = buildAttachmentManifest([...loaded.entries, ...context.entries]);
  const attachments = manifest ? [...loaded.files, ...context.files, manifest] : [...loaded.files, ...context.files];
  const inputFiles: OmpAuditInputFile[] = [
    { name: CP3_ANSWERS_FILE, content: source === "files" ? FILES_ONLY_ANSWERS_TEXT : renderCp3Answers(answers) },
    ...attachments,
  ];

  if (req.submissionType === "resubmit") {
    const previous = await findLatestCp3FullReport(req.caseId);
    if (!previous) {
      // Race: report deleted between the pre-charge guard and assembly (credit already taken).
      // Grade as initial instead of failing + refunding the trigger.
      logger.warn({ caseId: req.caseId }, "CP3 resubmit lost its previous report before assembly; grading as initial");
      return { inputFiles, resolvedLifecycleUnitId: null, libraryNames: context.libraryNames };
    }
    const meta = { ...((previous.metadata_json ?? {}) as Record<string, unknown>) };
    for (const key of PROVENANCE_KEYS) delete meta[key];
    inputFiles.push(
      { name: "previous_report.md", content: previous.content_md },
      { name: "previous_report.json", content: JSON.stringify(meta, null, 2) },
      { name: "change_summary.md", content: req.changeSummary?.trim() || NO_CHANGE_SUMMARY_TEXT },
    );
  }
  const note = req.userNote?.trim();
  if (note) inputFiles.push({ name: "user_note.md", content: `# Ghi chú của nhóm cho lần chấm này\n\n${note}` });
  return { inputFiles, resolvedLifecycleUnitId: null, libraryNames: context.libraryNames };
}
