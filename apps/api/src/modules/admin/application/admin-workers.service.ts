import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve, extname } from "node:path";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db.js";
import logger from "../../../shared/infrastructure/logger.js";
import { AppError } from "../../../shared/domain/app-error.js";
import {
  ompQueue,
  getJobMilestones,
  cancelOmpJob,
} from "../../ai-engine/infrastructure/queue/omp-queue.js";
import {
  triggerOmpAuditForCase,
  cancelOmpAuditForCase,
  refundAuditCreditIfNoReport,
} from "../../ai-engine/application/omp-audit-coordinator.js";
import { updateCaseAuditStage } from "../../ai-engine/infrastructure/persistence/ai-job.repository.js";
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

function getSandboxFiles(caseId: string, subFolder: "input" | "output"): JobSandboxFileInfo[] {
  if (!/^[a-zA-Z0-9_-]+$/.test(caseId)) {
    return [];
  }
  const root = resolveRepoRoot();
  const candidateDirs = [
    resolve(root, "storage", "jobs", caseId, subFolder),
    resolve(root, "apps", "api", "storage", "jobs", caseId, subFolder),
  ];
  const targetDir = candidateDirs.find((d) => existsSync(d));
  if (!targetDir) return [];
  try {
    const entries = readdirSync(targetDir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile())
      .map((e) => {
        const filePath = resolve(targetDir, e.name);
        const stats = statSync(filePath);
        const ext = extname(e.name).replace(".", "");
        return {
          name: e.name,
          sizeBytes: stats.size,
          extension: ext,
        };
      });
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
      select: { created_at: true, updated_at: true, input_json: true },
      take: 100,
    }),
  ]);

  let avgDurationMs24h = 0;
  if (completedJobs24h.length > 0) {
    const totalDuration = completedJobs24h.reduce((acc, job) => {
      const input = job.input_json as { startedAt?: string } | null;
      const start = input?.startedAt ? new Date(input.startedAt).getTime() : job.created_at.getTime();
      const end = job.updated_at.getTime();
      return acc + Math.max(0, end - start);
    }, 0);
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
    where.status = "processing";
  } else if (query.status === "waiting") {
    where.status = "queued";
  } else if (query.status === "completed") {
    where.status = "completed";
  } else if (query.status === "failed") {
    where.status = { in: ["failed", "cancelled"] };
  } else if (query.status === "stuck") {
    where.status = { in: ["queued", "processing"] };
    where.updated_at = { lt: tenMinutesAgo };
  }

  if (query.search && query.search.trim()) {
    const s = query.search.trim();
    where.case = {
      OR: [
        { case_code: { contains: s, mode: "insensitive" } },
        { team_name: { contains: s, mode: "insensitive" } },
        { owner: { name: { contains: s, mode: "insensitive" } } },
        { owner: { email: { contains: s, mode: "insensitive" } } },
      ],
    };
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
      model: (inputJson.model as string) || process.env.OMP_MODEL || "mimo/mimo-v2.5",
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

  const milestones = getJobMilestones(caseId);
  const inputFiles = getSandboxFiles(caseId, "input");
  const outputFiles = getSandboxFiles(caseId, "output");

  const [teamFit, latestReport] = await Promise.all([
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
    const pdfUrl = (meta.pdfUrl as string) || null;

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
    model: (inputJson.model as string) || process.env.OMP_MODEL || "mimo/mimo-v2.5",
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

  // 4. Rollback stage case
  try {
    const reportCount = await prisma.report.count({ where: { case_id: caseId } });
    if (reportCount > 0) {
      await updateCaseAuditStage(caseId, "report_ready", "report_ready_to_publish");
    } else {
      await updateCaseAuditStage(caseId, "intake_ready", "intake_submitted");
    }
  } catch (stageErr) {
    logger.warn({ caseId, stageErr }, "Failed to rollback case stage during heal-stuck");
  }

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
