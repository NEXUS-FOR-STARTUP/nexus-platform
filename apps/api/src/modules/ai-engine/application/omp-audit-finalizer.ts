import { existsSync, readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import logger from "../../../shared/infrastructure/logger.js";
import {
  findCaseDetailForPdf,
  findLatestAiJobByCase,
  updateAiJobStatus,
  updateAiJobStatusById,
  updateCaseAuditStage,
  runningCheckpointCode,
} from "../infrastructure/persistence/ai-job.repository.js";
import { saveOmpAuditReport } from "../../reports/infrastructure/persistence/report.repository.js";
import { getAuditService } from "./audit-services.js";
import type { AuditCheckpointCode } from "@app/shared";
import { AUDIT_CHECKPOINTS } from "@app/shared";
import { resolveRepoRoot } from "../omp-audit.service.js";
import { generateAndUploadReportPdf, syncReportArtifact } from "./omp-audit-pdf.js";
import { POST_PROCESSORS, resolveAuditPlan } from "./audit-registry.js";
import { prisma } from "../../../db.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { ompQueue } from "../infrastructure/queue/omp-queue.js";
import { recordCaseEvent } from "../../cases/infrastructure/persistence/case-event.repository.js";

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

  // 3. Fallback: storage/jobs/{caseId} (legacy runs without aiJobId only)
  const legacyCaseDir = resolve(projectRoot, "storage", "jobs", caseId);
  if (existsSync(legacyCaseDir) && !aiJobId) return legacyCaseDir;

  const apiLegacyCaseDir = resolve(projectRoot, "apps", "api", "storage", "jobs", caseId);
  if (existsSync(apiLegacyCaseDir) && !aiJobId) return apiLegacyCaseDir;
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

  // The checkpoint decides which files are required; read it before touching disk.
  const earlyJob = aiJobId ? await prisma.aiJob.findUnique({ where: { id: aiJobId } }) : null;
  const earlyCheckpoint = runningCheckpointCode(earlyJob?.input_json) as AuditCheckpointCode;
  const earlyService = getAuditService(earlyCheckpoint);
  const requiredFiles: readonly string[] = AUDIT_CHECKPOINTS[earlyCheckpoint].outputs.required;
  const mdFileName = earlyService.reportMdName;

  const candidateDirs = aiJobId
    ? [
        jobDir,
        resolve(projectRoot, "storage", "jobs", caseId, aiJobId),
        resolve(projectRoot, "apps", "api", "storage", "jobs", caseId, aiJobId),
        resolve(projectRoot, "storage", "jobs", aiJobId),
        resolve(projectRoot, "apps", "api", "storage", "jobs", aiJobId),
      ]
    : [
        jobDir,
        resolve(projectRoot, "storage", "jobs", caseId),
        resolve(projectRoot, "apps", "api", "storage", "jobs", caseId),
      ];

  const copyRequiredFrom = (dir: string): boolean => {
    const present = requiredFiles.filter((f) => existsSync(resolve(dir, "output", f)));
    if (present.length !== requiredFiles.length) return false;
    for (const f of [...requiredFiles, ...(Object.hasOwn(AUDIT_CHECKPOINTS, earlyCheckpoint) ? AUDIT_CHECKPOINTS[earlyCheckpoint].outputs.optional : [])]) {
      const src = resolve(dir, "output", f);
      const dst = resolve(outputDir, f);
      if (existsSync(src) && !existsSync(dst)) copyFileSync(src, dst);
    }
    return true;
  };
  for (const dir of candidateDirs) {
    if (dir === jobDir) continue;
    if (copyRequiredFrom(dir)) break;
  }

  const missingOutputs = requiredFiles.filter((f) => !existsSync(resolve(outputDir, f)));
  const reportJsonPath = resolve(outputDir, "report.json");
  const reportMdPath = resolve(outputDir, mdFileName);

  if (missingOutputs.length > 0) {
    logger.error({ caseId, aiJobId, jobDir, missingOutputs }, "OMP output files missing, cannot finalize report");
    return false;
  }
  const reportJsonRaw = readFileSync(reportJsonPath, "utf-8");
  const reportMd = readFileSync(reportMdPath, "utf-8");
  let reportJson: Record<string, any>;
  try {
    reportJson = JSON.parse(reportJsonRaw) as Record<string, any>;
  } catch (err: unknown) {
    throw new Error(`report.json is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Compile Typst PDF
  const caseRecord = await findCaseDetailForPdf(caseId);
  const projectName = caseRecord?.team_name || caseRecord?.case_code || "Dự án khởi nghiệp";

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

  // Checkpoint, scope and submission type come from the job input; the lookup table decides
  // prompts, report type and post-processing.
  const checkpointCode = runningCheckpointCode(aiJobInput) as AuditCheckpointCode;
  const service = getAuditService(checkpointCode);
  const scope = (aiJobInput?.scope as string | undefined) ?? (aiJobInput?.prompt_mode as string | undefined) ?? "full";
  const plan = resolveAuditPlan(checkpointCode, scope, submissionType);
  // CP1 keeps its legacy PDF template (no report type); every other service renders by its own type.
  const pdfReportType = service.lifecycleUnit ? undefined : plan.reportType;
  reportJson = await POST_PROCESSORS[plan.postProcess]({ caseId, aiJobId, jobDir, scope, submissionType, reportJson });

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
    service.lifecycleUnit ? (jobDataLifecycleUnitId ?? (aiJobInput?.lifecycle_unit_id as string | undefined) ?? null) : null;

  if (!lifecycleUnitId && service.lifecycleUnit) {
    const latestUnit = await prisma.lifecycleUnit.findFirst({
      where: { case_id: caseId, unit_type: "version" },
      orderBy: { version_no: "desc" },
    });
    if (latestUnit) {
      // Re-entry guard: this exact trigger already saved its report (status polling re-enters finalize).
      // A report from an earlier trigger must not swallow this run's result.
      const existingReport = triggerStartedAt
        ? await prisma.report.findFirst({
            where: { lifecycle_unit_id: latestUnit.id, metadata_json: { path: ["triggerStartedAt"], equals: triggerStartedAt } },
            select: { id: true },
          })
        : null;
      if (existingReport) {
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

  const { pdfUrl, pdfPublicId } = await generateAndUploadReportPdf({
    caseId,
    projectName,
    reportMd,
    reportJson,
    reportType: pdfReportType,
    versionNo,
    startedAtMs,
  });

  const metadataJson: Record<string, unknown> = {
    ...reportJson,
    pdfUrl,
    pdfPublicId,
    submission_type: submissionType,
    checkpoint: checkpointCode,
    scope: plan.scope,
    prompt_version: plan.prompts[plan.prompts.length - 1],
    prompt_mode: (aiJobInput?.prompt_mode as string | undefined) ?? "full",
    triggerStartedAt,
    model: (aiJobInput?.model as string | undefined) ?? process.env.OMP_MODEL ?? "mimo/mimo-v2.5-pro",
  };
  delete metadataJson.reportMarkdown;

  // Save report into Postgres. Dedupe by trigger identity (lifecycle_unit_id +
  // triggerStartedAt) for ALL submission types: BullMQ may fire `completed`
  // twice for the same job, so resubmit/logic_check must also be idempotent.
  // A unit may hold several initial reports: with AUDIT_STAGE_INPUT_RULES the student re-grades from the stage page.
  // The check and the insert run in one transaction, with the case row locked
  // (SELECT FOR UPDATE) so concurrent finalizers for the same case serialize
  // instead of double-inserting. Code-level guard only — no unique constraint,
  // no migration.
  const savedReport = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "cases" WHERE id = ${caseId} FOR UPDATE`;
    if (!service.lifecycleUnit && triggerStartedAt) {
      // Non-CP1 reports have no lifecycle unit; trigger identity alone dedupes a duplicate `completed` event.
      const existingByTrigger = await tx.report.findFirst({
        where: { case_id: caseId, report_type: plan.reportType, metadata_json: { path: ["triggerStartedAt"], equals: triggerStartedAt } },
      });
      if (existingByTrigger) return existingByTrigger;
    }
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
    }
    // Fresh creation only: the event commits with the report, so a retry (which takes the dedupe
    // returns above) can neither lose it nor write it twice, and a failed insert rolls the report back.
    const created = await saveOmpAuditReport(
      {
        caseId,
        lifecycleUnitId,
        contentMd: reportMd,
        metadataJson,
        checkpointCode,
        reportType: plan.reportType,
      },
      tx,
    );
    await recordCaseEvent(tx, {
      caseId,
      eventType: "audit_completed",
      reportId: created.id,
      metadata: { checkpoint: checkpointCode, job_id: aiJobId ?? null, report_id: created.id },
    });
    return created;
  });

  // Sync artifact record so it appears in "Tài liệu" tab
  await syncReportArtifact({
    caseId,
    savedReport,
    projectName,
    submissionType,
    reportType: pdfReportType,
    versionNo,
    pdfUrl,
    pdfPublicId,
  });

  // Update AI Job status via repository
  if (aiJobId) {
    await updateAiJobStatusById(aiJobId, "completed", reportJson);
  } else {
    await updateAiJobStatus(caseId, "completed", reportJson);
  }

  // Transition case to report_ready via repository
  await updateCaseAuditStage(caseId, "report_ready", "report_ready_to_publish");

  logger.info({ caseId }, "OMP audit finalized successfully and report saved to database!");

  // The student may have left the page mid-run: notify once, on the fresh-finalize path only
  // (the early "already finalized" return above is re-entered by status polling and must not re-notify).
  const caseRow = await prisma.case.findUnique({ where: { id: caseId }, select: { case_code: true } });
  emitEvent({
    eventId: crypto.randomUUID(),
    type: DOMAIN_EVENTS.REPORT_PUBLISHED,
    actorId: null,
    occurredAt: new Date(),
    payload: { caseId, caseCode: caseRow?.case_code ?? null, reportId: savedReport.id },
  });
  return true;
}
