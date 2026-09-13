import { existsSync, readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import logger from "../../../shared/infrastructure/logger.js";
import {
  generateReportPdfBuffer,
  buildReportPdfFilename,
} from "../../reports/infrastructure/pdf/pdfService.js";
import {
  findCaseDetailForPdf,
  findLatestAiJobByCase,
  updateAiJobStatus,
  updateCaseAuditStage,
} from "../infrastructure/persistence/ai-job.repository.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { saveOmpAuditReport } from "../../reports/infrastructure/persistence/report.repository.js";
import { upsertReportArtifactDocumentRecord } from "../../documents/infrastructure/persistence/document.repository.js";
import { uploadFile } from "../../../services/cloudinary.js";
import { resolveRepoRoot } from "../omp-audit.service.js";
import { prisma } from "../../../db.js";

/**
 * Read OMP outputs from sandbox disk, compile Typst PDF, and persist report in Postgres.
 */
export async function finalizeOmpAuditResult(caseId: string): Promise<boolean> {
  const projectRoot = resolveRepoRoot();
  const jobDir = resolve(projectRoot, "storage", "jobs", caseId);
  const outputDir = resolve(jobDir, "output");
  mkdirSync(outputDir, { recursive: true });

  const candidateDirs = [
    jobDir,
    resolve(projectRoot, "apps", "api", "storage", "jobs", caseId),
  ];

  for (const dir of candidateDirs) {
    if (dir === jobDir) continue;
    const candidateReportJson = resolve(dir, "output", "report.json");
    const candidateReportMd = resolve(dir, "output", "input_clarification_audit.md");
    if (existsSync(candidateReportJson) && existsSync(candidateReportMd)) {
      if (!existsSync(resolve(outputDir, "report.json"))) {
        copyFileSync(candidateReportJson, resolve(outputDir, "report.json"));
      }
      if (!existsSync(resolve(outputDir, "input_clarification_audit.md"))) {
        copyFileSync(candidateReportMd, resolve(outputDir, "input_clarification_audit.md"));
      }
      const candidateTriad = resolve(dir, "output", "triad_handoff_packet.md");
      if (existsSync(candidateTriad) && !existsSync(resolve(outputDir, "triad_handoff_packet.md"))) {
        copyFileSync(candidateTriad, resolve(outputDir, "triad_handoff_packet.md"));
      }
      break;
    }
  }

  const reportJsonPath = resolve(outputDir, "report.json");
  const reportMdPath = resolve(outputDir, "input_clarification_audit.md");

  if (!existsSync(reportJsonPath) || !existsSync(reportMdPath)) {
    logger.error({ caseId }, "OMP output files missing, cannot finalize report");
    return false;
  }

  const reportJsonRaw = readFileSync(reportJsonPath, "utf-8");
  const reportMd = readFileSync(reportMdPath, "utf-8");
  const reportJson = JSON.parse(reportJsonRaw) as Record<string, any>;

  // Compile Typst PDF
  const caseRecord = await findCaseDetailForPdf(caseId);
  const projectName = reportJson.projectName || caseRecord?.team_name || caseRecord?.case_code || "Dự án khởi nghiệp";

  // Read submission metadata from AiJob.input_json
  const aiJob = await findLatestAiJobByCase(caseId);
  const aiJobInput = (aiJob?.input_json ?? null) as Record<string, unknown> | null;

  // Resolve target lifecycle_unit_id early (needed for PDF versioning)
  let lifecycleUnitId: string | null =
    (aiJobInput?.lifecycle_unit_id as string | undefined) ?? null;

  if (!lifecycleUnitId) {
    const latestUnit = await prisma.lifecycleUnit.findFirst({
      where: { case_id: caseId },
      orderBy: { version_no: "desc" },
    });
    if (latestUnit) {
      const existingReport = await prisma.report.findFirst({
        where: { lifecycle_unit_id: latestUnit.id },
        select: { id: true },
      });
      if (existingReport) {
        throw new AppError(
          409,
          "RESUBMIT_REQUIRES_UPLOAD",
          "Cần nộp tài liệu sửa trước khi audit lại.",
        );
      }
      lifecycleUnitId = latestUnit.id;
    }
  }

  // Resolve version_no for PDF filename versioning
  let versionNo: number | null = null;
  if (lifecycleUnitId) {
    const unit = await prisma.lifecycleUnit.findUnique({
      where: { id: lifecycleUnitId },
      select: { version_no: true },
    });
    versionNo = unit?.version_no ?? null;
  }

  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await generateReportPdfBuffer({
      markdown: reportMd,
      meta: {
        projectName,
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
      },
      storageDir: resolve(projectRoot, "storage"),
      force: true,
    });
  } catch (pdfErr) {
    logger.error({ caseId, pdfErr }, "Failed to generate Typst PDF during finalization");
  }

  // Upload PDF to Cloudinary if generated
  let pdfUrl: string | null = null;
  let pdfPublicId: string | null = null;
  if (pdfBuffer) {
    const versionSuffix = versionNo != null ? `_v${String(versionNo).padStart(2, "0")}` : "";
    const cloudinaryName = `audit_report${versionSuffix}`;
    try {
      const uploadRes = await uploadFile(
        pdfBuffer,
        `nexus/reports/${caseId}`,
        cloudinaryName,
        "raw",
      );
      if (uploadRes?.fileUrl) {
        pdfUrl = uploadRes.fileUrl;
        pdfPublicId = uploadRes.publicId;
        logger.info({ caseId, pdfUrl }, "Uploaded A4 PDF report to Cloudinary");
      }
    } catch (uploadErr) {
      logger.warn({ caseId, uploadErr }, "Cloudinary upload failed during finalization, retrying once...");
      try {
        const retryRes = await uploadFile(
          pdfBuffer,
          `nexus/reports/${caseId}`,
          cloudinaryName,
          "raw",
        );
        if (retryRes?.fileUrl) {
          pdfUrl = retryRes.fileUrl;
          pdfPublicId = retryRes.publicId;
          logger.info({ caseId, pdfUrl }, "Uploaded A4 PDF report to Cloudinary on retry");
        }
      } catch (retryErr) {
        logger.error({ caseId, retryErr }, "Cloudinary retry also failed, continuing with local PDF");
      }
    }
  }

  const metadataJson: Record<string, unknown> = {
    ...reportJson,
    pdfUrl,
    pdfPublicId,
    submission_type: (aiJobInput?.submission_type as string) ?? "initial",
  };
  delete metadataJson.reportMarkdown;

  // Save report into Postgres — always creates a new row (never upserts).
  // The duplicate-report check and the insert run in one transaction, with
  // the case row locked (SELECT FOR UPDATE) so concurrent finalizers for
  // the same case serialize instead of double-inserting. Code-level guard
  // only — no unique constraint, no migration.
  const savedReport = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "cases" WHERE id = ${caseId} FOR UPDATE`;
    if (lifecycleUnitId) {
      const existing = await tx.report.findFirst({
        where: { lifecycle_unit_id: lifecycleUnitId },
        select: { id: true },
      });
      if (existing) {
        throw new AppError(
          409,
          "RESUBMIT_REQUIRES_UPLOAD",
          "Cần nộp tài liệu sửa trước khi audit lại.",
        );
      }
    }
    return saveOmpAuditReport(
      {
        caseId,
        lifecycleUnitId,
        contentMd: reportMd,
        metadataJson,
      },
      tx,
    );
  });

  // Sync artifact record so it appears in "Tài liệu" tab
  try {
    const reportFilename = buildReportPdfFilename({
      projectName,
      createdAt: savedReport.created_at,
      versionNo,
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
        fileUrl: pdfUrl,
        downloadUrl: pdfUrl,
        cloudinaryPublicId: pdfPublicId,
        originalName: reportFilename,
        extension: "pdf",
        mimeType: "application/pdf",
      },
    );
  } catch (docErr) {
    logger.warn({ caseId, docErr }, "Failed to upsert report artifact document record");
  }

  // Update AI Job status via repository
  await updateAiJobStatus(caseId, "completed", reportJson);

  // Transition case to report_ready via repository
  await updateCaseAuditStage(caseId, "report_ready", "report_ready_to_publish");

  logger.info({ caseId }, "OMP audit finalized successfully and report saved to database!");
  return true;
}
