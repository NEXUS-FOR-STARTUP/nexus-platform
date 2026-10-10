import { basename } from "node:path";
import { CP2_SELF_CHECKS, QUESTION_REGISTRY, TEMPLATE_REGISTRY } from "@repo/validation";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import { findLatestCp2FullReport } from "../../reports/infrastructure/persistence/report.repository.js";
import type { OmpAuditInputFile } from "../omp-audit.service.js";

export const CP2_CHECKPOINT_CODE = "CP2";
export const CP2_ANSWERS_FILE = "cp2_answers.md";
export const CP2_SELF_CHECKS_FILE = "self_checks.md";
export const CP2_ATTACHMENTS_DIR = "attachments";
const UNANSWERED_TEXT = "(Nhóm chưa trả lời)";
const NO_CHANGE_SUMMARY_TEXT = "(Nhóm không ghi tóm tắt thay đổi)";
const ATTACHMENT_FETCH_TIMEOUT_MS = Number(process.env.OMP_INPUT_FETCH_TIMEOUT_MS ?? 30_000);
const NON_ATTACHMENT_DOC_TYPES = ["assessment_report", "supporter_output", "supporter_attachment", "payment_proof"];
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
      source_kind: { not: "generated" },
      doc_type: { notIn: NON_ATTACHMENT_DOC_TYPES },
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
}

/** CP2 sandbox input: answers, self-checks, attachments, and the previous report on resubmit. */
export async function assembleCp2InputFiles(req: Cp2InputRequest): Promise<{ inputFiles: OmpAuditInputFile[]; resolvedLifecycleUnitId: null }> {
  const rows = await prisma.projectAnswer.findMany({ where: { case_id: req.caseId }, select: { question_id: true, answer_text: true } });
  const answers = Object.fromEntries(rows.map((r) => [r.question_id, r.answer_text]));

  const inputFiles: OmpAuditInputFile[] = [
    { name: CP2_ANSWERS_FILE, content: renderCp2Answers(answers) },
    { name: CP2_SELF_CHECKS_FILE, content: renderSelfChecks(answers) },
    ...(await loadAttachments(req.caseId)),
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
