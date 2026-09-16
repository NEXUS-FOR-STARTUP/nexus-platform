import { existsSync, rmSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import logger from "../../../shared/infrastructure/logger.js";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { findFirstIntakeUnit } from "../../cases/infrastructure/persistence/case.repository.js";
import { findDocumentRecordsByCaseId } from "../../documents/infrastructure/persistence/document.repository.js";
import {
  getCreditBalanceForTx,
  createCreditEntry,
} from "../../cases/infrastructure/persistence/credit-ledger.repository.js";
import {
  dispatchOmpJob,
  cancelOmpJob,
  ompQueueEvents,
} from "../infrastructure/queue/omp-queue.js";
import {
  findCaseForAudit,
  updateCaseAuditStage,
  upsertAiJobQueued,
  updateAiJobStatus,
  findLatestAiJobByCase,
} from "../infrastructure/persistence/ai-job.repository.js";
import { jobStore } from "../infrastructure/persistence/job-store.repository.js";
import { prepareSandbox, resolveRepoRoot, type OmpAuditInputFile } from "../omp-audit.service.js";
import { finalizeOmpAuditResult } from "./omp-audit-finalizer.js";
import { getCaseAiAuditStatus } from "./omp-audit-status.js";
import { findApprovedReports } from "../../reports/infrastructure/persistence/report.repository.js";

export { finalizeOmpAuditResult, getCaseAiAuditStatus };

const SubmissionTypeSchema = z.enum(["initial", "resubmit", "logic_check"]);
type SubmissionType = z.infer<typeof SubmissionTypeSchema>;

const TriggerOptsSchema = z.object({
  submission_type: SubmissionTypeSchema.default("initial"),
  lifecycle_unit_id: z.string().uuid().optional(),
  model: z.string().optional(),
  prompt_mode: z.enum(["full", "lite"]).optional(),
  skip_credit_check: z.boolean().optional(),
  admin_triggered: z.boolean().optional(),
  force_supersede: z.boolean().optional(),
});

export type TriggerAuditOpts = z.infer<typeof TriggerOptsSchema>;

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
    await prisma.$transaction(async (tx) => {
      const currentBalance = await getCreditBalanceForTx(tx, caseId);
      await createCreditEntry(tx, {
        caseId,
        amount: 1,
        balanceAfter: currentBalance + 1,
        type: "refund",
        referenceId: caseId,
        idempotencyKey: refundKey,
        metadataJson: { reason },
      });
    });
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
 * Initialize QueueEvents listener to handle background job completions.
 */
export function initOmpQueueListener(): void {
  if (queueEventsInitialized) return;
  queueEventsInitialized = true;

  ompQueueEvents.on("completed", async ({ jobId }) => {
    const caseId = jobId.startsWith("omp-") ? jobId.replace("omp-", "") : jobId;
    logger.info({ caseId }, "BullMQ OMP job completed event received. Finalizing report...");
    try {
      const ok = await finalizeOmpAuditResult(caseId);
      if (!ok) {
        logger.error({ caseId }, "Finalize found no worker output; marking failed and refunding credit");
        await updateAiJobStatus(caseId, "failed", { error: "worker produced no output" });
        await refundAuditCreditIfNoReport(caseId, "finalize-no-output");
      }
    } catch (err) {
      logger.error({ caseId, err }, "Failed to finalize OMP audit result on completed event");
      if (err instanceof AppError && err.status === 409) {
        logger.info({ caseId }, "Duplicate report guard hit; report already finalized, skipping error status");
      } else {
        await updateAiJobStatus(caseId, "failed", { error: String(err) }).catch(() => {});
        await refundAuditCreditIfNoReport(caseId, "finalize-error");
      }
    }
  });

  ompQueueEvents.on("failed", async ({ jobId, failedReason }) => {
    const caseId = jobId.startsWith("omp-") ? jobId.replace("omp-", "") : jobId;
    logger.error({ caseId, failedReason }, "BullMQ OMP job failed event received");
    try {
      await updateAiJobStatus(caseId, "failed", { error: failedReason });
    } catch (err) {
      logger.warn({ caseId, err }, "Failed to update ai_jobs status to failed");
    }
    await refundAuditCreditIfNoReport(caseId, "worker-failed");
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
 * Assemble input files scoped by submission type.
 *
 * - initial:    intake unit docs + intake_submission.md
 * - resubmit:   target unit docs + previous_report + change_summary (NO intake baseline, NO full history)
 * - logic_check: latest unit docs (+ previous_report if available)
 */
async function assembleScopedInputFiles(
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
      const result = (teamFit.result_snapshot as Record<string, unknown>) || {};

      const teamFitMd = `# Báo cáo phân tích Team Fit ban đầu (Team Fit Report)

## 1. Thông tin ý tưởng (Idea Snapshot)
- **Tên dự án:** ${String(idea["projectName"] || "Chưa cập nhật")}
- **Lĩnh vực:** ${String(idea["field"] || "Chưa cập nhật")}
- **Vấn đề:** ${String(idea["problem"] || "Chưa cập nhật")}
- **Giải pháp:** ${String(idea["solution"] || "Chưa cập nhật")}
- **Khách hàng mục tiêu:** ${String(idea["targetCustomer"] || "Chưa cập nhật")}
- **MVP / Thử nghiệm:** ${String(idea["mvp"] || "Chưa cập nhật")}

## 2. Kết quả đánh giá sơ bộ (Team Fit Analysis Result)
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`

## 3. Khảo sát Đội ngũ (Team Snapshot)
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
    lifecycle_unit_id: lifecycleUnitId,
    model,
    prompt_mode: promptMode = "full",
    skip_credit_check: skipCreditCheck = false,
    admin_triggered: adminTriggered = false,
    force_supersede: forceSupersede = false,
  } = parsed.data;
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
  // Routine early-exit only; the in-transaction guard below is the source of
  // truth for concurrent triggers that both pass this check.
  const latestJob = await findLatestAiJobByCase(caseId);
  if (latestJob && (latestJob.status === "queued" || latestJob.status === "processing")) {
    if (!forceSupersede && !adminTriggered) {
      throw new AppError(409, "AUDIT_IN_PROGRESS", "Đã có tiến trình thẩm định đang chạy. Vui lòng đợi hoàn thành.");
    }
  }

  // 4b. Initial report already exists for intake unit → reject upfront.
  // Report has no submission_type column; saveOmpAuditReport always writes
  // report_type 'input_clarification', so query by that invariant.
  // If the first initial FAILED (no report saved), the guard finds nothing
  // and the trigger proceeds — P2002 skipCharge below handles free retry.
  if (submissionType === "initial") {
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

  // 5-6. Balance check + deduct 1 credit + register job atomically. The
  // balance is read INSIDE the transaction so concurrent triggers cannot
  // both pass the check on a single remaining credit (TOCTOU).
  // Key policy: Every audit trigger (initial submission, user retry, or resubmit)
  // mints a fresh timestamp and idempotency key. Failed/cancelled jobs have already
  // been refunded to the case ledger via refundAuditCreditIfNoReport, so retries
  // cleanly consume 1 credit from the restored balance without P2002 collision.
  const startedAt = new Date().toISOString();
  const idempotencyKey = `audit-trigger-${caseId}-${startedAt}`;

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
          throw new AppError(409, "AUDIT_IN_PROGRESS", "Đã có tiến trình thẩm định đang chạy. Vui lòng đợi hoàn thành.");
        }
      }

      if (!skipCreditCheck) {
        const inTxBalance = await getCreditBalanceForTx(tx, caseId);
        if (inTxBalance < 1) {
          throw new AppError(402, "NO_CREDITS", "Hết credit. Vui lòng mua thêm credit để tiếp tục.");
        }

        await createCreditEntry(tx, {
          caseId,
          amount: -1,
          balanceAfter: inTxBalance - 1,
          type: "consumption",
          referenceId: caseId,
          idempotencyKey,
        });
      }

      // Register in ai_jobs table
      await tx.aiJob.upsert({
        where: { id: `ai-job-${caseId}` },
        create: {
          id: `ai-job-${caseId}`,
          case_id: caseId,
          job_type: "omp_audit",
          status: "queued",
          input_json: {
            submission_type: submissionType,
            lifecycle_unit_id: lifecycleUnitId ?? null,
            startedAt,
            model,
            prompt_mode: promptMode,
            skip_credit_check: skipCreditCheck,
            admin_triggered: adminTriggered,
          },
        },
        update: {
          status: "queued",
          input_json: {
            submission_type: submissionType,
            lifecycle_unit_id: lifecycleUnitId ?? null,
            startedAt,
            model,
            prompt_mode: promptMode,
            skip_credit_check: skipCreditCheck,
            admin_triggered: adminTriggered,
          },
          updated_at: new Date(startedAt),
        },
      });
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
    const jobDir = resolve(projectRoot, "storage", "jobs", caseId);
    cleanDirectory(resolve(jobDir, "input"));
    cleanDirectory(resolve(jobDir, "output"));

    // Optional local-dev mirror (e.g. a second checkout's storage). Unset = skip.
    const sandboxStorage = process.env.OMP_SANDBOX_MIRROR_ROOT || "";
    if (existsSync(sandboxStorage)) {
      cleanDirectory(resolve(sandboxStorage, "jobs", caseId, "input"));
      cleanDirectory(resolve(sandboxStorage, "jobs", caseId, "output"));
    }

    // 9. Assemble scoped input files per submission type
    const { inputFiles, resolvedLifecycleUnitId } = await assembleScopedInputFiles(
      caseId,
      submissionType,
      lifecycleUnitId ?? null,
    );

    // 9b. Persist resolved unit into aiJob.input_json so the guard (phase-01)
    // and finalizer read the true identity, not the pre-resolve request value.
    // Best-effort: on failure the finalizer falls back to latest version unit.
    if (resolvedLifecycleUnitId && resolvedLifecycleUnitId !== (lifecycleUnitId ?? null)) {
      try {
        await prisma.aiJob.update({
          where: { id: `ai-job-${caseId}` },
          data: {
            input_json: {
              submission_type: submissionType,
              lifecycle_unit_id: resolvedLifecycleUnitId,
              startedAt,
              model,
              prompt_mode: promptMode,
              skip_credit_check: skipCreditCheck,
              admin_triggered: adminTriggered,
            },
          },
        });
      } catch (persistErr) {
        logger.warn({ caseId, persistErr }, "Failed to persist resolved lifecycle_unit_id into aiJob.input_json");
      }
    }

    // 10. Prepare sandbox
    prepareSandbox(jobDir, inputFiles);

    if (existsSync(sandboxStorage)) {
      try {
        prepareSandbox(resolve(sandboxStorage, "jobs", caseId), inputFiles);
      } catch (err) {
        logger.warn({ caseId, err }, "Failed to mirror sandbox to OMP_SANDBOX_MIRROR_ROOT");
      }
    }

    const projectName = caseRecord.team_name || caseRecord.case_code || "Dự án khởi nghiệp";
    const primaryFileName = inputFiles.find((f) => f.name.endsWith(".md") || f.name.endsWith(".pdf"))?.name || "document.md";

    // 11. Dispatch job into BullMQ (with submissionType in payload)
    await dispatchOmpJob({
      jobId: caseId,
      documentPath: resolve(jobDir, "input", primaryFileName),
      documentOriginalName: primaryFileName,
      title: projectName,
      ompModel: model || process.env.OMP_MODEL || "mimo/mimo-v2.5",
      promptMode: promptMode,
      submissionType,
      lifecycleUnitId: resolvedLifecycleUnitId ?? undefined,
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
            ? `[Quản trị viên] Bắt đầu chạy lại thẩm định với mô hình ${model || "mặc định"}`
            : `Khởi tạo tiến trình thẩm định đề án ${projectName} - Mã case ${caseRecord.case_code}`,
        },
      ],
    });

    logger.info({ caseId, projectName, submissionType, resolvedLifecycleUnitId }, "OMP audit job dispatched to BullMQ queue");
  } catch (flowErr) {
    logger.error({ caseId, flowErr }, "Preparation or dispatch failed, refunding credit");
    await refundAuditCreditIfNoReport(caseId, "dispatch-failure").catch(() => {});
    await updateAiJobStatus(caseId, "failed", { error: String(flowErr) }).catch(() => {});
    throw flowErr;
  }
}

/**
 * Cancel running/queued OMP audit job.
 */
export async function cancelOmpAuditForCase(caseId: string) {
  const queueResult = await cancelOmpJob(caseId);
  const cancelledJob = jobStore.cancel(caseId);
  await updateAiJobStatus(caseId, "cancelled", { cancelledAt: new Date().toISOString() });
  await refundAuditCreditIfNoReport(caseId, "cancelled-by-user").catch(() => {});

  // Rollback case stage sau cancel để tránh deadlock:
  // - under_review → report_ready: nếu case đã có báo cáo trước đó → StatusGuidanceCard hiện form trigger
  // - under_review → intake_ready: nếu chưa có báo cáo nào → user thấy form nộp hồ sơ
  try {
    const reportCount = await prisma.report.count({ where: { case_id: caseId } });
    if (reportCount > 0) {
      await updateCaseAuditStage(caseId, "report_ready", "report_ready_to_publish");
      logger.info({ caseId }, "Cancelled job: rolled back stage to report_ready");
    } else {
      await updateCaseAuditStage(caseId, "intake_ready", "intake_submitted");
      logger.info({ caseId }, "Cancelled job: rolled back stage to intake_ready");
    }
  } catch (stageErr) {
    logger.warn({ caseId, stageErr }, "Failed to rollback case stage after cancel — non-fatal");
  }

  logger.warn({ caseId, queueResult }, "OMP audit cancelled by user");
  return { success: true, message: "Đã hủy tiến trình thẩm định OMP", job: cancelledJob };
}

