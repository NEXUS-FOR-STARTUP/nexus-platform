import type { AuditSubmissionType } from "@app/shared";
import logger from "../../../shared/infrastructure/logger.js";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { findFirstIntakeUnit } from "../../cases/infrastructure/persistence/case.repository.js";
import { findApprovedReports } from "../../reports/infrastructure/persistence/report.repository.js";
import type { OmpAuditInputFile } from "../omp-audit.service.js";
import { AUDIT_STAGE_INPUT_RULES } from "../../../env.js";
import { findStageDocs, NO_CHANGE_SUMMARY_TEXT, renderStageAnswers, STAGE_DOC_EXCLUDED_TYPES } from "./stage-audit-input.js";
import { SUBMITTED_DOC_EXCLUDED_KINDS } from "../../documents/domain/document-types.js";
import type { DocumentRecord } from "@prisma/client";
import { ATTACHMENT_MANIFEST_FILE, buildAttachmentManifest, manifestEntry, uniqueSandboxName, type AttachmentManifestEntry } from "./attachment-manifest.js";

type SubmissionType = AuditSubmissionType;

type DocFileSource = Pick<DocumentRecord, "id" | "download_url" | "original_name" | "canonical_name" | "extension" | "metadata_json">;

/** Files this assembler writes into input/ itself; an upload must never take one of these names (case-insensitive). */
const CP1_SYSTEM_INPUT_FILES = [
  "intake_submission.md",
  "team_fit_report.md",
  "cp1_answers.md",
  "previous_report.md",
  "previous_report.json",
  "change_summary.md",
  ATTACHMENT_MANIFEST_FILE,
];

export function reservedInputNames(): Set<string> {
  return new Set(CP1_SYSTEM_INPUT_FILES.map((name) => name.toLowerCase()));
}

/**
 * Downloads each document into the sandbox input under a unique name and records it in the manifest;
 * an unreachable file is skipped, not fatal. `used` is the set of names already taken in input/.
 */
export async function appendDocFiles(
  docs: readonly DocFileSource[],
  inputFiles: OmpAuditInputFile[],
  entries: AttachmentManifestEntry[],
  used: Set<string>,
): Promise<void> {
  for (const doc of docs) {
    if (!doc.download_url) continue;
    try {
      const res = await fetch(doc.download_url);
      if (!res.ok) continue;
      const arrayBuf = await res.arrayBuffer();
      const fileName = uniqueSandboxName(doc.original_name || doc.canonical_name || `document_${doc.id}.${doc.extension || "bin"}`, doc.id, used);
      inputFiles.push({ name: fileName, content: Buffer.from(arrayBuf) });
      entries.push(manifestEntry(fileName, doc, "CP1"));
    } catch (fetchErr) {
      logger.warn({ docId: doc.id, fetchErr }, "Could not fetch document for audit input");
    }
  }
}

/** Newest first: every report filed under the case's CP1 checkpoint, the same set the stage summary reads. */
async function findLatestCp1Reports(caseId: string) {
  const checkpoint = await prisma.checkpoint.findUnique({ where: { case_id_checkpoint_code: { case_id: caseId, checkpoint_code: "CP1" } }, select: { id: true } });
  if (!checkpoint) return [];
  return await prisma.report.findMany({ where: { case_id: caseId, checkpoint_id: checkpoint.id }, orderBy: { created_at: "desc" }, take: 1 });
}

/**
 * Assemble input files scoped by submission type.
 *
 * - initial:    intake unit docs + intake_submission.md
 * - resubmit:   target unit docs (or, from the stage page, the stage's uploads) + previous_report + change_summary (NO intake baseline, NO full history)
 * - logic_check: latest unit docs (+ previous_report if available)
 */
export async function assembleCp1InputFiles(
  caseId: string,
  submissionType: SubmissionType,
  lifecycleUnitId: string | null,
  changeSummary?: string,
): Promise<{ inputFiles: OmpAuditInputFile[]; resolvedLifecycleUnitId: string | null }> {
  const inputFiles: OmpAuditInputFile[] = [];
  const entries: AttachmentManifestEntry[] = [];
  const used = reservedInputNames();

  if (submissionType === "initial") {
    // Initial → intake unit (v00) docs + intake_submission.md
    const intakeUnit = await findFirstIntakeUnit(caseId);
    if (intakeUnit?.content) {
      inputFiles.push({ name: "intake_submission.md", content: intakeUnit.content });
    }

    // Include Team Fit Report if available (for cases originating from Team Fit flow)
    const teamFit = await prisma.teamFitReport.findUnique({ where: { case_id: caseId } });
    if (teamFit) {
      const idea = (teamFit.idea_snapshot as Record<string, unknown>) || {};
      const team = (teamFit.team_snapshot as Record<string, unknown>) || {};

      const teamFitMd = `# Báo cáo phân tích Team Fit ban đầu (Team Fit Report)

## 1. Thông tin ý tưởng (Idea Snapshot)
- **Tên dự án:** ${String(idea["projectName"] || "Chưa cập nhật")}
- **Lĩnh vực:** ${String(idea["field"] || "Chưa cập nhật")}
- **Vấn đề:** ${String(idea["problem"] || "Chưa cập nhật")}
- **Giải pháp:** ${String(idea["solution"] || "Chưa cập nhật")}
- **Khách hàng mục tiêu:** ${String(idea["targetCustomer"] || "Chưa cập nhật")}
- **MVP / Thử nghiệm:** ${String(idea["mvp"] || "Chưa cập nhật")}

## 2. Khảo sát Đội ngũ (Team Snapshot)
\`\`\`json
${JSON.stringify(team, null, 2)}
\`\`\`
`;
      inputFiles.push({ name: "team_fit_report.md", content: teamFitMd });
    }

    if (AUDIT_STAGE_INPUT_RULES) {
      const answerRows = await prisma.projectAnswer.findMany({ where: { case_id: caseId }, select: { question_id: true, answer_text: true } });
      const stageAnswers = renderStageAnswers("CP1", Object.fromEntries(answerRows.map((r) => [r.question_id, r.answer_text])));
      if (stageAnswers.answered > 0) inputFiles.push({ name: "cp1_answers.md", content: stageAnswers.markdown });
    }

    // Only what the team uploaded to this stage. Grading output (report PDFs, guided exports, supporter files)
    // is generated for the team, never input: feeding it back is a self-loop, and CP2 uploads are not CP1 evidence.
    // A second initial run is the team re-grading after adding files, so it reads the same uploads, not the earlier verdicts.
    const submitted = await findStageDocs(caseId, "CP1");
    await appendDocFiles(submitted, inputFiles, entries, used);
    const manifest = buildAttachmentManifest(entries);
    if (manifest) inputFiles.push(manifest);
    return { inputFiles, resolvedLifecycleUnitId: intakeUnit?.id ?? null };
  }

  // For resubmit and logic_check, we need a lifecycle unit
  let resolvedUnitId = lifecycleUnitId;

  if (submissionType === "logic_check" && !resolvedUnitId) {
    // logic_check: use latest unit if not specified
    const latestUnit = await prisma.lifecycleUnit.findFirst({
      where: { case_id: caseId, unit_type: "version" },
      orderBy: { version_no: "desc" },
    });
    resolvedUnitId = latestUnit?.id ?? null;
  }

  // With stage input rules the student re-grades from the stage page: no revision upload, so no unit to resolve.
  const stageResubmit = submissionType === "resubmit" && !resolvedUnitId && AUDIT_STAGE_INPUT_RULES;
  if (submissionType === "resubmit" && !resolvedUnitId && !stageResubmit) {
    throw new AppError(409, "RESUBMIT_REQUIRES_UPLOAD", "Vui lòng upload tài liệu sửa đổi trước khi yêu cầu thẩm định lại.");
  }

  // Fetch docs: the lifecycle unit's, or (stage re-grade) what the team has uploaded to the stage now
  if (stageResubmit) {
    await appendDocFiles(await findStageDocs(caseId, "CP1"), inputFiles, entries, used);
  } else if (resolvedUnitId) {
    const unitDocs = await prisma.documentRecord.findMany({
      where: { lifecycle_unit_id: resolvedUnitId, superseded_at: null, source_kind: { notIn: [...SUBMITTED_DOC_EXCLUDED_KINDS] }, doc_type: { notIn: STAGE_DOC_EXCLUDED_TYPES } },
      orderBy: [{ seq: "asc" }, { created_at: "asc" }],
    });
    await appendDocFiles(unitDocs, inputFiles, entries, used);
  }

  // For resubmit: add previous report + change_summary
  if (submissionType === "resubmit") {
    // The stage page enables "re-grade" from the stage's latest report whatever its status
    // (deriveStageSummaries), so the baseline must be picked the same way, not only among APPROVED ones.
    const reports = stageResubmit ? await findLatestCp1Reports(caseId) : await findApprovedReports(caseId);
    if (stageResubmit && reports.length === 0) {
      throw new AppError(409, "RESUBMIT_REQUIRES_PREVIOUS_REPORT", "Chưa có kết quả chấm trước đó để đối chiếu. Hãy chọn chấm mới.");
    }
    if (reports.length > 0) {
      const latestReport = reports[0]; // desc order, first = latest
      if (latestReport.content_md) {
        inputFiles.push({ name: "previous_report.md", content: latestReport.content_md });
      }
      if (AUDIT_STAGE_INPUT_RULES && latestReport.metadata_json) {
        inputFiles.push({ name: "previous_report.json", content: JSON.stringify(latestReport.metadata_json, null, 2) });
      }
    }
    if (stageResubmit) {
      inputFiles.push({ name: "change_summary.md", content: changeSummary?.trim() || NO_CHANGE_SUMMARY_TEXT });
    } else if (resolvedUnitId) {
      // change_summary: stored in lifecycle_unit.content as JSON { change_summary, documents, remaining_blockers }
      const unit = await prisma.lifecycleUnit.findUnique({ where: { id: resolvedUnitId } });
      if (unit?.content) {
        try {
          const parsed = JSON.parse(unit.content);
          const unitChangeSummary = parsed.change_summary || parsed.reason || unit.content;
          inputFiles.push({ name: "change_summary.md", content: unitChangeSummary });
        } catch {
          // Not JSON, use raw content
          inputFiles.push({ name: "change_summary.md", content: unit.content });
        }
      }
    }
  }

  // For logic_check: add previous report if available (optional)
  if (submissionType === "logic_check") {
    const reports = await findApprovedReports(caseId);
    if (reports.length > 0) {
      const latestReport = reports[0];
      if (latestReport.content_md) {
        inputFiles.push({ name: "previous_report.md", content: latestReport.content_md });
      }
    }
  }

  const manifest = buildAttachmentManifest(entries);
  if (manifest) inputFiles.push(manifest);
  return { inputFiles, resolvedLifecycleUnitId: resolvedUnitId };
}
