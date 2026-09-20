import { prisma } from "../../../../db.js";
import { Prisma } from "@prisma/client";

export interface UpsertAiJobData {
  projectName: string;
  inputFilesCount: number;
  startedAt: string;
  [key: string]: unknown;
}

export interface CreateAiJobData {
  projectName?: string;
  inputFilesCount?: number;
  startedAt?: string;
  attempt_no?: number;
  submission_type?: string;
  lifecycle_unit_id?: string | null;
  model?: string;
  prompt_mode?: string;
  skip_credit_check?: boolean;
  admin_triggered?: boolean;
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
 * Create a new AI Job record in queued status with auto-generated UUID id.
 */
export async function createAiJobQueued(
  caseId: string,
  data: CreateAiJobData,
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  const jsonPayload = data as unknown as Prisma.InputJsonValue;
  return await client.aiJob.create({
    data: {
      ...(typeof data.id === "string" ? { id: data.id } : {}),
      case_id: caseId,
      job_type: (data.job_type as string) || "omp_audit",
      status: "queued",
      attempt_count: typeof data.attempt_no === "number" ? data.attempt_no : 0,
      input_json: jsonPayload,
    },
  });
}

/**
 * Update AI Job status and output JSON by primary key ID.
 */
export async function updateAiJobStatusById(
  jobId: string,
  status: string,
  outputJson?: unknown
) {
  return await prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status,
      ...(outputJson !== undefined
        ? { output_json: outputJson === null ? Prisma.DbNull : (outputJson as Prisma.InputJsonValue) }
        : {}),
    },
  });
}

/**
 * Count existing AI Jobs for a case.
 */
export async function countAiJobsByCase(caseId: string, jobType = "omp_audit"): Promise<number> {
  return await prisma.aiJob.count({
    where: { case_id: caseId, job_type: jobType },
  });
}

/**
 * Find AI Job by ID.
 */
export async function findAiJobById(jobId: string) {
  return await prisma.aiJob.findUnique({
    where: { id: jobId },
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
      ...(outputJson !== undefined
        ? { output_json: outputJson === null ? Prisma.DbNull : (outputJson as Prisma.InputJsonValue) }
        : {}),
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
