import { constants } from "node:fs";
import { access, readdir, stat } from "node:fs/promises";
import { resolve, extname } from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db.js";
import logger from "../../../shared/infrastructure/logger.js";
import { AppError } from "../../../shared/domain/app-error.js";
import {
  ompQueue,
  getJobMilestones,
  cancelOmpJob,
  parseOmpQueueJobId,
} from "../../ai-engine/infrastructure/queue/omp-queue.js";
import {
  triggerOmpAuditForCase,
  cancelOmpAuditForCase,
  refundAuditCreditIfNoReport,
  rollbackCaseStageOnFailure,
} from "../../ai-engine/application/omp-audit-coordinator.js";
import { resolveRepoRoot } from "../../ai-engine/omp-audit.service.js";
import type {
  AdminWorkerStatsResponse,
  AdminWorkerJobListQuery,
  AdminWorkerJobListItem,
  AdminWorkerJobListResponse,
  JobSandboxFileInfo,
  AdminWorkerJobDetailResponse,
  AdminRetryJobBody,
} from "./admin-workers.dto.js";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function getSandboxFiles(caseId: string, subFolder: "input" | "output", jobId?: string): Promise<JobSandboxFileInfo[]> {
  if (!/^[a-zA-Z0-9_-]+$/.test(caseId)) {
    return [];
  }
  const root = resolveRepoRoot();
  const candidateDirs: string[] = [];
  if (jobId && /^[a-zA-Z0-9_-]+$/.test(jobId)) {
    candidateDirs.push(
      resolve(root, "storage", "jobs", caseId, jobId, subFolder),
      resolve(root, "apps", "api", "storage", "jobs", caseId, jobId, subFolder),
      resolve(root, "storage", "jobs", jobId, subFolder),
    );
  }
  candidateDirs.push(
    resolve(root, "storage", "jobs", caseId, subFolder),
    resolve(root, "apps", "api", "storage", "jobs", caseId, subFolder),
  );
  let targetDir: string | undefined;
  for (const d of candidateDirs) {
    if (await pathExists(d)) {
      targetDir = d;
      break;
    }
  }
  if (!targetDir) return [];
  try {
    const entries = await readdir(targetDir, { withFileTypes: true });
    const fileEntries = entries.filter((e) => e.isFile());
    return await Promise.all(
      fileEntries.map(async (e) => {
        const filePath = resolve(targetDir!, e.name);
        const fileStats = await stat(filePath);
        const ext = extname(e.name).replace(".", "");
        return {
          name: e.name,
          sizeBytes: fileStats.size,
          extension: ext,
        };
      })
    );
  } catch (err) {
    logger.warn({ caseId, subFolder, err }, "Failed to scan sandbox directory");
    return [];
  }
}

/**
 * 1. getAdminWorkerStats: Thống kê tổng quan hàng đợi & worker
 */
export async function getAdminWorkerStats(): Promise<AdminWorkerStatsResponse> {
  const since24h = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
  const tenMinutesAgo = new Date(Date.now() - TEN_MINUTES_MS);
  const concurrencyLimit = Number(process.env.OMP_CONCURRENCY || 2);

  let activeCount = 0;
  let waitingCount = 0;
  try {
    const counts = await ompQueue.getJobCounts();
    activeCount = counts.active || 0;
    waitingCount = counts.waiting || 0;
  } catch (queueErr) {
    logger.warn({ queueErr }, "Failed to get job counts from BullMQ, using fallback 0");
  }

  const [completed24hCount, failed24hCount, stuckCount, completedJobs24h] = await Promise.all([
    prisma.aiJob.count({
      where: { job_type: "omp_audit", status: "completed", updated_at: { gte: since24h } },
    }),
    prisma.aiJob.count({
      where: {
        job_type: "omp_audit",
        status: { in: ["failed", "cancelled"] },
        updated_at: { gte: since24h },
      },
    }),
    prisma.aiJob.count({
      where: {
        job_type: "omp_audit",
        status: { in: ["queued", "processing"] },
        updated_at: { lt: tenMinutesAgo },
      },
    }),
    prisma.aiJob.findMany({
      where: { job_type: "omp_audit", status: "completed", updated_at: { gte: since24h } },
      select: { created_at: true, updated_at: true },
      take: 100,
    }),
  ]);

  let avgDurationMs24h = 0;
  if (completedJobs24h.length > 0) {
    const totalDuration = completedJobs24h.reduce(
      (acc, job) => acc + Math.max(0, job.updated_at.getTime() - job.created_at.getTime()),
      0,
    );
    avgDurationMs24h = Math.round(totalDuration / completedJobs24h.length);
  }

  return {
    concurrencyLimit,
    activeCount,
    waitingCount,
    completed24hCount,
    failed24hCount,
    stuckCount,
    avgDurationMs24h,
  };
}

/**
 * 2. listAdminWorkerJobs: Danh sách các tiến trình AI thẩm định có phân trang & lọc
 */
export async function listAdminWorkerJobs(
  query: AdminWorkerJobListQuery,
): Promise<AdminWorkerJobListResponse> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.max(1, Math.min(100, query.limit || 20));
  const skip = (page - 1) * limit;
  const tenMinutesAgo = new Date(Date.now() - TEN_MINUTES_MS);

  const where: Prisma.AiJobWhereInput = {
    job_type: "omp_audit",
  };

  if (query.status === "active") {
    try {
      const activeJobs = await ompQueue.getActive();
      const activePairs = activeJobs
        .map((j) => {
          const dataCaseId = (j.data as any)?.caseId;
          const dataJobId = (j.data as any)?.jobId;
          if (dataCaseId) return { caseId: dataCaseId, jobId: dataJobId };
          if (j.id) {
            const parsed = parseOmpQueueJobId(j.id);
            return { caseId: parsed.caseId, jobId: parsed.aiJobId };
          }
          return null;
        })
        .filter(Boolean) as Array<{ caseId: string; jobId?: string }>;
      const activeCaseIds = activePairs.map((p) => p.caseId);
      const activeJobIds = activePairs.map((p) => p.jobId).filter(Boolean) as string[];
      if (activeCaseIds.length > 0) {
        await prisma.aiJob
          .updateMany({
            where: {
              case_id: { in: activeCaseIds },
              status: "queued",
              job_type: "omp_audit",
            },
            data: { status: "processing" },
          })
          .catch(() => {});

        where.OR = [
          { status: "processing" },
          ...(activeJobIds.length > 0 ? [{ id: { in: activeJobIds } }] : []),
          { case_id: { in: activeCaseIds } },
        ];
      } else {
        where.status = "processing";
      }
    } catch {
      where.status = "processing";
    }
  } else if (query.status === "waiting") {
    where.status = "queued";
    try {
      const activeJobs = await ompQueue.getActive();
      const activePairs = activeJobs
        .map((j) => {
          const dataCaseId = (j.data as any)?.caseId;
          const dataJobId = (j.data as any)?.jobId;
          if (dataCaseId) return { caseId: dataCaseId, jobId: dataJobId };
          if (j.id) {
            const parsed = parseOmpQueueJobId(j.id);
            return { caseId: parsed.caseId, jobId: parsed.aiJobId };
          }
          return null;
        })
        .filter(Boolean) as Array<{ caseId: string; jobId?: string }>;
      const activeCaseIds = activePairs.map((p) => p.caseId);
      const activeJobIds = activePairs.map((p) => p.jobId).filter(Boolean) as string[];
      if (activeJobIds.length > 0) {
        where.id = { notIn: activeJobIds };
      }
      if (activeCaseIds.length > 0) {
        where.case_id = { notIn: activeCaseIds };
      }
    } catch {
      // ignore
    }
  } else if (query.status === "completed") {
    where.status = "completed";
  } else if (query.status === "failed") {
    where.status = { in: ["failed", "cancelled"] };
  } else if (query.status === "stuck") {
    where.status = { in: ["queued", "processing"] };
    where.updated_at = { lt: tenMinutesAgo };
  }

  if (query.search && query.search.trim()) {
    const term = query.search.trim();
    const searchConditions: Prisma.AiJobWhereInput[] = [
      { id: { contains: term, mode: "insensitive" } },
      {
        case: {
          OR: [
            { case_code: { contains: term, mode: "insensitive" } },
            { team_name: { contains: term, mode: "insensitive" } },
            { owner: { name: { contains: term, mode: "insensitive" } } },
            { owner: { email: { contains: term, mode: "insensitive" } } },
          ],
        },
      },
    ];

    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchConditions }];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  const [total, jobs] = await Promise.all([
    prisma.aiJob.count({ where }),
    prisma.aiJob.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        case_id: true,
        status: true,
        created_at: true,
        updated_at: true,
        input_json: true,
        case: {
          select: {
            id: true,
            case_code: true,
            team_name: true,
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const items: AdminWorkerJobListItem[] = jobs.map((job) => {
    const inputJson = (job.input_json as Record<string, unknown>) || {};
    const startedAt = (inputJson.startedAt as string) || job.created_at.toISOString();
    const startTime = new Date(startedAt).getTime();
    const isFinished = job.status === "completed" || job.status === "failed" || job.status === "cancelled";
    const durationMs = isFinished
      ? Math.max(0, job.updated_at.getTime() - startTime)
      : Math.max(0, Date.now() - startTime);

    const isStuck =
      (job.status === "queued" || job.status === "processing") &&
      job.updated_at.getTime() < tenMinutesAgo.getTime();

    const rawAttempt =
      (inputJson.attempt_no as number | undefined) ?? (inputJson.attemptNo as number | undefined);
    const attemptNo = typeof rawAttempt === "number" && rawAttempt > 0 ? rawAttempt : 1;

    return {
      id: job.id,
      caseId: job.case_id,
      caseCode: job.case?.case_code || "",
      projectName: job.case?.team_name || job.case?.case_code || "Dự án khởi nghiệp",
      studentName: job.case?.owner?.name || "",
      studentEmail: job.case?.owner?.email || "",
      status: job.status,
      isStuck,
      submissionType: (inputJson.submission_type as string) || "initial",
      attemptNo,
      model:
        (inputJson.model as string | undefined)?.trim() ||
        (job.created_at < new Date("2026-09-20T00:00:00Z") ? "mimo/mimo-v2.5" : process.env.OMP_MODEL || "mimo/mimo-v2.5-pro"),
      startedAt,
      updatedAt: job.updated_at.toISOString(),
      durationMs,
    };
  });

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * 3. getAdminWorkerJobDetail: Lấy thông tin chi tiết một job
 */
export async function getAdminWorkerJobDetail(
  jobId: string,
): Promise<AdminWorkerJobDetailResponse> {
  const tenMinutesAgo = new Date(Date.now() - TEN_MINUTES_MS);
  const job = await prisma.aiJob.findFirst({
    where: {
      OR: [{ id: jobId }, { case_id: jobId }],
      job_type: "omp_audit",
    },
    orderBy: { created_at: "desc" },
    include: {
      case: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!job) {
    throw new AppError(404, "JOB_NOT_FOUND", "Không tìm thấy tiến trình thẩm định AI");
  }

  const caseId = job.case_id;
  const inputJson = (job.input_json as Record<string, unknown>) || {};
  const outputJson = (job.output_json as Record<string, unknown>) || {};
  const startedAt = (inputJson.startedAt as string) || job.created_at.toISOString();
  const startTime = new Date(startedAt).getTime();
  const isFinished = job.status === "completed" || job.status === "failed" || job.status === "cancelled";
  const durationMs = isFinished
    ? Math.max(0, job.updated_at.getTime() - startTime)
    : Math.max(0, Date.now() - startTime);

  const isStuck =
    (job.status === "queued" || job.status === "processing") &&
    job.updated_at.getTime() < tenMinutesAgo.getTime();

  const [milestones, inputFiles, outputFiles, teamFit, latestReport] = await Promise.all([
    getJobMilestones(caseId, job.id),
    getSandboxFiles(caseId, "input", job.id),
    getSandboxFiles(caseId, "output", job.id),
    prisma.teamFitReport.findUnique({ where: { case_id: caseId } }),
    prisma.report.findFirst({
      where: { case_id: caseId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        metadata_json: true,
        created_at: true,
      },
    }),
  ]);

  let inputSnapshot: AdminWorkerJobDetailResponse["inputSnapshot"] = null;
  if (teamFit) {
    inputSnapshot = {
      idea: (teamFit.idea_snapshot as Record<string, unknown>) || undefined,
      team: (teamFit.team_snapshot as Record<string, unknown>) || undefined,
    };
  }

  let reportSummary: AdminWorkerJobDetailResponse["reportSummary"] = null;
  if (latestReport) {
    const meta = (latestReport.metadata_json as Record<string, unknown>) || {};
    const overallScore = typeof meta.overallScore === "number" ? meta.overallScore : null;
    const scores =
      (meta.categoryScores as Record<string, number>) ||
      (meta.scores as Record<string, number>) ||
      null;
    // View via API (inline disposition + versioned .pdf filename). Never expose raw
    // Cloudinary URLs: raw assets have no .pdf suffix and serve octet-stream,
    // which makes browsers auto-download with a wrong name instead of viewing.
    const pdfUrl = `/api/reports/${latestReport.id}/download?view=inline`;

    reportSummary = {
      id: latestReport.id,
      overallScore,
      scores,
      pdfUrl,
      createdAt: latestReport.created_at.toISOString(),
    };
  }

  const failedReason =
    (outputJson.error as string) ||
    (outputJson.reason as string) ||
    (outputJson.failedReason as string) ||
    null;

  const rawAttempt =
    (inputJson.attempt_no as number | undefined) ?? (inputJson.attemptNo as number | undefined);
  const attemptNo = typeof rawAttempt === "number" && rawAttempt > 0 ? rawAttempt : 1;

  return {
    id: job.id,
    caseId: job.case_id,
    caseCode: job.case?.case_code || "",
    projectName: job.case?.team_name || job.case?.case_code || "Dự án khởi nghiệp",
    student: {
      id: job.case?.owner?.id || "",
      name: job.case?.owner?.name || "",
      email: job.case?.owner?.email || "",
    },
    status: job.status,
    isStuck,
    submissionType: (inputJson.submission_type as string) || "initial",
    attemptNo,
    model:
      (inputJson.model as string | undefined)?.trim() ||
      (job.created_at < new Date("2026-09-20T00:00:00Z") ? "mimo/mimo-v2.5" : process.env.OMP_MODEL || "mimo/mimo-v2.5-pro"),
    promptMode: inputJson.prompt_mode === "lite" ? "lite" : "full",
    startedAt,
    updatedAt: job.updated_at.toISOString(),
    durationMs,
    milestones,
    inputFiles,
    outputFiles,
    reportSummary,
    failedReason,
    inputSnapshot,
  };
}

/**
 * 4. retryAdminWorkerJob: Chạy lại tiến trình AI
 */
export async function retryAdminWorkerJob(
  jobOrCaseId: string,
  body: AdminRetryJobBody,
  adminUserId: string,
): Promise<{ ok: boolean; message: string }> {
  // Tìm case_id tương ứng
  let caseId = jobOrCaseId;
  if (caseId.startsWith("ai-job-")) {
    caseId = caseId.replace("ai-job-", "");
  } else {
    const job = await prisma.aiJob.findFirst({
      where: { OR: [{ id: jobOrCaseId }, { case_id: jobOrCaseId }] },
      select: { case_id: true },
    });
    if (job) {
      caseId = job.case_id;
    }
  }

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) {
    throw new AppError(404, "CASE_NOT_FOUND", `Hồ sơ ${caseId} không tồn tại`);
  }

  // 1. Hủy job cũ trong BullMQ nếu có
  await cancelOmpJob(caseId).catch((err) => {
    logger.warn({ caseId, err }, "Failed to cancel BullMQ job during admin retry");
  });

  // 2. Đánh dấu job cũ thành cancelled trong DB nếu đang queued hoặc processing
  await prisma.aiJob.updateMany({
    where: {
      case_id: caseId,
      job_type: "omp_audit",
      status: { in: ["queued", "processing"] },
    },
    data: {
      status: "cancelled",
      output_json: {
        reason: "Cancelled by admin retry",
        adminUserId,
        cancelledAt: new Date().toISOString(),
      },
    },
  });

  // 3. Trigger lại tiến trình thẩm định
  await triggerOmpAuditForCase(caseId, {
    model: body.model,
    prompt_mode: body.promptMode,
    skip_credit_check: true,
    admin_triggered: true,
    force_supersede: true,
  });

  // 4. Ghi nhận sự kiện CaseEvent
  await prisma.caseEvent.create({
    data: {
      case_id: caseId,
      event_type: "ADMIN_RETRY_AI_JOB",
      actor_auth_user_id: adminUserId,
      actor_role: "admin",
      metadata_json: {
        model: body.model,
        promptMode: body.promptMode,
        clearOldSandbox: body.clearOldSandbox,
        timestamp: new Date().toISOString(),
      },
    },
  });

  logger.info({ caseId, adminUserId, model: body.model }, "Admin successfully retried AI audit job");
  return { ok: true, message: "Đã kích hoạt chạy lại tiến trình thẩm định AI" };
}

/**
 * 5. healStuckAdminWorkerJob: Giải cứu job kẹt & rollback stage & hoàn credit
 */
export async function healStuckAdminWorkerJob(
  jobOrCaseId: string,
  adminUserId: string,
  reason?: string,
): Promise<{ ok: boolean; message: string }> {
  let caseId = jobOrCaseId;
  if (caseId.startsWith("ai-job-")) {
    caseId = caseId.replace("ai-job-", "");
  } else {
    const job = await prisma.aiJob.findFirst({
      where: { OR: [{ id: jobOrCaseId }, { case_id: jobOrCaseId }] },
      select: { case_id: true },
    });
    if (job) {
      caseId = job.case_id;
    }
  }

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) {
    throw new AppError(404, "CASE_NOT_FOUND", `Hồ sơ ${caseId} không tồn tại`);
  }

  const activeJob = await prisma.aiJob.findFirst({
    where: { case_id: caseId, job_type: "omp_audit" },
    orderBy: { created_at: "desc" },
  });
  if (!activeJob || !["queued", "processing"].includes(activeJob.status)) {
    throw new AppError(
      400,
      "INVALID_JOB_STATE",
      `Tiến trình hiện tại ở trạng thái '${activeJob?.status || "không xác định"}', không thể giải phóng kẹt.`,
    );
  }

  // 1. Hủy job trên BullMQ
  await cancelOmpJob(caseId).catch((err) => {
    logger.warn({ caseId, err }, "Failed to cancel BullMQ job during heal-stuck");
  });

  // 2. Cập nhật ai_jobs thành failed
  await prisma.aiJob.updateMany({
    where: {
      case_id: caseId,
      job_type: "omp_audit",
      status: { in: ["queued", "processing"] },
    },
    data: {
      status: "failed",
      output_json: {
        error: reason || "Tiến trình kẹt được quản trị viên xử lý",
        adminUserId,
        healedAt: new Date().toISOString(),
      },
    },
  });

  // 3. Hoàn tiền nếu chưa tạo báo cáo
  await refundAuditCreditIfNoReport(caseId, reason || "admin-healed-stuck").catch((err) => {
    logger.warn({ caseId, err }, "Failed to refund credit during heal-stuck");
  });

  // 4. Rollback stage case (uses shared logic: valid states, intake check)
  await rollbackCaseStageOnFailure(caseId, reason || "admin-healed-stuck").catch((err) => {
    logger.warn({ caseId, err }, "Failed to rollback case stage during heal-stuck");
  });

  // 5. Ghi nhận sự kiện CaseEvent
  await prisma.caseEvent.create({
    data: {
      case_id: caseId,
      event_type: "ADMIN_HEALED_STUCK_JOB",
      actor_auth_user_id: adminUserId,
      actor_role: "admin",
      metadata_json: {
        reason: reason || "Admin healed stuck job",
        timestamp: new Date().toISOString(),
      },
    },
  });

  logger.info({ caseId, adminUserId, reason }, "Admin successfully healed stuck AI job");
  return { ok: true, message: "Đã giải phóng tiến trình kẹt và hoàn trả credit thành công" };
}

/**
 * 6. cancelAdminWorkerJob: Hủy tiến trình AI đang chạy
 */
export async function cancelAdminWorkerJob(
  jobOrCaseId: string,
  adminUserId: string,
): Promise<{ ok: boolean; message: string }> {
  let caseId = jobOrCaseId;
  if (caseId.startsWith("ai-job-")) {
    caseId = caseId.replace("ai-job-", "");
  } else {
    const job = await prisma.aiJob.findFirst({
      where: { OR: [{ id: jobOrCaseId }, { case_id: jobOrCaseId }] },
      select: { case_id: true },
    });
    if (job) {
      caseId = job.case_id;
    }
  }

  const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
  if (!caseRecord) {
    throw new AppError(404, "CASE_NOT_FOUND", `Hồ sơ ${caseId} không tồn tại`);
  }

  const activeJob = await prisma.aiJob.findFirst({
    where: { case_id: caseId, job_type: "omp_audit" },
    orderBy: { created_at: "desc" },
  });
  if (!activeJob || !["queued", "processing"].includes(activeJob.status)) {
    throw new AppError(
      400,
      "INVALID_JOB_STATE",
      `Tiến trình hiện tại ở trạng thái '${activeJob?.status || "không xác định"}', không thể hủy.`,
    );
  }

  // 1. Gọi cancel coordinator
  await cancelOmpAuditForCase(caseId);

  // 2. Ghi nhận sự kiện CaseEvent
  await prisma.caseEvent.create({
    data: {
      case_id: caseId,
      event_type: "ADMIN_CANCEL_AI_JOB",
      actor_auth_user_id: adminUserId,
      actor_role: "admin",
      metadata_json: {
        timestamp: new Date().toISOString(),
      },
    },
  });

  logger.info({ caseId, adminUserId }, "Admin successfully cancelled AI job");
  return { ok: true, message: "Đã gửi tín hiệu hủy tiến trình" };
}
