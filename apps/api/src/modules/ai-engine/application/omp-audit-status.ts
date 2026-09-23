import { getJobMilestones, getOmpJobStatus } from "../infrastructure/queue/omp-queue.js";
import {
  findCaseForAudit,
  findLatestAiJobByCase,
} from "../infrastructure/persistence/ai-job.repository.js";
import { jobStore } from "../infrastructure/persistence/job-store.repository.js";
import { finalizeOmpAuditResult } from "./omp-audit-finalizer.js";

/**
 * Retrieve verified status and live logs for frontend.
 */
export async function getCaseAiAuditStatus(caseId: string) {
  const caseRecord = await findCaseForAudit(caseId);

  if (!caseRecord) {
    return { isAiPackage: false, status: "unknown" };
  }

  const isAiPackage = caseRecord.package_id === "pkg_ai_audit";
  const latestJob = await findLatestAiJobByCase(caseId);
  const targetJobId = latestJob?.id;

  let milestones = await getJobMilestones(caseId, targetJobId);
  // Fallback to targetJobId directly if checked by jobId alone, or fallback to caseId
  if (!milestones.reportJson && targetJobId) {
    const fallbackByJob = await getJobMilestones(targetJobId);
    if (fallbackByJob.reportJson || fallbackByJob.triadPacket || fallbackByJob.auditReport) {
      milestones = fallbackByJob;
    }
  }

  // Self-heal: If report.json is on disk but case is still under_review, finalize now
  if (milestones.reportJson && caseRecord.user_facing_stage === "under_review") {
    await finalizeOmpAuditResult(caseId, targetJobId).catch(() => {});
  }

  const [queueStatus, targetLogs, caseLogs] = await Promise.all([
    getOmpJobStatus(caseId, targetJobId, milestones),
    targetJobId ? jobStore.getLogs(targetJobId) : Promise.resolve([]),
    jobStore.getLogs(caseId),
  ]);
  const storedJob = (targetJobId ? jobStore.get(targetJobId) : null) || jobStore.get(caseId);
  const logs = targetLogs.length > 0 ? targetLogs : caseLogs;

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

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));

  let finalStatus: "queued" | "running" | "completed" | "failed" | "cancelled" = "running";
  if (
    caseRecord.user_facing_stage === "report_ready" ||
    milestones.reportJson ||
    storedJob?.status === "completed" ||
    latestJob?.status === "completed"
  ) {
    finalStatus = "completed";
  } else if (storedJob?.status === "cancelled" || latestJob?.status === "cancelled") {
    finalStatus = "cancelled";
  } else if (latestJob?.status === "failed" || queueStatus.state === "failed" || storedJob?.status === "failed") {
    finalStatus = "failed";
  } else if (queueStatus.state === "waiting" || storedJob?.status === "queued" || latestJob?.status === "queued") {
    finalStatus = "queued";
  } else {
    finalStatus = "running";
  }

  return {
    isAiPackage,
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
