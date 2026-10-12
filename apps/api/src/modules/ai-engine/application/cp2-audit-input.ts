import { basename } from "node:path";
import type { Cp2InputSource } from "@app/shared";
import { CP2_INTERVIEW_AUDIT_REQUIRED, CP2_QUESTION_BANK_ID, CP2_SELF_CHECKS, QUESTION_REGISTRY, TEMPLATE_REGISTRY } from "@repo/validation";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import { findLatestCp2FullReport } from "../../reports/infrastructure/persistence/report.repository.js";
import type { OmpAuditInputFile } from "../omp-audit.service.js";
import { SUBMITTED_DOC_EXCLUDED_KINDS } from "../../documents/domain/document-types.js";
import { AUDIT_STAGE_INPUT_RULES } from "../../../env.js";
import { STAGE_DOC_EXCLUDED_TYPES, renderStageAnswers } from "./stage-audit-input.js";

export const CP2_CHECKPOINT_CODE = "CP2";
export const CP2_ANSWERS_FILE = "cp2_answers.md";
export const CP2_SELF_CHECKS_FILE = "self_checks.md";
export const CP2_ATTACHMENTS_DIR = "attachments";
const UNANSWERED_TEXT = "(Nhóm chưa trả lời)";
const NO_CHANGE_SUMMARY_TEXT = "(Nhóm không ghi tóm tắt thay đổi)";
const ATTACHMENT_FETCH_TIMEOUT_MS = Number(process.env.OMP_INPUT_FETCH_TIMEOUT_MS ?? 30_000);
/** Minimum bar before a CP2 trigger may burn a credit. Env-overridable, documented in README. */
const CP2_MIN_ANSWERED = Number(process.env.CP2_MIN_ANSWERED ?? 5);
const CP2_MIN_AVG_WORDS = Number(process.env.CP2_MIN_AVG_WORDS ?? 10);
/** Questionnaire scope needs its 3 base answers + the bank (or an attachment) with real content. */
const CP2_QUESTIONNAIRE_MIN_WORDS = Number(process.env.CP2_QUESTIONNAIRE_MIN_WORDS ?? 10);
/** Fields the worker/API add around the model's own report.json; not part of the earlier decisions. */
const PROVENANCE_KEYS = ["pdfUrl", "pdfPublicId", "submission_type", "prompt_version", "prompt_mode", "triggerStartedAt", "model", "checkpoint", "scope", "evidenceUnverified", "evidenceUnchecked"];

type AnswerMap = Readonly<Record<string, string | undefined>>;

/** Questions in `cp2.ts` phase order; the same order the docx export uses. */
function cp2QuestionIds(): string[] {
  return TEMPLATE_REGISTRY.cp2.phases.flatMap((phase) => phase.questions.map((q) => q.question_id));
}

function questionText(id: string): string {
  const entry = (QUESTION_REGISTRY as Record<string, { text: string } | undefined>)[id];
  return entry?.text ?? id;
}

/** Answers are copied verbatim so quotes can be checked as substrings of this file. */
export function renderCp2Answers(answers: AnswerMap): string {
  const sections = cp2QuestionIds().map((id) => {
    const answer = (answers[id] ?? "").trim();
    return `## [${id}] ${questionText(id)}\n\n${answer === "" ? UNANSWERED_TEXT : answers[id]}`;
  });
  return `# Tài liệu CP2 của nhóm\n\n${sections.join("\n\n")}\n`;
}

/**
 * Reject junk CP2 triggers before they burn a credit. Branched by scope:
 * - questionnaire: the 3 base answers + question bank (or a CP2 attachment) must exist
 *   (mirrors CP2_INTERVIEW_AUDIT_REQUIRED + bank rule in the readiness catalog).
 * - full/resubmit: at least CP2_MIN_ANSWERED questions averaging CP2_MIN_AVG_WORDS.
 * Pure over the passed answers + attachment flag; the coordinator calls it pre-charge,
 * the assembler re-checks it post-charge as a safety net (TOCTOU between trigger and assemble).
 */
export function assertCp2AnswerQuality(
  caseId: string,
  answers: AnswerMap,
  scope: string,
  hasCp2Attachment: boolean,
): void {
  if (scope === "questionnaire") {
    const questionnaire = evaluateCp2QuestionnaireAnswers(answers, hasCp2Attachment);
    if (!questionnaire.ok) {
      logger.warn({ caseId, missing: questionnaire.missing, thinIds: questionnaire.thinIds }, "CP2 questionnaire trigger rejected: bank answers below bar");
      throw new AppError(
        400,
        "CP2_ANSWERS_TOO_THIN",
        `Chấm bảng hỏi cần trả lời: ${questionnaire.missing.map(questionText).join("; ")}. Mỗi câu trả lời ít nhất ${CP2_QUESTIONNAIRE_MIN_WORDS} từ.`,
        { missing: questionnaire.missing },
      );
    }
    return;
  }
  const quality = evaluateCp2FullAnswers(answers);
  if (!quality.ok) {
    logger.warn({ caseId, answered: quality.answered, avgWords: Math.round(quality.avgWords * 10) / 10 }, "CP2 trigger rejected: answers below quality bar");
    throw new AppError(
      400,
      "CP2_ANSWERS_TOO_THIN",
      `Nhóm mới trả lời ${quality.answered}/${quality.total} câu (cần ít nhất ${CP2_MIN_ANSWERED} câu, trung bình mỗi câu ít nhất ${CP2_MIN_AVG_WORDS} từ). Bổ sung câu trả lời và tài liệu đính kèm trước khi chấm.`,
      { answered: quality.answered, total: quality.total },
    );
  }
}

/**
 * Gate by the chosen input source, so each of the three student situations passes on its own terms:
 * - answers: the questionnaire bar only (no files needed).
 * - files: at least one eligible file, no answer bar (the files carry the evidence).
 * - both: files AND the answer bar; sending both is an explicit "grade everything" choice.
 * - undefined (legacy/admin-retry of pre-source jobs): attachments included opportunistically,
 *   gated by the old answer bar with the attachment flag, exactly as before.
 */
export function assertCp2InputSource(
  caseId: string,
  answers: AnswerMap,
  scope: string,
  source: Cp2InputSource | undefined,
  fileCount: number,
): void {
  if (source === undefined) {
    assertCp2AnswerQuality(caseId, answers, scope, fileCount > 0);
    return;
  }
  if (source !== "answers" && fileCount === 0) {
    logger.warn({ caseId, source }, "CP2 trigger rejected: files source without eligible files");
    throw new AppError(400, "CP2_FILES_REQUIRED", "Bạn chọn chấm bằng tài liệu nhưng giai đoạn này chưa có tệp nào. Tải tệp lên ở tab Tài liệu hoặc chọn chấm bằng câu trả lời.");
  }
  if (source !== "files") assertCp2AnswerQuality(caseId, answers, scope, source === "both" && fileCount > 0);
}

/**
 * Same bar the questionnaire-scope trigger enforces. Pure over the passed answers +
 * attachment flag so the stage summary can report it at read time without a migration.
 */
export function evaluateCp2QuestionnaireAnswers(answers: AnswerMap, hasCp2Attachment: boolean): { missing: string[]; thinIds: string[]; ok: boolean } {
  const nonEmpty = (id: string): string | null => {
    const t = (answers[id] ?? "").trim();
    return t === "" ? null : t;
  };
  const missing = CP2_INTERVIEW_AUDIT_REQUIRED.filter((id) => !nonEmpty(id));
  const bank = nonEmpty(CP2_QUESTION_BANK_ID);
  if (!bank && !hasCp2Attachment) missing.push(CP2_QUESTION_BANK_ID);
  const thinIds = [...CP2_INTERVIEW_AUDIT_REQUIRED, ...(bank ? [CP2_QUESTION_BANK_ID] : [] as string[])]
    .filter((id) => {
      const t = nonEmpty(id);
      return t !== null && t.split(/\s+/).filter(Boolean).length < CP2_QUESTIONNAIRE_MIN_WORDS;
    });
  return { missing, thinIds, ok: missing.length === 0 && thinIds.length === 0 };
}

/**
 * Same bar the full-scope trigger enforces. Exported so the stage summary can report
 * readiness at read time: thresholds are env-driven, so a stored flag would go stale.
 */
export function evaluateCp2FullAnswers(answers: AnswerMap): { answered: number; total: number; avgWords: number; ok: boolean } {
  const ids = cp2QuestionIds();
  const texts = ids.map((id) => (answers[id] ?? "").trim()).filter((t) => t !== "");
  const totalWords = texts.reduce((sum, t) => sum + t.split(/\s+/).filter(Boolean).length, 0);
  const avgWords = texts.length === 0 ? 0 : totalWords / texts.length;
  return { answered: texts.length, total: ids.length, avgWords, ok: texts.length >= CP2_MIN_ANSWERED && avgWords >= CP2_MIN_AVG_WORDS };
}
export function renderSelfChecks(answers: AnswerMap): string {
  const lines = CP2_SELF_CHECKS.map((check) => `- ${check.label}: ${answers[check.id] === "true" ? "Đã xác nhận" : "Chưa xác nhận"}`);
  return `# Nhóm tự xác nhận (nhóm tự khai, chưa được kiểm chứng)\n\n${lines.join("\n")}\n`;
}

function safeFileName(name: string): string {
  return basename(name).replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_") || "attachment";
}

async function loadAttachments(caseId: string): Promise<OmpAuditInputFile[]> {
  const checkpoint = await prisma.checkpoint.findUnique({
    where: { case_id_checkpoint_code: { case_id: caseId, checkpoint_code: CP2_CHECKPOINT_CODE } },
    select: { id: true },
  });
  if (!checkpoint) return [];
  const docs = await prisma.documentRecord.findMany({
    where: {
      case_id: caseId,
      checkpoint_id: checkpoint.id,
      superseded_at: null,
      source_kind: { notIn: [...SUBMITTED_DOC_EXCLUDED_KINDS] },
      doc_type: { notIn: STAGE_DOC_EXCLUDED_TYPES },
    },
    orderBy: [{ created_at: "asc" }],
  });
  const files: OmpAuditInputFile[] = [];
  const used = new Set<string>();
  for (const doc of docs) {
    if (!doc.download_url) continue;
    const res = await fetch(doc.download_url, { signal: AbortSignal.timeout(ATTACHMENT_FETCH_TIMEOUT_MS) });
    if (!res.ok) {
      logger.error({ caseId, docId: doc.id, status: res.status }, "CP2 attachment fetch failed");
      throw new AppError(502, "ATTACHMENT_FETCH_FAILED", "Không tải được tệp đính kèm để chấm. Vui lòng thử lại.");
    }
    let name = safeFileName(doc.original_name || doc.canonical_name || `document_${doc.id}.${doc.extension || "bin"}`);
    if (used.has(name.toLowerCase())) name = `${doc.seq}_${doc.id.slice(0, 8)}_${name}`;
    used.add(name.toLowerCase());
    files.push({ name: `${CP2_ATTACHMENTS_DIR}/${name}`, content: Buffer.from(await res.arrayBuffer()) });
  }
  return files;
}

export interface Cp2InputRequest {
  caseId: string;
  submissionType: string;
  changeSummary?: string;
  /** CP2 scope (questionnaire | full); gates the quality bar. Defaults to full. */
  scope?: string;
  /** Which student inputs the grader reads. Undefined = legacy (answers + opportunistic attachments). */
  inputSource?: Cp2InputSource;
}

/** Stand-in for cp2_answers.md when grading on files only; keeps the "missing question = unanswered" rule from firing. */
const FILES_ONLY_ANSWERS_TEXT =
  "# Tài liệu CP2 của nhóm\n\nNhóm chọn chấm chỉ bằng tệp đính kèm trong `input/attachments/`. Nhóm không dùng mẫu câu hỏi ở lần chấm này: không coi câu hỏi vắng mặt là chưa trả lời, hãy lấy bằng chứng từ các tệp.\n";

/** CP2 sandbox input by chosen source (answers, files, or both), plus the previous report on resubmit. */
export async function assembleCp2InputFiles(req: Cp2InputRequest): Promise<{ inputFiles: OmpAuditInputFile[]; resolvedLifecycleUnitId: null }> {
  const source = req.inputSource;
  const rows = await prisma.projectAnswer.findMany({ where: { case_id: req.caseId }, select: { question_id: true, answer_text: true } });
  const answers = Object.fromEntries(rows.map((r) => [r.question_id, r.answer_text]));
  const attachments = source === "answers" ? [] : await loadAttachments(req.caseId);
  assertCp2InputSource(req.caseId, answers, req.scope ?? "full", source, attachments.length);

  const inputFiles: OmpAuditInputFile[] =
    source === "files"
      ? [{ name: CP2_ANSWERS_FILE, content: FILES_ONLY_ANSWERS_TEXT }, ...attachments]
      : [
          { name: CP2_ANSWERS_FILE, content: AUDIT_STAGE_INPUT_RULES ? renderStageAnswers(CP2_CHECKPOINT_CODE, answers).markdown : renderCp2Answers(answers) },
          { name: CP2_SELF_CHECKS_FILE, content: renderSelfChecks(answers) },
          ...attachments,
        ];

  if (req.submissionType === "resubmit") {
    const previous = await findLatestCp2FullReport(req.caseId);
    if (!previous) {
      throw new AppError(409, "CP2_NO_PREVIOUS_REPORT", "Chưa có báo cáo CP2 toàn bộ trước đó để chấm lại.");
    }
    const meta = { ...((previous.metadata_json ?? {}) as Record<string, unknown>) };
    for (const key of PROVENANCE_KEYS) delete meta[key];
    inputFiles.push(
      { name: "previous_report.md", content: previous.content_md },
      { name: "previous_report.json", content: JSON.stringify(meta, null, 2) },
      { name: "change_summary.md", content: req.changeSummary?.trim() || NO_CHANGE_SUMMARY_TEXT },
    );
  }
  return { inputFiles, resolvedLifecycleUnitId: null };
}
