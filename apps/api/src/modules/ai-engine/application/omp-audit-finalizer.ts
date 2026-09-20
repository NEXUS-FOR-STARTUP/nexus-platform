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
  updateAiJobStatusById,
  updateCaseAuditStage,
} from "../infrastructure/persistence/ai-job.repository.js";
import { saveOmpAuditReport } from "../../reports/infrastructure/persistence/report.repository.js";
import { upsertReportArtifactDocumentRecord } from "../../documents/infrastructure/persistence/document.repository.js";
import { uploadFile } from "../../../services/cloudinary.js";
import { resolveRepoRoot } from "../omp-audit.service.js";
import { prisma } from "../../../db.js";
import { ompQueue } from "../infrastructure/queue/omp-queue.js";

/**
 * Resolve the sandbox directory on disk for a job.
 * Checks nested `storage/jobs/${caseId}/${aiJobId}` first when aiJobId is provided,
 * with fallbacks to flat storage paths for backward compatibility.
 */
export function resolveJobSandboxDir(caseId: string, aiJobId?: string): string {
  const projectRoot = resolveRepoRoot();

  if (aiJobId) {
    // 1. Nested: storage/jobs/{caseId}/{aiJobId}
    const nested = resolve(projectRoot, "storage", "jobs", caseId, aiJobId);
    if (existsSync(nested)) return nested;

    const apiNested = resolve(projectRoot, "apps", "api", "storage", "jobs", caseId, aiJobId);
    if (existsSync(apiNested)) return apiNested;

    // 2. Flat fallback: storage/jobs/{aiJobId}
    const flatJob = resolve(projectRoot, "storage", "jobs", aiJobId);
    if (existsSync(flatJob)) return flatJob;

    const apiFlatJob = resolve(projectRoot, "apps", "api", "storage", "jobs", aiJobId);
    if (existsSync(apiFlatJob)) return apiFlatJob;
  }

  // 3. Fallback: storage/jobs/{caseId} (legacy runs)
  const legacyCaseDir = resolve(projectRoot, "storage", "jobs", caseId);
  if (existsSync(legacyCaseDir)) return legacyCaseDir;

  const apiLegacyCaseDir = resolve(projectRoot, "apps", "api", "storage", "jobs", caseId);
  if (existsSync(apiLegacyCaseDir)) return apiLegacyCaseDir;

  // Default target path
  return aiJobId
    ? resolve(projectRoot, "storage", "jobs", caseId, aiJobId)
    : resolve(projectRoot, "storage", "jobs", caseId);
}

/**
 * Read OMP outputs from sandbox disk, compile Typst PDF, and persist report in Postgres.
 */
export async function finalizeOmpAuditResult(caseId: string, aiJobId?: string): Promise<boolean> {
  const projectRoot = resolveRepoRoot();
  const jobDir = resolveJobSandboxDir(caseId, aiJobId);
  const outputDir = resolve(jobDir, "output");
  mkdirSync(outputDir, { recursive: true });

  const candidateDirs = [
    jobDir,
    resolve(projectRoot, "storage", "jobs", caseId),
    resolve(projectRoot, "apps", "api", "storage", "jobs", caseId),
    ...(aiJobId
      ? [
          resolve(projectRoot, "storage", "jobs", caseId, aiJobId),
          resolve(projectRoot, "apps", "api", "storage", "jobs", caseId, aiJobId),
          resolve(projectRoot, "storage", "jobs", aiJobId),
          resolve(projectRoot, "apps", "api", "storage", "jobs", aiJobId),
        ]
      : []),
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
    logger.error({ caseId, aiJobId, jobDir }, "OMP output files missing, cannot finalize report");
    return false;
  }
  const reportJsonRaw = readFileSync(reportJsonPath, "utf-8");
  const reportMd = readFileSync(reportMdPath, "utf-8");
  const reportJson = JSON.parse(reportJsonRaw) as Record<string, any>;

  // Compile Typst PDF
  const caseRecord = await findCaseDetailForPdf(caseId);
  const projectName = reportJson.projectName || caseRecord?.team_name || caseRecord?.case_code || "Dự án khởi nghiệp";

  // Read submission metadata from AiJob.input_json
  const aiJob = aiJobId
    ? (await prisma.aiJob.findUnique({ where: { id: aiJobId } })) || (await findLatestAiJobByCase(caseId))
    : await findLatestAiJobByCase(caseId);
  const aiJobInput = (aiJob?.input_json ?? null) as Record<string, unknown> | null;
  // `initial` with the same trigger reuses the existing report; `resubmit`/`logic_check`
  // always insert a new row. Old jobs without startedAt fall back to Date.now() (guard loose, no crash).
  const submissionType = (aiJobInput?.submission_type as string | undefined) ?? "initial";
  const triggerStartedAt = (aiJobInput?.startedAt as string | undefined) ?? null;
  const parsedStartedAtMs = triggerStartedAt ? new Date(triggerStartedAt).getTime() : NaN;
  if (!Number.isFinite(parsedStartedAtMs)) {
    logger.warn({ caseId, triggerStartedAt }, "trigger startedAt missing or invalid, using Date.now() fallback");
  }
  const startedAtMs = Number.isFinite(parsedStartedAtMs) ? parsedStartedAtMs : Date.now();

  // Resolve target lifecycle_unit_id early (needed for PDF versioning).
  // Priority: BullMQ job.data (freshest per-trigger identity, avoids TOCTOU
  // between two close triggers) > aiJob.input_json (persisted resolved unit,
  // survives worker restart when job.data is lost) > latest version unit.
  let jobDataLifecycleUnitId: string | null = null;
  try {
    const bullJob = aiJobId
      ? (await ompQueue.getJob(`omp-${caseId}--${aiJobId}`)) || (await ompQueue.getJob(`omp-${caseId}`))
      : await ompQueue.getJob(`omp-${caseId}`);
    const bullData = (bullJob?.data as { lifecycleUnitId?: string } | undefined) ?? null;
    if (bullData?.lifecycleUnitId) {
      const unit = await prisma.lifecycleUnit.findUnique({ where: { id: bullData.lifecycleUnitId }, select: { id: true, case_id: true } });
      if (unit && unit.case_id === caseId) {
        jobDataLifecycleUnitId = unit.id;
      } else {
        logger.warn({ caseId, bullUnitId: bullData.lifecycleUnitId }, "BullMQ job.data lifecycleUnitId missing or belongs to another case, ignoring");
      }
    }
  } catch (jobErr) {
    logger.warn({ caseId, jobErr }, "Failed to read BullMQ job.data for lifecycle_unit_id, using input_json fallback");
  }
  let lifecycleUnitId: string | null =
    jobDataLifecycleUnitId ?? (aiJobInput?.lifecycle_unit_id as string | undefined) ?? null;

  if (!lifecycleUnitId) {
    const latestUnit = await prisma.lifecycleUnit.findFirst({
      where: { case_id: caseId, unit_type: "version" },
      orderBy: { version_no: "desc" },
    });
    if (latestUnit) {
      const existingReport = await prisma.report.findFirst({
        where: { lifecycle_unit_id: latestUnit.id },
        select: { id: true },
      });
      if (existingReport && submissionType === "initial") {
        logger.info(
          { caseId, reportId: existingReport.id },
          "Report already finalized for this lifecycle unit, ensuring state and returning cleanly",
        );
        if (aiJobId) {
          await updateAiJobStatusById(aiJobId, "completed", reportJson);
        } else {
          await updateAiJobStatus(caseId, "completed", reportJson);
        }
        await updateCaseAuditStage(caseId, "report_ready", "report_ready_to_publish");
        return true;
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
    const cloudinaryName = `audit_report${versionSuffix}_${startedAtMs}.pdf`;
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
    submission_type: submissionType,
    triggerStartedAt,
    model: (aiJobInput?.model as string | undefined) ?? process.env.OMP_MODEL ?? "mimo/mimo-v2.5",
  };
  delete metadataJson.reportMarkdown;

  // Save report into Postgres. Dedupe by trigger identity (lifecycle_unit_id +
  // triggerStartedAt) for ALL submission types: BullMQ may fire `completed`
  // twice for the same job, so resubmit/logic_check must also be idempotent.
  // Additional invariant: each lifecycle_unit has at most one `initial` report.
  // The check and the insert run in one transaction, with the case row locked
  // (SELECT FOR UPDATE) so concurrent finalizers for the same case serialize
  // instead of double-inserting. Code-level guard only — no unique constraint,
  // no migration.
  const savedReport = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "cases" WHERE id = ${caseId} FOR UPDATE`;
    if (lifecycleUnitId) {
      // Global dedupe: same unit + same trigger = return existing (any type).
      // Trigger identity is stored in metadata_json.triggerStartedAt (written by
      // coordinator and persisted in metadataJson); compare as string to avoid
      // JSON coercion surprises.
      if (triggerStartedAt) {
        const existingByTrigger = await tx.report.findFirst({
          where: {
            lifecycle_unit_id: lifecycleUnitId,
            metadata_json: { path: ["triggerStartedAt"], equals: triggerStartedAt },
          },
        });
        if (existingByTrigger) {
          logger.info(
            { caseId, reportId: existingByTrigger.id },
            "Report already saved for this trigger identity, returning existing record",
          );
          return existingByTrigger;
        }
      }
      // Per-type invariant: each unit has at most ONE initial report.
      if (submissionType === "initial") {
        const existingInitial = await tx.report.findFirst({
          where: {
            lifecycle_unit_id: lifecycleUnitId,
            metadata_json: { path: ["submission_type"], equals: "initial" },
          },
        });
        if (existingInitial) {
          logger.info(
            { caseId, reportId: existingInitial.id },
            "Initial report already exists for this lifecycle unit, returning existing record",
          );
          return existingInitial;
        }
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
      submissionType,
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
  if (aiJobId) {
    await updateAiJobStatusById(aiJobId, "completed", reportJson);
  } else {
    await updateAiJobStatus(caseId, "completed", reportJson);
  }

  // Transition case to report_ready via repository
  await updateCaseAuditStage(caseId, "report_ready", "report_ready_to_publish");

  logger.info({ caseId }, "OMP audit finalized successfully and report saved to database!");
  return true;
}
