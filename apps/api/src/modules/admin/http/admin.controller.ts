import { auth } from "../../../auth.js";
import type { Context } from "hono";
import { handleError, readJsonBody } from "../../../shared/infrastructure/http-helpers.js";
import { listAdminCasesUseCase } from "../application/list-admin-cases.usecase.js";
import { getAdminCaseDetailUseCase } from "../application/get-admin-case-detail.usecase.js";
import { acceptCaseUseCase } from "../application/accept-case.usecase.js";
import { rejectCaseUseCase } from "../application/reject-case.usecase.js";
import { adminRequestMoreInfoUseCase } from "../application/request-more-info.usecase.js";
import { adminAssignSupporterUseCase } from "../application/assign-supporter.usecase.js";
import { listAdminDocumentsUseCase } from "../application/list-admin-documents.usecase.js";
import { deleteAdminDocumentUseCase } from "../application/delete-admin-document.usecase.js";
import type { ListAdminCasesRequest } from "../application/admin.dto.js";
import { listAdminPackagesUseCase } from "../application/list-admin-packages.usecase.js";
import { updatePackagePriceUseCase } from "../application/update-package-price.usecase.js";
import { updatePackageStatusUseCase } from "../application/update-package-status.usecase.js";
import { getAdminStatsUseCase } from "../application/get-admin-stats.usecase.js";

// ---------------------------------------------------------------------------
// Auth helper — admin-specific
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// GET /api/admin/cases — List all cases with triage filter options
// ---------------------------------------------------------------------------

export async function listAdminCasesHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  try {
    const query = c.req.query() as ListAdminCasesRequest;
    const result = await listAdminCasesUseCase(query);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/cases/:id — Get details of case for triage
// ---------------------------------------------------------------------------

export async function getAdminCaseDetailHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  const caseId = c.req.param("id") || "";

  try {
    const result = await getAdminCaseDetailUseCase(caseId);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/cases/:id/accept — Approve case, transition status
// ---------------------------------------------------------------------------

export async function acceptCaseHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }
  const session = authResult.session;
  const caseId = c.req.param("id") || "";

  try {
    const result = await acceptCaseUseCase(session.user.id, caseId);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/cases/:id/reject — Reject case with a reason
// ---------------------------------------------------------------------------

export async function rejectCaseHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }
  const session = authResult.session;
  const caseId = c.req.param("id") || "";

  try {
    const body = await readJsonBody(c) as { reason?: string };
    const reason = body?.reason || "";
    const result = await rejectCaseUseCase(session.user.id, caseId, reason);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/cases/:id/request-more-info — Request more details
// ---------------------------------------------------------------------------

export async function adminRequestMoreInfoHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }
  const session = authResult.session;
  const caseId = c.req.param("id") || "";

  try {
    const body = await readJsonBody(c) as { query?: string };
    const query = body?.query || "";
    const result = await adminRequestMoreInfoUseCase(session.user.id, caseId, query);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/cases/:id/assign — Assign supporter to case
// ---------------------------------------------------------------------------

export async function adminAssignSupporterHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }
  const session = authResult.session;
  const caseId = c.req.param("id") || "";

  try {
    const body = await readJsonBody(c) as { supporter_id?: string };
    const supporter_id = body?.supporter_id || "";
    const result = await adminAssignSupporterUseCase(session.user.id, caseId, supporter_id);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/documents — List all document records
// ---------------------------------------------------------------------------

export async function listAdminDocumentsHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  try {
    const result = await listAdminDocumentsUseCase();
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/documents/:id — Delete document record
// ---------------------------------------------------------------------------

export async function deleteAdminDocumentHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  const documentId = c.req.param("id") || "";

  try {
    const result = await deleteAdminDocumentUseCase(authResult.session.user.id, documentId);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/packages — List all service packages for admin
// ---------------------------------------------------------------------------

export async function listAdminPackagesHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  try {
    const packages = await listAdminPackagesUseCase();
    return c.json(packages);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/packages/:id/price — Update service package price
// ---------------------------------------------------------------------------

export async function updatePackagePriceHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  const packageId = c.req.param("id") || "";
  const adminId = authResult.session.user.id;

  try {
    const body = await readJsonBody(c) as { price?: number };
    const price = body?.price;
    if (price === undefined) {
      return c.json({ code: "BAD_REQUEST", message: "Thiếu giá tiền" }, 400);
    }

    const result = await updatePackagePriceUseCase(packageId, price, adminId);
    return c.json({ ok: true, data: result });
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// PUT /api/admin/packages/:id/status — Update service package status
// ---------------------------------------------------------------------------

export async function updatePackageStatusHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  const packageId = c.req.param("id") || "";
  const adminId = authResult.session.user.id;

  try {
    const body = await readJsonBody(c) as { is_active?: boolean };
    if (typeof body?.is_active !== "boolean") {
      return c.json({ code: "BAD_REQUEST", message: "Thiếu trạng thái kích hoạt" }, 400);
    }

    const result = await updatePackageStatusUseCase(packageId, body.is_active, adminId);
    return c.json({ ok: true, data: result });
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/stats — Aggregate admin statistics
// ---------------------------------------------------------------------------

export async function getAdminStatsHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  try {
    const period = c.req.query("period") || "30d";
    const stats = await getAdminStatsUseCase(period);
    return c.json(stats);
  } catch (error: any) {
    return handleError(c, error);
  }
}
