/**
 * @deprecated Replaced by deposits/orders modules (2026-08-12).
 * Kept for reference. Routes return 410 Gone.
 */

import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import { findPaymentById as defaultFindPaymentById } from "../infrastructure/persistence/payment.repository.js";
import { getBankInfo } from "../domain/bank-info.js";
import type { GetPaymentResponse } from "./payments.dto.js";

type GetPaymentDeps = {
  findPaymentById?: typeof defaultFindPaymentById;
};

const defaultDeps = {
  findPaymentById: defaultFindPaymentById,
};

export async function getPaymentUseCase(
  userId: string,
  paymentId: string,
  deps: GetPaymentDeps = {},
): Promise<GetPaymentResponse> {
  const { findPaymentById } = { ...defaultDeps, ...deps };

  const payment = await findPaymentById(paymentId);

  if (!payment) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Không tìm thấy thông tin giao dịch");
  }

  const caseRecord = (payment as any).case;
  const caseCode: string = caseRecord?.case_code ?? "";

  // Read transfer content from column first; fallback to metadata_json, then generated
  const SERVICE_PREFIX = "CR";
  const metadataJson = (payment as any).metadata_json as Record<string, unknown> | null;
  const cleanCode = caseCode.replace(/[^a-zA-Z0-9]/g, "");
  const transferContent =
    (payment as any).transfer_content ??
    (metadataJson?.transfer_content as string) ??
    `${SERVICE_PREFIX}${cleanCode.toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

  const bankInfo = getBankInfo(transferContent, payment.amount);

  return {
    id: payment.id,
    case_id: payment.case_id,
    case_code: caseCode,
    package_id: payment.package_id!,
    amount: payment.amount,
    status: payment.status,
    proof_file_url: payment.proof_file_url ?? null,
    currency: (payment as any).currency ?? "VND",
    payment_method: (payment as any).payment_method ?? "bank_transfer",
    metadata_json: (payment as any).metadata_json ?? null,
    rejection_reason: payment.rejection_reason ?? null,
    verified_by_auth_user_id: payment.verified_by_auth_user_id ?? null,
    verified_at: payment.verified_at?.toISOString() ?? null,
    verification_source: payment.verification_source ?? null,
    transfer_content: (payment as any).transfer_content ?? null,
    bank_transaction_id: (payment as any).bank_transaction_id ?? null,
    bank_credited_at: (payment as any).bank_credited_at?.toISOString?.() ?? null,
    payer: (payment as any).payer ?? null,
    created_at: payment.created_at.toISOString(),
    bankInfo,
  };
}
