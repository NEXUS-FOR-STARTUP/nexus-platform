/**
 * @deprecated Replaced by deposits/orders modules (2026-08-12).
 * Kept for reference. Routes return 410 Gone.
 */

import { AppError } from "../../../shared/domain/app-error.js";
import { findPaymentById as defaultFindPaymentById, verifyPayment as defaultVerifyPayment } from "../infrastructure/persistence/payment.repository.js";
import {
  isFinalPaymentStatus,
  isValidPaymentDecision,
  normalizePaymentStatus,
} from "../domain/payment.types.js";
import logger from "../../../shared/infrastructure/logger.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import type { VerifyPaymentRequest } from "./payments.dto.js";

type VerifyPaymentDeps = {
  findPaymentById?: typeof defaultFindPaymentById;
  verifyPayment?: typeof defaultVerifyPayment;
};

const defaultDeps = {
  findPaymentById: defaultFindPaymentById,
  verifyPayment: defaultVerifyPayment,
};

export async function verifyPaymentUseCase(
  adminId: string,
  paymentId: string,
  status: VerifyPaymentRequest["status"],
  rejectionReason: string,
  deps: VerifyPaymentDeps = {}
) {
  const { findPaymentById, verifyPayment } = { ...defaultDeps, ...deps };
  const __log_start = Date.now();

  try {
    if (!isValidPaymentDecision(status)) {
      throw new AppError(400, "INVALID_DECISION", "Trạng thái phê duyệt không hợp lệ");
    }

    if (status === "rejected" && rejectionReason.length < 10) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Lý do từ chối tối thiểu phải có 10 ký tự",
      );
    }

    const payment = await findPaymentById(paymentId);

    if (!payment) {
      throw new AppError(404, "PAYMENT_NOT_FOUND", "Không tìm thấy thông tin giao dịch");
    }

    if (isFinalPaymentStatus(payment.status)) {
      throw new AppError(
        409,
        "FINAL_STATUS",
        "Giao dịch đã ở trạng thái cuối, không thể cập nhật lại",
      );
    }

    const previousStatus = payment.status;

    // verifyPayment in repository now handles:
    // 1. credit ledger purchase entry (on 'paid')
    // 2. case event 'credits_purchased'
    // 3. audit round status cascade + SLA on lowest round
    const result = await verifyPayment({
      paymentId,
      caseId: payment.case_id,
      status,
      rejectionReason: status === "rejected" ? rejectionReason : null,
      adminId,
      verificationSource: "manual",
    });

    const newStatus = normalizePaymentStatus(result.status);

    logger.info({ paymentId, decision: status, verifierId: adminId, previousStatus, newStatus, duration_ms: Date.now() - __log_start }, "payment verified");

    emitEvent({
      eventId: crypto.randomUUID(),
      type: status === "paid" ? DOMAIN_EVENTS.PAYMENT_VERIFIED : DOMAIN_EVENTS.PAYMENT_REJECTED,
      actorId: adminId,
      occurredAt: new Date(),
      payload: {
        caseId: payment.case_id,
        caseCode: payment.case?.case_code ?? "",
        paymentId,
        amount: payment.amount,
        ...(status === "rejected" ? { reason: rejectionReason } : { source: "manual" }),
      },
    });

    return {
      ...result,
      status: newStatus,
    };
  } catch (error) {
    logger.error({ err: error, paymentId, decision: status, verifierId: adminId, duration_ms: Date.now() - __log_start }, "payment verification failed");
    throw error;
  }
}
