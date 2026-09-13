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
});

let queueEventsInitialized = false;

/**
 * Refund 1 credit when a trigger dies from a SYSTEM error (dispatch failure,
 * worker crash, finalize failure) without producing a report. Idempotent per
 * trigger via `audit-refund-<caseId>-<startedAt>`; skips when a report was
 * already saved for the trigger or a refund was already recorded.
 * Never called for user cancels or duplicate-report (user-error) paths.
 */
export async function refundAuditCreditIfNoReport(caseId: string, reason: string): Promise<boolean> {
  try {
    const job = await findLatestAiJobByCase(caseId);
    const startedAt =
      (job?.input_json as { startedAt?: string } | null)?.startedAt ?? null;
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
      await updateAiJobStatus(caseId, "failed", { error: String(err) }).catch(() => {});
      if (err instanceof AppError && err.status === 409) {
        logger.info({ caseId }, "Duplicate report guard hit; user error, no refund");
      } else {
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
  opts?: { submission_type?: string; lifecycle_unit_id?: string },
): Promise<void> {
  // 1. Zod-validate opts
  const parsed = TriggerOptsSchema.safeParse(opts ?? {});
  if (!parsed.success) {
    throw new AppError(400, "INVALID_INPUT", "Tham số không hợp lệ", parsed.error.flatten());
  }
  const { submission_type: submissionType, lifecycle_unit_id: lifecycleUnitId } = parsed.data;

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

  // 4. Guard: already queued/processing → 409 AUDIT_IN_PROGRESS
  const latestJob = await findLatestAiJobByCase(caseId);
  if (latestJob && (latestJob.status === "queued" || latestJob.status === "processing")) {
    throw new AppError(409, "AUDIT_IN_PROGRESS", "Đã có tiến trình thẩm định đang chạy. Vui lòng đợi hoàn thành.");
  }

  // 5-6. Balance check + deduct 1 credit + register job atomically. The
  // balance is read INSIDE the transaction so concurrent triggers cannot
  // both pass the check on a single remaining credit (TOCTOU).
  const startedAt = new Date().toISOString();
  const idempotencyKey = `audit-trigger-${caseId}-${startedAt}`;

  try {
    await prisma.$transaction(async (tx) => {
      const inTxBalance = await getCreditBalanceForTx(tx, caseId);
      if (inTxBalance < 1) {
        throw new AppError(402, "NO_CREDITS", "Hết credit. Vui lòng mua thêm credit để tiếp tục.");
      }
      const entry = await createCreditEntry(tx, {
        caseId,
        amount: -1,
        balanceAfter: inTxBalance - 1,
        type: "consumption",
        referenceId: caseId,
        idempotencyKey,
      });

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
          },
        },
        update: {
          status: "queued",
          input_json: {
            submission_type: submissionType,
            lifecycle_unit_id: lifecycleUnitId ?? null,
            startedAt,
          },
          updated_at: new Date(startedAt),
        },
      });
    });
  } catch (txErr) {
    // Expected 402 is routine, not an infra failure — don't error-log it.
    if (!(txErr instanceof AppError && txErr.status === 402)) {
      logger.error({ caseId, txErr }, "Failed to deduct credit or register AI job");
    }
    throw txErr;
  }

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

  // 10. Prepare sandbox
  prepareSandbox(jobDir, inputFiles);

  if (existsSync(sandboxStorage)) {
    try {
      prepareSandbox(resolve(sandboxStorage, "jobs", caseId), inputFiles);
    } catch (err) {
      logger.warn({ caseId, err }, "Failed to mirror sandbox to test-agent-sanbox-web/storage");
    }
  }

  const projectName = caseRecord.team_name || caseRecord.case_code || "Dự án khởi nghiệp";
  const primaryFileName = inputFiles.find((f) => f.name.endsWith(".md") || f.name.endsWith(".pdf"))?.name || "document.md";

  // 11. Dispatch job into BullMQ (with submissionType in payload)
  try {
    await dispatchOmpJob({
      jobId: caseId,
      documentPath: resolve(jobDir, "input", primaryFileName),
      documentOriginalName: primaryFileName,
      title: projectName,
      ompModel: process.env.OMP_MODEL || "cheapkeyai/gemini-3.8-flash",
      promptMode: "full",
      submissionType,
    });
  } catch (dispatchErr) {
    // Compensate: refund credit on dispatch failure (idempotent per trigger)
    logger.error({ caseId, dispatchErr }, "Dispatch failed, refunding credit");
    await refundAuditCreditIfNoReport(caseId, "dispatch-failure");
    await updateAiJobStatus(caseId, "failed", { error: String(dispatchErr) });
    throw dispatchErr;
  }

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
        message: `Khởi tạo job thẩm định [${submissionType}] ${caseId} cho case ${caseRecord.case_code}: ${projectName}`,
      },
    ],
  });

  logger.info({ caseId, projectName, submissionType, resolvedLifecycleUnitId }, "OMP audit job dispatched to BullMQ queue");
}

/**
 * Cancel running/queued OMP audit job.
 */
export async function cancelOmpAuditForCase(caseId: string) {
  const queueResult = await cancelOmpJob(caseId);
  const cancelledJob = jobStore.cancel(caseId);
  await updateAiJobStatus(caseId, "cancelled", { cancelledAt: new Date().toISOString() });
  logger.warn({ caseId, queueResult }, "OMP audit cancelled by user");
  return { success: true, message: "Đã hủy tiến trình thẩm định OMP", job: cancelledJob };
}
