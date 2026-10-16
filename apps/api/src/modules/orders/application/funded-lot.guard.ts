import type { Prisma } from "@prisma/client";
import { AppError } from "../../../shared/domain/app-error.js";

/** creditLedger purchase rows written for a pay-later receivable carry this metadata key. */
export const FUNDED_BY_RECEIVABLE_KEY = "funded_by_receivable_id";

export function isFundedPurchase(metadata: Prisma.JsonValue | null | undefined): boolean {
  const value = (metadata as Record<string, unknown> | null | undefined)?.[FUNDED_BY_RECEIVABLE_KEY];
  return typeof value === "string" && value.length > 0;
}

/** Serialises concurrent purchases on one case so the no-mix check below cannot race. */
export async function lockCaseRow(tx: Prisma.TransactionClient, caseId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM cases WHERE id = ${caseId} FOR UPDATE`;
}

export interface CaseSnapshot {
  owner_auth_user_id: string;
  internal_status: string;
  package_id: string | null;
  locked_price: number | null;
}

/**
 * Locks every case in a stable order (no deadlock between multi-case orders), then rejects missing,
 * foreign or closed cases. Runs before any order or wallet row is written.
 */
export async function lockAndValidateCases(
  tx: Prisma.TransactionClient,
  userId: string,
  caseIds: string[],
): Promise<Map<string, CaseSnapshot>> {
  const records = new Map<string, CaseSnapshot>();
  for (const caseId of [...new Set(caseIds)].sort()) {
    await lockCaseRow(tx, caseId);
    const record = await tx.case.findUnique({
      where: { id: caseId },
      select: { owner_auth_user_id: true, internal_status: true, package_id: true, locked_price: true },
    });
    if (!record) throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án liên quan đến đơn hàng");
    if (record.owner_auth_user_id !== userId) {
      throw new AppError(403, "FORBIDDEN", "Không thể mua credit cho dự án của người khác");
    }
    if (record.internal_status === "cancelled") {
      throw new AppError(409, "CASE_CLOSED", "Dự án đã đóng, không thể mua thêm lượt");
    }
    records.set(caseId, record);
  }
  return records;
}

/**
 * A (case, service type) pair never mixes sponsored credits (priced 0, refunded as 0đ)
 * with real purchases, otherwise FIFO refund could under-refund what the customer paid.
 */
export async function assertLotsNotMixed(
  tx: Prisma.TransactionClient,
  caseId: string,
  serviceTypeId: string,
  funded: boolean,
): Promise<void> {
  const rows = await tx.creditLedger.findMany({
    where: { case_id: caseId, service_type_id: serviceTypeId, type: { in: ["purchase", "refund"] } },
    select: { type: true, amount: true, metadata_json: true },
  });
  const purchases = rows.filter((r) => r.type === "purchase" && r.amount > 0);
  const hasFunded = purchases.some((r) => isFundedPurchase(r.metadata_json));
  const hasReal = purchases.some((r) => !isFundedPurchase(r.metadata_json));
  if (funded && hasReal) {
    throw new AppError(409, "FUNDED_LOT_MIX", "Dự án này đã có lượt mua thật cho loại dịch vụ này, không thể mua hộ thêm");
  }
  if (!funded && hasFunded) {
    throw new AppError(409, "FUNDED_LOT_MIX", "Dự án này đang dùng lượt mua hộ cho loại dịch vụ này, không thể mua thường thêm");
  }
  // The refund path keeps one permanent idempotency key per (case, service type), so a refunded pair
  // cannot be refunded again. Sponsored credits there would be unrefundable and their debt stuck open.
  if (funded && rows.some((r) => r.type === "refund")) {
    throw new AppError(409, "FUNDED_AFTER_REFUND", "Loại dịch vụ này của dự án đã từng hoàn lượt, không thể mua hộ thêm");
  }
}

/** True when a purchase of this (case, service type) pair was sponsored by a receivable. */
export async function pairHasFundedLots(
  tx: Prisma.TransactionClient,
  caseId: string,
  serviceTypeId: string,
): Promise<boolean> {
  const rows = await tx.creditLedger.findMany({
    where: { case_id: caseId, service_type_id: serviceTypeId, type: "purchase", amount: { gt: 0 } },
    select: { metadata_json: true },
  });
  return rows.some((r) => isFundedPurchase(r.metadata_json));
}
