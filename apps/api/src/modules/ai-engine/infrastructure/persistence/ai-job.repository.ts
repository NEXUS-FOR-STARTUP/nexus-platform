import { prisma } from "../../../../db.js";
import type { Prisma } from "@prisma/client";

export interface UpsertAiJobData {
  projectName: string;
  inputFilesCount: number;
  startedAt: string;
  [key: string]: unknown;
}

/**
 * Upsert AI Job record in queued status.
 */
export async function upsertAiJobQueued(caseId: string, data: UpsertAiJobData) {
  const startedAtDate = new Date(data.startedAt);
  const jsonPayload = data as unknown as Prisma.InputJsonValue;
  return await prisma.aiJob.upsert({
    where: { id: `ai-job-${caseId}` },
    create: {
      id: `ai-job-${caseId}`,
      case_id: caseId,
      job_type: "omp_audit",
      status: "queued",
      input_json: jsonPayload,
    },
    update: {
      status: "queued",
      input_json: jsonPayload,
      updated_at: startedAtDate,
    },
  });
}

/**
 * Update AI Job status and output JSON for a case.
 */
export async function updateAiJobStatus(
  caseId: string,
  status: string,
  outputJson?: unknown,
  jobType = "omp_audit"
) {
  return await prisma.aiJob.updateMany({
    where: { case_id: caseId, job_type: jobType },
    data: {
      status,
      output_json: outputJson as any,
    },
  });
}

/**
 * Find the latest AI Job record for a case.
 */
export async function findLatestAiJobByCase(caseId: string, jobType = "omp_audit") {
  return await prisma.aiJob.findFirst({
    where: { case_id: caseId, job_type: jobType },
    orderBy: { created_at: "desc" },
  });
}

/**
 * Fetch minimal case record needed for audit flow.
 */
export async function findCaseForAudit(caseId: string) {
  return await prisma.case.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      case_code: true,
      team_name: true,
      package_id: true,
      user_facing_stage: true,
      updated_at: true,
    },
  });
}

/**
 * Update case stage and internal status during audit transitions.
 */
export async function updateCaseAuditStage(
  caseId: string,
  userFacingStage: string,
  internalStatus: string
) {
  return await prisma.case.update({
    where: { id: caseId },
    data: {
      user_facing_stage: userFacingStage,
      internal_status: internalStatus,
    },
  });
}

/**
 * Fetch case record for PDF compilation metadata.
 */
export async function findCaseDetailForPdf(caseId: string) {
  return await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, case_code: true, team_name: true },
  });
}
