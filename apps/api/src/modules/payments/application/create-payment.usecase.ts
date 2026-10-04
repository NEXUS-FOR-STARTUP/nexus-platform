/**
 * @deprecated Replaced by deposits/orders modules (2026-08-12).
 * Kept for reference. Routes return 410 Gone.
 */

import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import { findCaseByIdWithMembers as defaultFindCaseByIdWithMembers } from "../../cases/infrastructure/persistence/case.repository.js";
import { createUnpaidPayment as defaultCreateUnpaidPayment } from "../infrastructure/persistence/payment.repository.js";
import { getBankInfo } from "../domain/bank-info.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { CreatePaymentRequest, CreatePaymentResponse } from "./payments.dto.js";

type CreatePaymentDeps = {
  findCaseByIdWithMembers?: typeof defaultFindCaseByIdWithMembers;
  createUnpaidPayment?: typeof defaultCreateUnpaidPayment;
};

const defaultDeps = {
  findCaseByIdWithMembers: defaultFindCaseByIdWithMembers,
  createUnpaidPayment: defaultCreateUnpaidPayment,
};

// Service type prefix cho SePay auto-matching (future):
// CR = credit purchase, UP = upgrade, RF = refund
const SERVICE_PREFIX = "CR";

function generateTransferContent(caseCode: string): string {
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase(); // 4 uppercase hex chars
  const clean = caseCode.replace(/[^a-zA-Z0-9]/g, "");
  return `${SERVICE_PREFIX}${clean.toUpperCase()}${suffix}`;
}

export async function createPaymentUseCase(
  userId: string,
  body: CreatePaymentRequest,
  deps: CreatePaymentDeps = {},
): Promise<CreatePaymentResponse> {
  const { findCaseByIdWithMembers, createUnpaidPayment } = {
    ...defaultDeps,
    ...deps,
  };
  const __log_start = Date.now();

  try {
    const caseObj = await findCaseByIdWithMembers(body.caseId);

    if (!caseObj) {
      throw new AppError(404, "CASE_NOT_FOUND", "Không tìm thấy dự án");
    }

    if (caseObj.owner_auth_user_id !== userId && !caseObj.members.some((m) => m.auth_user_id === userId)) {
      throw new AppError(403, "FORBIDDEN", "Bạn không có quyền tạo thanh toán cho dự án này");
    }

    if (!caseObj.package_id) {
      throw new AppError(400, "INVALID_PACKAGE", "Dự án chưa có gói dịch vụ hợp lệ");
    }

    const transferContent = generateTransferContent(caseObj.case_code);
    const metadataWithTransfer = {
      ...(body.metadataJson ?? {}),
      transfer_content: transferContent,
    };

    const payment = await createUnpaidPayment({
      caseId: body.caseId,
      packageId: caseObj.package_id,
      amount: body.amount,
      metadataJson: metadataWithTransfer,
      transferContent,
      payerAuthUserId: userId,
    });

    const bankInfo = getBankInfo(transferContent, body.amount);

    logger.info({ paymentId: payment.id, caseId: body.caseId, packageId: caseObj.package_id, amount: body.amount, duration_ms: Date.now() - __log_start }, "payment created");

    return {
      paymentId: payment.id,
      bankInfo,
    };
  } catch (error) {
    logger.error({ err: error, caseId: body.caseId, duration_ms: Date.now() - __log_start }, "payment creation failed");
    throw error;
  }
}
