import { getJobMilestones, getOmpJobStatus } from "../infrastructure/queue/omp-queue.js";
import { computeProgressSteps } from "@app/shared";
import {
  findCaseForAudit,
  findLatestAiJobForCheckpoint,
  runningCheckpointCode,
} from "../infrastructure/persistence/ai-job.repository.js";
import { jobStore } from "../infrastructure/persistence/job-store.repository.js";
import { finalizeOmpAuditResult } from "./omp-audit-finalizer.js";
import logger from "../../../shared/infrastructure/logger.js";

// In-flight guard: prevent duplicate background finalize jobs with 60s TTL eviction
const finalizingCases = new Map<string, number>();
const FINALIZING_LOCK_TIMEOUT_MS = 60_000;

function isFinalizing(caseId: string): boolean {
  const startedAt = finalizingCases.get(caseId);
  if (!startedAt) return false;
  if (Date.now() - startedAt > FINALIZING_LOCK_TIMEOUT_MS) {
    finalizingCases.delete(caseId);
    return false;
  }
  return true;
}
/**
 * Retrieve verified status and live logs for frontend.
 */
export async function getCaseAiAuditStatus(caseId: string, checkpoint?: string) {
  const caseRecord = await findCaseForAudit(caseId);

  if (!caseRecord) {
    return { status: "unknown", steps: [] };
  }

  const latestJob = await findLatestAiJobForCheckpoint(caseId, checkpoint);
  const targetJobId = latestJob?.id;
  // A checkpoint-scoped request never falls back to the case-wide job/log, which may belong to another checkpoint.
  if (checkpoint && !latestJob) {
    return { status: "unknown", checkpoint, steps: [] };
  }

  let milestones = await getJobMilestones(caseId, targetJobId);
  // Fallback to targetJobId directly if checked by jobId alone, or fallback to caseId
  if (!milestones.reportJson && targetJobId) {
    const fallbackByJob = await getJobMilestones(targetJobId, targetJobId);
    if (fallbackByJob.reportJson || fallbackByJob.triadPacket || fallbackByJob.auditReport) {
      milestones = fallbackByJob;
    }
  }

  const [queueStatus, targetLogs, caseLogs] = await Promise.all([
    getOmpJobStatus(caseId, targetJobId, milestones),
    targetJobId ? jobStore.getLogs(targetJobId) : Promise.resolve([]),
    jobStore.getLogs(caseId),
  ]);
  const storedJob = (targetJobId ? jobStore.get(targetJobId) : null) || (checkpoint ? null : jobStore.get(caseId));

  // Nothing has ever graded this case: no job row, no in-memory job, no queued job and no
  // report on disk. Falling through would report a phantom "running" job with the case id
  // as the job id, so the UI claims grading started by itself right after creation.
  if (
    !latestJob &&
    !storedJob &&
    queueStatus.state === "unknown" &&
    !milestones.reportJson
  ) {
    return {
      ...(checkpoint ? { checkpoint } : {}),
      caseId,
      caseCode: caseRecord.case_code,
      projectName: caseRecord.team_name,
      status: "unknown" as const,
      steps: [],
      logs: [],
      error: null,
    };
  }

  const aiJobInput =
    latestJob?.input_json && typeof latestJob.input_json === "object"
      ? (latestJob.input_json as Record<string, unknown>)
      : null;

  const startedAt =
    (typeof aiJobInput?.startedAt === "string" ? aiJobInput.startedAt : undefined) ||
    storedJob?.createdAt ||
    latestJob?.created_at?.toISOString() ||
    caseRecord.updated_at?.toISOString() ||
    new Date().toISOString();

  const startMs = new Date(startedAt).getTime();
  const filteredCaseLogs = caseLogs.filter((l) => {
    const logMs = new Date(l.timestamp).getTime();
    return isNaN(logMs) || logMs >= startMs - 3000;
  });
  const logs = targetLogs.length > 0 || checkpoint ? targetLogs : filteredCaseLogs;
  // Check if job is actively queued or processing before considering self-heal finalize
  const isActivelyQueuedOrProcessing =
    latestJob?.status === "queued" ||
    latestJob?.status === "processing" ||
    queueStatus.state === "waiting" ||
    queueStatus.state === "active";

  // Self-heal: If report.json is on disk for this job but case is still under_review, trigger background finalize
  // without blocking the GET response or hammering Cloudinary on repeated polls.
  if (
    milestones.reportJson &&
    caseRecord.user_facing_stage === "under_review" &&
    !isActivelyQueuedOrProcessing
  ) {
    if (!isFinalizing(caseId)) {
      finalizingCases.set(caseId, Date.now());
      finalizeOmpAuditResult(caseId, targetJobId)
        .catch((err) => {
          logger.warn({ caseId, targetJobId, err }, "Background self-heal finalize failed");
        })
        .finally(() => {
          finalizingCases.delete(caseId);
        });
    }
  }
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));

  let finalStatus: "queued" | "running" | "completed" | "failed" | "cancelled" = "running";
  if (latestJob?.status === "cancelled" || storedJob?.status === "cancelled") {
    finalStatus = "cancelled";
  } else if (latestJob?.status === "failed" || storedJob?.status === "failed" || queueStatus.state === "failed") {
    finalStatus = "failed";
  } else if (
    latestJob?.status === "queued" &&
    queueStatus.state !== "active" &&
    storedJob?.status !== "running"
  ) {
    finalStatus = "queued";
  } else if (
    latestJob?.status === "processing" ||
    queueStatus.state === "active" ||
    storedJob?.status === "running"
  ) {
    finalStatus = "running";
  } else if (
    latestJob?.status === "completed" ||
    (caseRecord.user_facing_stage === "report_ready" && !isActivelyQueuedOrProcessing) ||
    (milestones.reportJson && !isActivelyQueuedOrProcessing) ||
    (storedJob?.status === "completed" && !isActivelyQueuedOrProcessing)
  ) {
    finalStatus = "completed";
  } else if (queueStatus.state === "waiting" || storedJob?.status === "queued") {
    finalStatus = "queued";
  } else {
    finalStatus = "running";
  }

  // Checkpoint-scoped: the DB row is authoritative for terminal states. The queue/files say "completed"
  // before the finalizer has saved the report (and the finalize can still fail + refund), so an unsaved
  // run stays "running" (finalizing) instead of flashing completed then flipping to failed.
  if (checkpoint && latestJob) {
    if (["completed", "failed", "cancelled"].includes(latestJob.status)) {
      finalStatus = latestJob.status as typeof finalStatus;
    } else if (finalStatus === "completed") {
      finalStatus = "running";
    }
  }

  const jobCheckpoint = runningCheckpointCode(aiJobInput);
  return {
    checkpoint: jobCheckpoint,
    scope: typeof aiJobInput?.scope === "string" ? aiJobInput.scope : undefined,
    inputSource: typeof aiJobInput?.input_source === "string" ? aiJobInput.input_source : undefined,
    userNote: typeof aiJobInput?.user_note === "string" ? aiJobInput.user_note : undefined,
    changeSummary: typeof aiJobInput?.change_summary === "string" ? aiJobInput.change_summary : undefined,
    steps: computeProgressSteps(jobCheckpoint, milestones.presentFiles ?? [], {
      finished: finalStatus === "completed",
      running: finalStatus === "running",
    }),
    jobId: targetJobId || caseId,
    caseId,
    caseCode: caseRecord.case_code,
    projectName: caseRecord.team_name,
    status: finalStatus,
    startedAt,
    elapsedSeconds,
    logs: logs.length > 0 ? logs : storedJob?.logs || [],
    error: queueStatus.failedReason || null,
  };
}
