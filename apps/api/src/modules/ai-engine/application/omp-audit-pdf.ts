import { resolve } from "node:path";
import logger from "../../../shared/infrastructure/logger.js";
import { generateReportPdfBuffer, buildReportPdfFilename } from "../../reports/infrastructure/pdf/pdfService.js";
import { upsertReportArtifactDocumentRecord } from "../../documents/infrastructure/persistence/document.repository.js";
import { uploadFile } from "../../../services/cloudinary.js";
import { prisma } from "../../../db.js";
import { resolveRepoRoot } from "../omp-audit.service.js";

export interface ReportPdfParams {
  caseId: string;
  projectName: string;
  reportMd: string;
  reportJson: Record<string, any>;
  /** Set for CP2 so the PDF renders the scored layout; CP1 leaves it undefined. */
  reportType?: string;
  versionNo: number | null;
  startedAtMs: number;
}

/** Compile the report PDF and upload it to Cloudinary (one retry). Failures degrade to null URLs. */
export async function generateAndUploadReportPdf(p: ReportPdfParams): Promise<{ pdfUrl: string | null; pdfPublicId: string | null }> {
  const { caseId, reportJson } = p;
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateReportPdfBuffer({
      markdown: p.reportMd,
      meta: {
        projectName: p.projectName,
        jobId: caseId,
        agentName: "omp",
        createdAt: new Date().toISOString(),
        overallScore: typeof reportJson.overallScore === "number" ? reportJson.overallScore : 70,
        verdict: typeof reportJson.verdict === "string" ? reportJson.verdict : "READY FOR REALITY CHECK",
        categoryScores: reportJson.categoryScores || {
          problemClarity: 70,
          marketViability: 70,
          businessModel: 70,
          competitiveMoat: 70,
          executionFeasibility: 70,
        },
        ...(p.reportType ? { reportType: p.reportType } : {}),
      },
      storageDir: resolve(resolveRepoRoot(), "storage"),
      force: true,
    });
  } catch (pdfErr) {
    logger.error({ caseId, pdfErr }, "Failed to generate Typst PDF during finalization");
  }
  if (!pdfBuffer) return { pdfUrl: null, pdfPublicId: null };

  const versionSuffix = p.versionNo != null ? `_v${String(p.versionNo).padStart(2, "0")}` : "";
  const cloudinaryName = `audit_report${versionSuffix}_${p.startedAtMs}.pdf`;
  try {
    const uploadRes = await uploadFile(pdfBuffer, `nexus/reports/${caseId}`, cloudinaryName, "raw");
    if (uploadRes?.fileUrl) {
      logger.info({ caseId, pdfUrl: uploadRes.fileUrl }, "Uploaded A4 PDF report to Cloudinary");
      return { pdfUrl: uploadRes.fileUrl, pdfPublicId: uploadRes.publicId };
    }
  } catch (uploadErr) {
    logger.warn({ caseId, uploadErr }, "Cloudinary upload failed during finalization, retrying once...");
    try {
      const retryRes = await uploadFile(pdfBuffer, `nexus/reports/${caseId}`, cloudinaryName, "raw");
      if (retryRes?.fileUrl) {
        logger.info({ caseId, pdfUrl: retryRes.fileUrl }, "Uploaded A4 PDF report to Cloudinary on retry");
        return { pdfUrl: retryRes.fileUrl, pdfPublicId: retryRes.publicId };
      }
    } catch (retryErr) {
      logger.error({ caseId, retryErr }, "Cloudinary retry also failed, continuing with local PDF");
    }
  }
  return { pdfUrl: null, pdfPublicId: null };
}

/** Sync artifact record so the report appears in the "Tài liệu" tab. Non-fatal. */
export async function syncReportArtifact(p: {
  caseId: string;
  savedReport: { id: string; checkpoint_id: string; lifecycle_unit_id: string | null; created_by: string; created_at: Date };
  projectName: string;
  submissionType: string;
  reportType?: string;
  versionNo: number | null;
  pdfUrl: string | null;
  pdfPublicId: string | null;
}): Promise<void> {
  const { caseId, savedReport } = p;
  try {
    const reportFilename = buildReportPdfFilename({
      projectName: p.projectName,
      submissionType: p.submissionType,
      reportType: p.reportType,
      createdAt: savedReport.created_at,
      versionNo: p.versionNo,
    });
    await upsertReportArtifactDocumentRecord(
      caseId,
      savedReport.checkpoint_id,
      savedReport.lifecycle_unit_id,
      null,
      savedReport.id,
      savedReport.created_by,
      prisma,
      {
        fileUrl: p.pdfUrl,
        downloadUrl: p.pdfUrl,
        cloudinaryPublicId: p.pdfPublicId,
        originalName: reportFilename,
        extension: "pdf",
        mimeType: "application/pdf",
      },
    );
  } catch (docErr) {
    logger.warn({ caseId, docErr }, "Failed to upsert report artifact document record");
  }
}
