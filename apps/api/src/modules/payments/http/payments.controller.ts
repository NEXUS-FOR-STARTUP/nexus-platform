import type { Context } from "hono";
import {
  getSession,
  handleError,
  readJsonBody,
} from "../../../shared/infrastructure/http-helpers.js";
import { requireCaseAccess } from "../../../shared/infrastructure/authorization.js";
import { listPaymentsUseCase } from "../application/list-payments.usecase.js";
import { uploadPaymentProofUseCase } from "../application/upload-payment-proof.usecase.js";
import { verifyPaymentUseCase } from "../application/verify-payment.usecase.js";
import { createPaymentUseCase } from "../application/create-payment.usecase.js";
import { getPaymentUseCase } from "../application/get-payment.usecase.js";
import type { VerifyPaymentRequest, CreatePaymentRequest } from "../application/payments.dto.js";
import { fileStorageService } from "../infrastructure/file-storage.service.js";
import { findDepositById } from "../../deposits/infrastructure/persistence/deposit.repository.js";
import { prisma } from "../../../db.js";
import logger from "../../../shared/infrastructure/logger.js";

// ---------------------------------------------------------------------------
// GET /api/payments — Get all payments (Admin only)
// ---------------------------------------------------------------------------

export async function listPaymentsHandler(c: Context) {
  const session = await getSession(c);
  if (!session || session.user.role !== "admin") {
    return c.json({ code: "FORBIDDEN", message: "Không có quyền quản trị" }, 403);
  }

  try {
    const result = await listPaymentsUseCase();
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments — Create new unpaid payment (Student/Owner only)
// ---------------------------------------------------------------------------

export async function createPaymentHandler(c: Context) {
  const session = await getSession(c);
  if (!session) {
    return c.json({ code: "UNAUTHORIZED", message: "Chưa đăng nhập" }, 401);
  }

  try {
    const body = await readJsonBody(c) as CreatePaymentRequest;
    const { caseId, amount, metadataJson } = body;

    if (!caseId || !amount) {
      return c.json({ code: "VALIDATION_ERROR", message: "Thiếu caseId hoặc amount" }, 400);
    }

    const access = await requireCaseAccess(c, caseId, {
      allowStudent: true,
      allowSupporter: false,
      allowAdmin: true,
    });
    if (!access.ok) {
      return access.response;
    }

    const result = await createPaymentUseCase(session.user.id, { caseId, amount, metadataJson });
    return c.json(result, 201);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/payments/my — Get current user payment history
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// GET /api/payments/:id — Get payment detail
// ---------------------------------------------------------------------------

export async function getPaymentHandler(c: Context) {
  const session = await getSession(c);
  if (!session) {
    return c.json({ code: "UNAUTHORIZED", message: "Chưa đăng nhập" }, 401);
  }

  const paymentId = c.req.param("id") || "";

  try {
    const result = await getPaymentUseCase(session.user.id, paymentId);
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments/proof — Upload proof of payment (Student only)
// ---------------------------------------------------------------------------

export async function uploadPaymentProofHandler(c: Context) {
  const session = await getSession(c);
  if (!session) {
    return c.json({ code: "UNAUTHORIZED", message: "Chưa đăng nhập" }, 401);
  }

  try {
    const body = await c.req.parseBody();
    const file = body["file"] as any;
    const caseId = ((body["case_id"] || body["caseId"]) as string) || null;
    const depositId = (body["deposit_id"] as string) || null;

    if (!file) {
      return c.json({ code: "VALIDATION_ERROR", message: "Thiếu tệp minh chứng" }, 400);
    }

    if (caseId) {
      const access = await requireCaseAccess(c, caseId, {
        allowStudent: true,
        allowSupporter: false,
        allowAdmin: true,
      });
      if (!access.ok) return access.response;

      const result = await uploadPaymentProofUseCase(session.user.id, caseId, file);
      return c.json(result, 201);
    }

    if (!depositId) {
      return c.json({ code: "VALIDATION_ERROR", message: "Thiếu mã giao dịch nạp tiền" }, 400);
    }

    const proofFile = await fileStorageService.saveProofFile(file);

    const deposit = await findDepositById(depositId);
    if (!deposit || deposit.user_id !== session.user.id) {
      await fileStorageService.deleteFile(proofFile.publicId);
      return c.json({ code: "DEPOSIT_NOT_FOUND", message: "Không tìm thấy giao dịch nạp tiền" }, 404);
    }

    await prisma.deposit.update({
      where: { id: depositId },
      data: { proof_file_url: proofFile.fileUrl },
    });
    logger.info({ depositId, userId: session.user.id, fileUrl: proofFile.fileUrl }, "deposit proof uploaded");
    return c.json({ success: true, fileUrl: proofFile.fileUrl }, 201);
  } catch (error: any) {
    return handleError(c, error);
  }
}

// ---------------------------------------------------------------------------
// POST /api/payments/:id/verify — Approve / Reject payment (Admin only)
// ---------------------------------------------------------------------------

export async function verifyPaymentHandler(c: Context) {
  const session = await getSession(c);
  if (!session || session.user.role !== "admin") {
    return c.json({ code: "FORBIDDEN", message: "Không có quyền quản trị" }, 403);
  }

  const paymentId = c.req.param("id") || "";

  try {
    const body = await readJsonBody(c) as VerifyPaymentRequest;
    const status = body?.status || "";
    const rejection_reason = body?.rejection_reason || "";

    const result = await verifyPaymentUseCase(
      session.user.id,
      paymentId,
      status,
      rejection_reason,
    );
    return c.json(result);
  } catch (error: any) {
    return handleError(c, error);
  }
}
