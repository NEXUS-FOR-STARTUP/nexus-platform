import { auth } from "../../../auth.js";
import type { Context } from "hono";
import { handleError, readJsonBody } from "../../../shared/infrastructure/http-helpers.js";
import { listAdminCasesUseCase } from "../application/list-admin-cases.usecase.js";
import { getAdminCaseDetailUseCase } from "../application/get-admin-case-detail.usecase.js";
import { acceptCaseUseCase } from "../application/accept-case.usecase.js";
import { rejectCaseUseCase } from "../application/reject-case.usecase.js";
import { adminAssignSupporterUseCase } from "../application/assign-supporter.usecase.js";
import { listAdminDocumentsUseCase } from "../application/list-admin-documents.usecase.js";
import { deleteAdminDocumentUseCase } from "../application/delete-admin-document.usecase.js";
import { listAdminPackagesUseCase } from "../application/list-admin-packages.usecase.js";
import { updatePackagePriceUseCase } from "../application/update-package-price.usecase.js";
import { updatePackageStatusUseCase } from "../application/update-package-status.usecase.js";
import { getAdminStatsUseCase } from "../application/get-admin-stats.usecase.js";
import { listServiceTypesUseCase, createServiceTypeUseCase, updateServiceTypeUseCase } from "../../packages/application/service-type.usecase.js";
import { setCurrentPricingUseCase, getPricingHistoryUseCase } from "../../packages/application/service-pricing.usecase.js";
import { createAdminUserUseCase } from "../application/create-admin-user.usecase.js";
import { banUserUseCase } from "../application/ban-user.usecase.js";
import { unbanUserUseCase } from "../application/unban-user.usecase.js";
import { exportAdminDataUseCase, parseExportResource } from "../application/export-admin-data.usecase.js";


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
    const result = await listAdminCasesUseCase(c.req.query());
    return c.json(result);
  } catch (error: unknown) {
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

export async function listServiceTypesHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }
  try {
    const types = await listServiceTypesUseCase();
    return c.json({ types });
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function createServiceTypeHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }
  try {
    const data = await c.req.json();
    const type = await createServiceTypeUseCase(data);
    return c.json(type, 201);
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function updateServiceTypeHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const type = await updateServiceTypeUseCase(id!, data);
    return c.json(type);
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function getPricingHistoryHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }
  try {
    const history = await getPricingHistoryUseCase(c.req.param('id')!);
    return c.json({ history });
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function setPricingHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }
  try {
    const { price } = await c.req.json();
    const pricing = await setCurrentPricingUseCase(c.req.param('id')!, price, authResult.session.user.id);
    return c.json(pricing, 201);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/users — Create user account + send welcome email
// ---------------------------------------------------------------------------

export async function createAdminUserHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  try {
    const { email, name, role } = await c.req.json();

    if (!email || !name) {
      return c.json({ code: "MISSING_FIELDS", message: "Email và họ tên là bắt buộc" }, 400);
    }

    const result = await createAdminUserUseCase(email, name, role, c.req.raw.headers);
    return c.json(result, 201);
  } catch (error: any) {
    if (error?.status === 400 || error?.status === 409) {
      return c.json({ code: "CREATE_USER_FAILED", message: error?.message || "Không thể tạo tài khoản" }, error.status);
    }
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/users/:id/ban — Ban user + revoke sessions + send email
// ---------------------------------------------------------------------------

export async function banUserHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  const userId = c.req.param("id")!;

  try {
    const { ban_reason } = await c.req.json();
    const result = await banUserUseCase(userId, ban_reason);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/users/:id/unban — Unban user + send email notification
// ---------------------------------------------------------------------------

export async function unbanUserHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  const userId = c.req.param("id")!;

  try {
    const result = await unbanUserUseCase(userId);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

export async function exportAdminDataHandler(c: Context) {
  const authResult = await getAdminSession(c);
  if (!authResult.ok) {
    return c.json({ code: "FORBIDDEN", message: authResult.error }, authResult.status);
  }

  try {
    const resource = parseExportResource(c.req.query("resource"));
    const { csv, filename } = await exportAdminDataUseCase(resource);
    return c.body(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, private",
    });
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

