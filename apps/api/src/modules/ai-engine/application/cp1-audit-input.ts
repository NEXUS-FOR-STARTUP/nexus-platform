import type { AuditSubmissionType } from "@app/shared";
import logger from "../../../shared/infrastructure/logger.js";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { findFirstIntakeUnit } from "../../cases/infrastructure/persistence/case.repository.js";
import { findDocumentRecordsByCaseId } from "../../documents/infrastructure/persistence/document.repository.js";
import { findApprovedReports } from "../../reports/infrastructure/persistence/report.repository.js";
import type { OmpAuditInputFile } from "../omp-audit.service.js";

type SubmissionType = AuditSubmissionType;

/**
 * Assemble input files scoped by submission type.
 *
 * - initial:    intake unit docs + intake_submission.md
 * - resubmit:   target unit docs + previous_report + change_summary (NO intake baseline, NO full history)
 * - logic_check: latest unit docs (+ previous_report if available)
 */
export async function assembleCp1InputFiles(
  caseId: string,
  submissionType: SubmissionType,
  lifecycleUnitId: string | null,
): Promise<{ inputFiles: OmpAuditInputFile[]; resolvedLifecycleUnitId: string | null }> {
  const inputFiles: OmpAuditInputFile[] = [];

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

    const documents = await findDocumentRecordsByCaseId(caseId);
    for (const doc of documents) {
      if (doc.download_url) {
        try {
          const res = await fetch(doc.download_url);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            const fileName = doc.original_name || doc.canonical_name || `document_${doc.id}.${doc.extension || "bin"}`;
            inputFiles.push({ name: fileName, content: Buffer.from(arrayBuf) });
          }
        } catch (fetchErr) {
          logger.warn({ docId: doc.id, fetchErr }, "Could not fetch document for audit input");
        }
      }
    }
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

  if (submissionType === "resubmit" && !resolvedUnitId) {
    throw new AppError(409, "RESUBMIT_REQUIRES_UPLOAD", "Vui lòng upload tài liệu sửa đổi trước khi yêu cầu thẩm định lại.");
  }

  // Fetch docs scoped to the lifecycle unit
  if (resolvedUnitId) {
    const unitDocs = await prisma.documentRecord.findMany({
      where: { lifecycle_unit_id: resolvedUnitId, superseded_at: null },
      orderBy: [{ seq: "asc" }, { created_at: "asc" }],
    });
    for (const doc of unitDocs) {
      if (doc.download_url) {
        try {
          const res = await fetch(doc.download_url);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            const fileName = doc.original_name || doc.canonical_name || `document_${doc.id}.${doc.extension || "bin"}`;
            inputFiles.push({ name: fileName, content: Buffer.from(arrayBuf) });
          }
        } catch (fetchErr) {
          logger.warn({ docId: doc.id, fetchErr }, "Could not fetch document for audit input");
        }
      }
    }
  }

  // For resubmit: add previous report + change_summary
  if (submissionType === "resubmit") {
    const reports = await findApprovedReports(caseId);
    if (reports.length > 0) {
      const latestReport = reports[0]; // desc order, first = latest
      if (latestReport.content_md) {
        inputFiles.push({ name: "previous_report.md", content: latestReport.content_md });
      }
    }
    // change_summary: stored in lifecycle_unit.content as JSON { change_summary, documents, remaining_blockers }
    if (resolvedUnitId) {
      const unit = await prisma.lifecycleUnit.findUnique({ where: { id: resolvedUnitId } });
      if (unit?.content) {
        try {
          const parsed = JSON.parse(unit.content);
          const changeSummary = parsed.change_summary || parsed.reason || unit.content;
          inputFiles.push({ name: "change_summary.md", content: changeSummary });
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

  return { inputFiles, resolvedLifecycleUnitId: resolvedUnitId };
}
