import { existsSync, rmSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Prisma, type AiJob } from "@prisma/client";
import { z } from "zod";
import logger from "../../../shared/infrastructure/logger.js";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { findFirstIntakeUnit, ensureCheckpoint } from "../../cases/infrastructure/persistence/case.repository.js";
import { CP1_AUDIT_SERVICE_CODE } from "../../cases/infrastructure/persistence/credit-ledger.repository.js";
import {
  dispatchOmpJob,
  cancelOmpJob,
  ompQueueEvents,
  ompQueue,
  buildOmpQueueJobId,
  parseOmpQueueJobId,
} from "../infrastructure/queue/omp-queue.js";
import {
  findCaseForAudit,
  updateCaseAuditStage,
  upsertAiJobQueued,
  createAiJobQueued,
  updateAiJobStatus,
  updateAiJobStatusById,
  countAiJobsByCase,
  findLatestAiJobByCase,
} from "../infrastructure/persistence/ai-job.repository.js";
import { jobStore } from "../infrastructure/persistence/job-store.repository.js";
import { prepareSandbox, resolveRepoRoot, type SandboxOptions } from "../omp-audit.service.js";
import { finalizeOmpAuditResult } from "./omp-audit-finalizer.js";
import { getCaseAiAuditStatus } from "./omp-audit-status.js";
import { findLatestCp2FullReport } from "../../reports/infrastructure/persistence/report.repository.js";
import { INPUT_ASSEMBLERS, resolveAuditPlan, AUDIT_SERVICE_TYPES } from "./audit-registry.js";
import { CP2_CHECKPOINT_CODE } from "./cp2-audit-input.js";
import { consumeAuditCredit, grantAuditRefund } from "./audit-credit.js";
import { TriggerOptsSchema, type TriggerAuditOpts } from "./trigger-opts.js";

export { finalizeOmpAuditResult, getCaseAiAuditStatus };

const CP2_OPENED_STATUS = "draft";

export { TriggerOptsSchema, type TriggerAuditOpts };

let queueEventsInitialized = false;

/**
 * Refund 1 credit when a trigger dies (system error OR user cancel) without
 * producing a report. Skips when a report was already saved for this trigger
 * (value received) or a refund was already recorded. Idempotent per trigger
 * via `audit-refund-<caseId>-<startedAt>`.
 */
export async function refundAuditCreditIfNoReport(caseId: string, reason: string): Promise<boolean> {
  try {
    const job = await findLatestAiJobByCase(caseId);
    const inputJson = job?.input_json as {
      startedAt?: string;
      admin_triggered?: boolean;
      skip_credit_check?: boolean;
      service_type?: string;
    } | null;

    if (inputJson?.skip_credit_check === true || inputJson?.admin_triggered === true) {
      logger.info({ caseId, reason }, "Skipping refund: this job was triggered by admin with credit check bypassed");
      return false;
    }

    const startedAt = inputJson?.startedAt ?? null;
    if (startedAt) {
      const reportCount = await prisma.report.count({
        where: { case_id: caseId, created_at: { gte: new Date(startedAt) } },
      });
      if (reportCount > 0) {
        logger.info({ caseId, reason }, "Skipping audit refund: report already saved for this trigger");
        return false;
      }
    }
    const refundKey = `audit-refund-${caseId}-${startedAt ?? "unknown"}`;
    // Refund the service type that was charged; jobs queued before CP2 carry none and were CP1.
    const chargedCode = AUDIT_SERVICE_TYPES.includes(inputJson?.service_type ?? "") ? (inputJson?.service_type as string) : CP1_AUDIT_SERVICE_CODE;
    await prisma.$transaction((tx) =>
      grantAuditRefund(tx, { caseId, serviceTypeCode: chargedCode, idempotencyKey: refundKey, reason }),
    );
    logger.warn({ caseId, reason }, "Refunded 1 audit credit after system failure");
    return true;
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      logger.info({ caseId, reason }, "Audit refund already recorded, skipping duplicate");
      return false;
    }
    logger.error({ caseId, reason, err }, "CRITICAL: Failed to refund credit after system failure");
    return false;
  }
}
/**
 * Rollback case audit stage on failure or cancellation:
 * - Has approved report → report_ready / report_ready_to_publish
 * - No report, intake already submitted → submitted / triage_pending (user retries AI from UI)
 * - No report, no intake yet → intake_ready / triage_pending (user submits intake first)
 * internal_status MUST always be a valid VALID_STATES entry; never use event names like "intake_submitted".
 * Prevents case from getting permanently stuck in under_review / supporter_working.
 */
export async function rollbackCaseStageOnFailure(caseId: string, reason: string): Promise<void> {
  try {
    const reportCount = await prisma.report.count({ where: { case_id: caseId } });
    if (reportCount > 0) {
      await updateCaseAuditStage(caseId, "report_ready", "report_ready_to_publish");
      logger.info({ caseId, reason }, "Rolled back case stage to report_ready");
    } else {
      const intakeUnit = await findFirstIntakeUnit(caseId);
      if (intakeUnit) {
        await updateCaseAuditStage(caseId, "submitted", "triage_pending");
        logger.info({ caseId, reason }, "Rolled back case stage to submitted (intake exists)");
      } else {
        await updateCaseAuditStage(caseId, "intake_ready", "triage_pending");
        logger.info({ caseId, reason }, "Rolled back case stage to intake_ready (no intake yet)");
      }
    }
  } catch (stageErr: unknown) {
    const err = stageErr as Error;
    logger.warn({ caseId, err: err?.message, reason }, "Failed to rollback case stage on failure — non-fatal");
  }
}

/**
 * Initialize QueueEvents listener to handle background job completions.
 */
export function initOmpQueueListener(): void {
  if (queueEventsInitialized) return;
  queueEventsInitialized = true;

  ompQueueEvents.on("active", async ({ jobId }) => {
    const { caseId, aiJobId } = parseOmpQueueJobId(jobId);
    logger.info(
      { caseId, aiJobId, jobId },
      "BullMQ OMP job active event received. Updating ai_jobs status to processing..."
    );
    try {
      if (aiJobId) {
        await updateAiJobStatusById(aiJobId, "processing");
      } else {
        await updateAiJobStatus(caseId, "processing");
      }
    } catch (err: unknown) {
      logger.warn({ caseId, aiJobId, err }, "Failed to update ai_jobs status to processing on active event");
    }
  });

  ompQueueEvents.on("completed", async ({ jobId }) => {
    const { caseId, aiJobId } = parseOmpQueueJobId(jobId);
    logger.info({ caseId, aiJobId, jobId }, "BullMQ OMP job completed event received. Finalizing report...");
    try {
      const ok = await finalizeOmpAuditResult(caseId, aiJobId);
      if (!ok) {
        logger.error({ caseId, aiJobId }, "Finalize found no worker output; marking failed and refunding credit");
        if (aiJobId) {
          await updateAiJobStatusById(aiJobId, "failed", { error: "worker produced no output" });
        } else {
          await updateAiJobStatus(caseId, "failed", { error: "worker produced no output" });
        }
        await refundAuditCreditIfNoReport(caseId, "finalize-no-output");
        await rollbackCaseStageOnFailure(caseId, "finalize-no-output");
      }
    } catch (err: unknown) {
      logger.error({ caseId, aiJobId, err }, "Failed to finalize OMP audit result on completed event");
      if (err instanceof AppError && err.status === 409) {
        logger.info({ caseId, aiJobId }, "Duplicate report guard hit; report already finalized, skipping error status");
      } else {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (aiJobId) {
          await updateAiJobStatusById(aiJobId, "failed", { error: errorMsg }).catch(() => {});
        } else {
          await updateAiJobStatus(caseId, "failed", { error: errorMsg }).catch(() => {});
        }
        await refundAuditCreditIfNoReport(caseId, "finalize-error");
        await rollbackCaseStageOnFailure(caseId, "finalize-error");
      }
    }
  });

  ompQueueEvents.on("failed", async ({ jobId, failedReason }) => {
    const { caseId, aiJobId } = parseOmpQueueJobId(jobId);
    logger.error({ caseId, aiJobId, failedReason, jobId }, "BullMQ OMP job failed event received");
    try {
      if (aiJobId) {
        await updateAiJobStatusById(aiJobId, "failed", { error: failedReason });
      } else {
        await updateAiJobStatus(caseId, "failed", { error: failedReason });
      }
    } catch (err: unknown) {
      logger.warn({ caseId, aiJobId, err }, "Failed to update ai_jobs status to failed");
    }
    await refundAuditCreditIfNoReport(caseId, "worker-failed");
    await rollbackCaseStageOnFailure(caseId, "worker-failed");
  });

  logger.info("BullMQ OMP QueueEvents listener initialized");
}

/**
 * Helper: delete all files inside a directory (non-recursive, best-effort).
 */
function cleanDirectory(dirPath: string): void {
  try {
    if (!existsSync(dirPath)) return;
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = resolve(dirPath, entry.name);
      rmSync(fullPath, { recursive: true, force: true });
    }
  } catch (err) {
    logger.warn({ dirPath, err }, "Failed to clean directory");
  }
}


/**
 * Prepare sandbox files and trigger OMP Audit via BullMQ Queue.
 *
 * Validates submission_type, lifecycle_unit_id, credit balance, and guards against double-trigger.
 * Deducts 1 credit per trigger; system failures (dispatch, worker crash,
 * finalize) auto-refund 1 credit when no report was produced. User cancels
 * and duplicate-report (user-error) paths never refund.
 */
export async function triggerOmpAuditForCase(
  caseId: string,
  opts?: z.input<typeof TriggerOptsSchema>,
): Promise<void> {
  // 1. Zod-validate opts
  const parsed = TriggerOptsSchema.safeParse(opts ?? {});
  if (!parsed.success) {
    throw new AppError(400, "INVALID_INPUT", "Tham số không hợp lệ", parsed.error.flatten());
  }
  const {
    submission_type: submissionType,
    checkpoint: checkpointCode,
    scope,
    change_summary: changeSummary,
    lifecycle_unit_id: lifecycleUnitId,
    model,
    prompt_mode: promptMode = "full",
    skip_credit_check: skipCreditCheck = false,
    admin_triggered: adminTriggered = false,
    force_supersede: forceSupersede = false,
  } = parsed.data;
  const resolvedModel = model?.trim() || process.env.OMP_MODEL || "opencode-go/deepseek-v4-pro";
  const plan = resolveAuditPlan(checkpointCode, checkpointCode === "CP1" ? promptMode : (scope as string), submissionType);
  // 2. Validate lifecycle_unit belongs to case (if provided)
  if (lifecycleUnitId) {
    const unit = await prisma.lifecycleUnit.findUnique({ where: { id: lifecycleUnitId } });
    if (!unit || unit.case_id !== caseId) {
      throw new AppError(400, "INVALID_LIFECYCLE_UNIT", "Đơn vị vòng đời không thuộc hồ sơ này.");
    }
  }

  // 3. Check case exists
  const caseRecord = await findCaseForAudit(caseId);
  if (!caseRecord) {
    throw new AppError(404, "CASE_NOT_FOUND", `Case ${caseId} not found`);
  }

  // 4. Fast-path guard: already queued/processing → 409 AUDIT_IN_PROGRESS.
  // Verify with BullMQ directly so dropped events or stale jobs don't block forever.
  const latestJob = await findLatestAiJobByCase(caseId);
  if (latestJob && (latestJob.status === "queued" || latestJob.status === "processing")) {
    if (!forceSupersede && !adminTriggered) {
      const TEN_MINUTES_MS = 10 * 60 * 1000;
      const timeSinceUpdate = Date.now() - latestJob.updated_at.getTime();
      let isStale = false;

      try {
        const queueJobId = buildOmpQueueJobId(caseId, latestJob.id);
        let bullJob = await ompQueue.getJob(queueJobId);
        if (!bullJob) {
          bullJob = await ompQueue.getJob(`omp-${caseId}`);
        }
        if (!bullJob) {
          // Not in BullMQ queue at all
          isStale = true;
        } else {
          const state = await bullJob.getState();
          if (state === "completed" || state === "failed") {
            isStale = true;
          } else if (timeSinceUpdate > TEN_MINUTES_MS) {
            isStale = true;
          }
        }
      } catch (queueErr: unknown) {
        const qErr = queueErr as Error;
        logger.warn({ caseId, err: qErr?.message }, "Failed to verify BullMQ job state; checking timestamp");
        if (timeSinceUpdate > TEN_MINUTES_MS) {
          isStale = true;
        }
      }

      if (isStale) {
        logger.warn({ caseId, previousStatus: latestJob.status, timeSinceUpdate }, "Detected stale ai_job in fast-path guard; auto-healing status to failed");
        try {
          await updateAiJobStatusById(latestJob.id, "failed", {
            error: "Stale job auto-recovered: task was no longer active in worker queue",
            autoRecoveredAt: new Date().toISOString(),
          }).catch(() => {});
          await updateAiJobStatus(caseId, "failed", {
            error: "Stale job auto-recovered: task was no longer active in worker queue",
            autoRecoveredAt: new Date().toISOString(),
          });
          await refundAuditCreditIfNoReport(caseId, "stale-job-cleanup");
          await rollbackCaseStageOnFailure(caseId, "stale-job-cleanup");
        } catch (healErr: unknown) {
          const hErr = healErr as Error;
          logger.warn({ caseId, err: hErr?.message }, "Failed to persist auto-healed stale ai_job status");
        }
      } else {
        throw new AppError(409, "AUDIT_IN_PROGRESS", "Đã có tiến trình thẩm định đang chạy. Vui lòng đợi hoàn thành.");
      }
    }
  }

  // 4b. Initial report already exists for intake unit → reject upfront.
  // Report has no submission_type column; saveOmpAuditReport always writes
  // report_type 'input_clarification', so query by that invariant.
  // If the first initial FAILED (no report saved), the guard finds nothing
  // and the trigger proceeds — P2002 skipCharge below handles free retry.
  if (checkpointCode === "CP1" && submissionType === "initial") {
    const intakeUnit = await findFirstIntakeUnit(caseId);
    if (intakeUnit) {
      const existingInitial = await prisma.report.findFirst({
        where: {
          lifecycle_unit_id: intakeUnit.id,
          report_type: "input_clarification",
          created_at: { lt: new Date() },
        },
        orderBy: { created_at: "asc" },
      });
      if (existingInitial && !forceSupersede && !adminTriggered) {
        throw new AppError(409, "AUDIT_IN_PROGRESS", "Báo cáo Ban đầu đã tồn tại. Vui lòng sử dụng Tạo lại (resubmit) nếu cần gửi tài liệu sửa đổi.");
      }
    }
  }

  // 4c. CP2: the checkpoint row must exist (files and reports hang off it) and a resubmit needs a
  // full report to compare with. Checked before charging so a rejected trigger costs nothing.
  if (checkpointCode === "CP2") {
    await ensureCheckpoint(prisma, caseId, CP2_CHECKPOINT_CODE, CP2_OPENED_STATUS);
    if (submissionType === "resubmit" && !(await findLatestCp2FullReport(caseId))) {
      throw new AppError(409, "CP2_NO_PREVIOUS_REPORT", "Chưa có báo cáo CP2 toàn bộ trước đó để chấm lại.");
    }
  }

  // 5-6. Balance check + deduct 1 credit + register job atomically. The
  // balance is read INSIDE the transaction so concurrent triggers cannot
  // both pass the check on a single remaining credit (TOCTOU).
  // Key policy: Every audit trigger (initial submission, user retry, or resubmit)
  // mints a fresh timestamp and idempotency key. Failed/cancelled jobs have already
  // been refunded to the case ledger via refundAuditCreditIfNoReport, so retries
  // cleanly consume 1 credit from the restored balance without P2002 collision.
  const startedAt = new Date().toISOString();
  const idempotencyKey = `audit-trigger-${caseId}-${startedAt}`;
  // Stored on the job so the finalizer, refunds and retries read one source of truth.
  const jobInput = {
    submission_type: submissionType,
    lifecycle_unit_id: lifecycleUnitId ?? null,
    startedAt,
    model: resolvedModel,
    prompt_mode: promptMode,
    skip_credit_check: skipCreditCheck,
    admin_triggered: adminTriggered,
    checkpoint: checkpointCode,
    scope: plan.scope,
    service_type: plan.serviceType,
  };
  const sandboxOpts: SandboxOptions =
    checkpointCode === "CP1" ? {} : { promptFiles: plan.prompts, includeKnowledge: false };
  let newAiJob!: AiJob;

  try {
    await prisma.$transaction(async (tx) => {
      // Serialize concurrent triggers for the same case; the in-tx guard
      // below is the source of truth, the pre-tx check is fast-path only.
      await tx.$queryRaw`SELECT id FROM "cases" WHERE id = ${caseId} FOR UPDATE`;
      const inTxJob = await tx.aiJob.findFirst({ where: { case_id: caseId, job_type: "omp_audit" }, orderBy: { created_at: "desc" } });
      if (inTxJob && (inTxJob.status === "queued" || inTxJob.status === "processing")) {
        if (forceSupersede || adminTriggered) {
          await tx.aiJob.update({
            where: { id: inTxJob.id },
            data: {
              status: "cancelled",
              output_json: { reason: "Superseded by admin retry", cancelledAt: new Date().toISOString() },
            },
          });
        } else {
          const TEN_MINUTES_MS = 10 * 60 * 1000;
          if (Date.now() - inTxJob.updated_at.getTime() > TEN_MINUTES_MS) {
            logger.warn({ caseId, inTxJobId: inTxJob.id }, "In-tx guard detected stale ai_job (>10m); auto-cancelling to allow fresh trigger");
            await tx.aiJob.update({
              where: { id: inTxJob.id },
              data: {
                status: "failed",
                output_json: { reason: "Stale job timeout auto-cleared in transaction", cancelledAt: new Date().toISOString() },
              },
            });
          } else {
            throw new AppError(409, "AUDIT_IN_PROGRESS", "Đã có tiến trình thẩm định đang chạy. Vui lòng đợi hoàn thành.");
          }
        }
      }

      if (!skipCreditCheck) {
        await consumeAuditCredit(tx, { caseId, serviceTypeCode: plan.serviceType, idempotencyKey });
      }

      // Count existing jobs for this case to set attempt_no = existingCount + 1
      const existingCount = await countAiJobsByCase(caseId, "omp_audit");
      const attemptNo = existingCount + 1;

      // Register in ai_jobs table with auto-generated UUID
      newAiJob = await createAiJobQueued(
        caseId,
        { ...jobInput, attempt_no: attemptNo },
        tx
      );
    });
  } catch (txErr) {
    // Expected 402/409 are routine, not infra failures — don't error-log them.
    if (!(txErr instanceof AppError && (txErr.status === 402 || txErr.status === 409))) {
      logger.error({ caseId, txErr }, "Failed to deduct credit or register AI job");
    }
    throw txErr;
  }

  try {
    // 7. Update case stage to under_review
    await updateCaseAuditStage(caseId, "under_review", "supporter_working");

    // 8. Cleanup old sandbox input/output before writing new files
    const projectRoot = resolveRepoRoot();
    const jobDir = resolve(projectRoot, "storage", "jobs", caseId, newAiJob.id);
    cleanDirectory(resolve(jobDir, "input"));
    cleanDirectory(resolve(jobDir, "output"));
    // Legacy/flat sandbox path (storage/jobs/<jobId>) for worker compatibility without globbing
    const flatJobDir = resolve(projectRoot, "storage", "jobs", newAiJob.id);
    cleanDirectory(resolve(flatJobDir, "input"));
    cleanDirectory(resolve(flatJobDir, "output"));

    // Optional local-dev mirror (e.g. a second checkout's storage). Unset = skip.
    const sandboxStorage = process.env.OMP_SANDBOX_MIRROR_ROOT || "";
    if (existsSync(sandboxStorage)) {
      cleanDirectory(resolve(sandboxStorage, "jobs", caseId, newAiJob.id, "input"));
      cleanDirectory(resolve(sandboxStorage, "jobs", caseId, newAiJob.id, "output"));
      cleanDirectory(resolve(sandboxStorage, "jobs", newAiJob.id, "input"));
      cleanDirectory(resolve(sandboxStorage, "jobs", newAiJob.id, "output"));
    }
    // 9. Assemble input files through the registry (checkpoint decides the assembler)
    const { inputFiles, resolvedLifecycleUnitId } = await INPUT_ASSEMBLERS[plan.input]({
      caseId,
      submissionType,
      lifecycleUnitId: lifecycleUnitId ?? null,
      changeSummary,
    });

    // 9b. Persist resolved unit into aiJob.input_json so the guard (phase-01)
    // and finalizer read the true identity, not the pre-resolve request value.
    // Best-effort: on failure the finalizer falls back to latest version unit.
    if (resolvedLifecycleUnitId && resolvedLifecycleUnitId !== (lifecycleUnitId ?? null)) {
      try {
        await prisma.aiJob.update({
          where: { id: newAiJob.id },
          data: {
            input_json: {
              ...jobInput,
              lifecycle_unit_id: resolvedLifecycleUnitId,
              attempt_no: newAiJob.attempt_count,
            },
          },
        });
      } catch (persistErr) {
        logger.warn({ caseId, jobId: newAiJob.id, persistErr }, "Failed to persist resolved lifecycle_unit_id into aiJob.input_json");
      }
    }

    // 10. Prepare sandbox (nested as primary, flat as compatibility mirror for immutable worker image)
    prepareSandbox(jobDir, inputFiles, sandboxOpts);

    try {
      prepareSandbox(flatJobDir, inputFiles, sandboxOpts);
    } catch (flatErr) {
      logger.warn({ caseId, jobId: newAiJob.id, flatErr }, "Failed to mirror sandbox to flat path for worker compatibility");
    }

    if (existsSync(sandboxStorage)) {
      try {
        prepareSandbox(resolve(sandboxStorage, "jobs", caseId, newAiJob.id), inputFiles, sandboxOpts);
      } catch (err) {
        logger.warn({ caseId, err }, "Failed to mirror sandbox to OMP_SANDBOX_MIRROR_ROOT (nested)");
      }
      try {
        prepareSandbox(resolve(sandboxStorage, "jobs", newAiJob.id), inputFiles, sandboxOpts);
      } catch (err) {
        logger.warn({ caseId, err }, "Failed to mirror sandbox to OMP_SANDBOX_MIRROR_ROOT (flat)");
      }
    }

    const projectName = caseRecord.team_name || caseRecord.case_code || "Dự án khởi nghiệp";
    const primaryFileName = inputFiles.find((f) => f.name.endsWith(".md") || f.name.endsWith(".pdf"))?.name || "document.md";

    // 11. Dispatch job into BullMQ (with submissionType in payload)
    await dispatchOmpJob({
      jobId: newAiJob.id,
      caseId,
      documentPath: resolve(jobDir, "input", primaryFileName),
      documentOriginalName: primaryFileName,
      title: projectName,
      ompModel: resolvedModel,
      promptMode: promptMode,
      submissionType,
      lifecycleUnitId: resolvedLifecycleUnitId ?? undefined,
      checkpoint: checkpointCode,
      scope: plan.scope,
    });

    // 12. Sync into jobStore for real-time SSE logs
    jobStore.set({
      id: caseId,
      title: projectName,
      documentPath: resolve(jobDir, "input", primaryFileName),
      documentOriginalName: primaryFileName,
      requestedAgent: "omp",
      createdAt: startedAt,
      status: "queued",
      ompStatus: "queued",
      results: {},
      logs: [
        {
          timestamp: startedAt,
          agent: "system",
          message: adminTriggered
            ? `[Quản trị viên] Bắt đầu chạy lại thẩm định với mô hình ${resolvedModel}`
            : `Khởi tạo tiến trình thẩm định đề án ${projectName} - Mã case ${caseRecord.case_code} (${resolvedModel})`,
        },
      ],
    });

    jobStore.set({
      id: newAiJob.id,
      title: projectName,
      documentPath: resolve(jobDir, "input", primaryFileName),
      documentOriginalName: primaryFileName,
      requestedAgent: "omp",
      createdAt: startedAt,
      status: "queued",
      ompStatus: "queued",
      results: {},
      logs: [
        {
          timestamp: startedAt,
          agent: "system",
          message: adminTriggered
            ? `[Quản trị viên] Bắt đầu chạy lại thẩm định với mô hình ${resolvedModel}`
            : `Khởi tạo tiến trình thẩm định đề án ${projectName} - Mã case ${caseRecord.case_code} (${resolvedModel})`,
        },
      ],
    });

    logger.info(
      { caseId, aiJobId: newAiJob.id, projectName, submissionType, resolvedLifecycleUnitId },
      "OMP audit job dispatched to BullMQ queue"
    );
  } catch (flowErr) {
    logger.error({ caseId, flowErr }, "Preparation or dispatch failed, refunding credit");
    await refundAuditCreditIfNoReport(caseId, "dispatch-failure").catch(() => {});
    if (newAiJob?.id) {
      await updateAiJobStatusById(newAiJob.id, "failed", { error: String(flowErr) }).catch(() => {});
    }
    await updateAiJobStatus(caseId, "failed", { error: String(flowErr) }).catch(() => {});
    await rollbackCaseStageOnFailure(caseId, "dispatch-failure").catch(() => {});
    throw flowErr;
  }
}

/**
 * Cancel running/queued OMP audit job.
 */
export async function cancelOmpAuditForCase(caseId: string) {
  const latestJob = await findLatestAiJobByCase(caseId);
  const queueResult = await cancelOmpJob(caseId, latestJob?.id);
  const cancelledJob = jobStore.cancel(caseId);
  if (latestJob?.id) {
    jobStore.cancel(latestJob.id);
    await updateAiJobStatusById(latestJob.id, "cancelled", { cancelledAt: new Date().toISOString() }).catch(() => {});
  }
  await updateAiJobStatus(caseId, "cancelled", { cancelledAt: new Date().toISOString() });
  await refundAuditCreditIfNoReport(caseId, "cancelled-by-user").catch(() => {});

  await rollbackCaseStageOnFailure(caseId, "cancelled-by-user");

  logger.warn({ caseId, queueResult }, "OMP audit cancelled by user");
  return { success: true, message: "Đã hủy tiến trình thẩm định OMP", job: cancelledJob };
}

/**
 * Periodic watchdog for stale AI jobs across all cases.
 * Heals jobs stuck in 'queued' or 'processing' for > 15 minutes when BullMQ is inactive.
 */
export async function cleanupStaleAiJobs(): Promise<number> {
  const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
  const staleThreshold = new Date(Date.now() - FIFTEEN_MINUTES_MS);
  try {
    const staleJobs = await prisma.aiJob.findMany({
      where: {
        job_type: "omp_audit",
        status: { in: ["queued", "processing"] },
        updated_at: { lt: staleThreshold },
      },
      select: {
        id: true,
        case_id: true,
        status: true,
        updated_at: true,
      },
      take: 50,
    });

    let healedCount = 0;
    for (const job of staleJobs) {
      const caseId = job.case_id;
      let shouldHeal = false;
      try {
        const queueJobId = buildOmpQueueJobId(caseId, job.id);
        let bullJob = await ompQueue.getJob(queueJobId);
        if (!bullJob) {
          bullJob = await ompQueue.getJob(`omp-${caseId}`);
        }
        if (!bullJob) {
          shouldHeal = true;
        } else {
          const state = await bullJob.getState();
          if (state === "completed" || state === "failed") {
            shouldHeal = true;
          } else if (Date.now() - job.updated_at.getTime() > 20 * 60 * 1000) {
            shouldHeal = true;
          }
        }
      } catch {
        shouldHeal = true;
      }

      if (shouldHeal) {
        logger.warn({ caseId, jobId: job.id, status: job.status }, "Periodic watchdog healing stale ai_job");
        await updateAiJobStatusById(job.id, "failed", {
          error: "Stale job timeout: automatically cleared by background watchdog",
          clearedAt: new Date().toISOString(),
        }).catch(() => {});
        await updateAiJobStatus(caseId, "failed", {
          error: "Stale job timeout: automatically cleared by background watchdog",
          clearedAt: new Date().toISOString(),
        });
        await refundAuditCreditIfNoReport(caseId, "stale-watchdog-cleanup");
        await rollbackCaseStageOnFailure(caseId, "stale-watchdog-cleanup");
        healedCount++;
      }
    }
    return healedCount;
  } catch (err: unknown) {
    const error = err as Error;
    logger.warn({ err: error?.message }, "Failed to run cleanupStaleAiJobs pass");
    return 0;
  }
}

// Start watchdog only in non-test runtime
if (process.env.NODE_ENV !== "test") {
  const WATCHDOG_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  setInterval(() => {
    cleanupStaleAiJobs().catch((err: unknown) => {
      const error = err as Error;
      logger.warn({ err: error?.message }, "Background stale AI job watchdog error");
    });
  }, WATCHDOG_INTERVAL_MS).unref();
}
