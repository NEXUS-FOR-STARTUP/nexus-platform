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
  const milestones = getJobMilestones(caseId);

  // Self-heal: If report.json is on disk but case is still under_review, finalize now
  if (milestones.reportJson && caseRecord.user_facing_stage === "under_review") {
    await finalizeOmpAuditResult(caseId).catch(() => {});
  }

  const aiJob = await findLatestAiJobByCase(caseId);
  const queueStatus = await getOmpJobStatus(caseId);
  const storedJob = jobStore.get(caseId);
  const logs = await jobStore.getLogs(caseId);

  const startedAt =
    (aiJob?.input_json as any)?.startedAt ||
    storedJob?.createdAt ||
    aiJob?.created_at?.toISOString() ||
    caseRecord.updated_at?.toISOString() ||
    new Date().toISOString();

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));

  let finalStatus: "queued" | "running" | "completed" | "failed" | "cancelled" = "running";
  if (caseRecord.user_facing_stage === "report_ready" || milestones.reportJson || storedJob?.status === "completed") {
    finalStatus = "completed";
  } else if (storedJob?.status === "cancelled" || aiJob?.status === "cancelled") {
    finalStatus = "cancelled";
  } else if (aiJob?.status === "failed" || queueStatus.state === "failed" || storedJob?.status === "failed") {
    finalStatus = "failed";
  } else if (queueStatus.state === "waiting" || storedJob?.status === "queued") {
    finalStatus = "queued";
  } else {
    finalStatus = "running";
  }

  return {
    isAiPackage,
    jobId: aiJob?.id || caseId,
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
