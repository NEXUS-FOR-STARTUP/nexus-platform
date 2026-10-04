import type { Context } from "hono";
import { auth } from "../../../auth.js";
import { handleError, readJsonBody } from "../../../shared/infrastructure/http-helpers.js";
import { jobStore } from "../../ai-engine/infrastructure/persistence/job-store.repository.js";
import { prisma } from "../../../db.js";
import {
  AdminWorkerJobListQuerySchema,
  AdminRetryJobBodySchema,
  AdminHealStuckBodySchema,
} from "../application/admin-workers.dto.js";
import {
  getAdminWorkerStats,
  listAdminWorkerJobs,
  getAdminWorkerJobDetail,
  retryAdminWorkerJob,
  healStuckAdminWorkerJob,
  cancelAdminWorkerJob,
} from "../application/admin-workers.service.js";

async function getAdminSession(c: Context) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return { ok: false as const, error: "Chưa đăng nhập", status: 401 as const };
  }
  if (session.user.role !== "admin") {
    return { ok: false as const, error: "Không có quyền quản trị", status: 403 as const };
  }
  return { ok: true as const, session };
}

/**
 * GET /api/admin/workers/stats
 */
export async function getAdminWorkerStatsHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  try {
    const stats = await getAdminWorkerStats();
    return c.json(stats);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

/**
 * GET /api/admin/workers/jobs
 */
export async function listAdminWorkerJobsHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  try {
    const parsed = AdminWorkerJobListQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json(
        { code: "INVALID_QUERY", message: "Tham số truy vấn không hợp lệ", errors: parsed.error.flatten() },
        400,
      );
    }
    const result = await listAdminWorkerJobs(parsed.data);
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

/**
 * GET /api/admin/workers/jobs/:id
 */
export async function getAdminWorkerJobDetailHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ code: "BAD_REQUEST", message: "Thiếu ID tiến trình hoặc hồ sơ" }, 400);
  }
  try {
    const detail = await getAdminWorkerJobDetail(id);
    return c.json(detail);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

/**
 * GET /api/admin/workers/jobs/:id/logs
 */
export async function getAdminWorkerJobLogsHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ code: "BAD_REQUEST", message: "Thiếu ID tiến trình hoặc hồ sơ" }, 400);
  }
  try {
    let logs = await jobStore.getLogs(id);
    if (!logs || logs.length === 0) {
      const targetCaseId = id.startsWith("ai-job-") ? id.replace("ai-job-", "") : id;
      logs = await jobStore.getLogs(targetCaseId);
      if (!logs || logs.length === 0) {
        const job = await prisma.aiJob.findFirst({
          where: { OR: [{ id }, { case_id: id }] },
          select: { case_id: true },
        });
        if (job?.case_id && job.case_id !== id) {
          logs = await jobStore.getLogs(job.case_id);
        }
      }
    }
    return c.json({ logs: logs || [] });
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

/**
 * POST /api/admin/workers/jobs/:id/retry
 */
export async function retryAdminWorkerJobHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ code: "BAD_REQUEST", message: "Thiếu ID tiến trình hoặc hồ sơ" }, 400);
  }
  try {
    const body = await readJsonBody(c);
    const parsed = AdminRetryJobBodySchema.safeParse(body || {});
    if (!parsed.success) {
      return c.json(
        { code: "INVALID_BODY", message: "Dữ liệu yêu cầu không hợp lệ", errors: parsed.error.flatten() },
        400,
      );
    }

    const result = await retryAdminWorkerJob(id, parsed.data, authResult.session.user.id);
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

/**
 * POST /api/admin/workers/jobs/:id/heal-stuck
 */
export async function healStuckAdminWorkerJobHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ code: "BAD_REQUEST", message: "Thiếu ID tiến trình hoặc hồ sơ" }, 400);
  }
  try {
    const body = await readJsonBody(c).catch(() => ({}));
    const parsed = AdminHealStuckBodySchema.safeParse(body || {});
    const reason = parsed.success ? parsed.data.reason : undefined;

    const result = await healStuckAdminWorkerJob(id, authResult.session.user.id, reason);
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

/**
 * POST /api/admin/workers/jobs/:id/cancel
 */
export async function cancelAdminWorkerJobHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  const id = c.req.param("id");
  if (!id) {
    return c.json({ code: "BAD_REQUEST", message: "Thiếu ID tiến trình hoặc hồ sơ" }, 400);
  }
  try {
    const result = await cancelAdminWorkerJob(id, authResult.session.user.id);
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}
