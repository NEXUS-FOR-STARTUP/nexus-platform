import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import type { Prisma } from "@prisma/client";
import type { CreateOrderItem } from "../domain/order.types.js";
export const FREE_PACKAGE_KEY = "pkg_tf_free";
export const AUDIT_PACKAGE_KEY = "pkg_ai_audit";
export const LEGACY_AUDIT_PACKAGE_KEY = "pkg_tf_audit";

export interface CaseCreditRecord {
  owner_auth_user_id: string;
  internal_status: string;
  package_id: string | null;
  locked_price: number | null;
}

export function generateOrderIdempotencyKey(userId: string, items: CreateOrderItem[]): string {
  const parts = items
    .map((i) => {
      const meta = i.metadata_json as Record<string, unknown> | undefined;
      return `${i.service_type}:${i.quantity}:${String(meta?.["case_id"] ?? "")}`;
    })
    .sort()
    .join(",");
  return `order-${userId}-${crypto.createHash("sha256").update(parts).digest("hex").slice(0, 12)}`;
}

export async function resolveCreditAuditPrice(caseId: string): Promise<number> {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: { package_id: true, locked_price: true },
  });
  if (!caseRecord?.package_id) {
    throw new AppError(400, "INVALID_PACKAGE", "Dự án chưa có gói dịch vụ hợp lệ");
  }

  const isFree =
    caseRecord.package_id === FREE_PACKAGE_KEY || caseRecord.locked_price === 0;

  if (!isFree) {
    const pkg = await prisma.servicePackage.findUnique({
      where: { id: caseRecord.package_id },
      include: {
        pricing_tiers: {
          where: { is_current: true },
          take: 1,
        },
      },
    });
    if (!pkg) {
      throw new AppError(404, "PACKAGE_NOT_FOUND", "Không tìm thấy gói dịch vụ");
    }

    const price = pkg.pricing_tiers[0]?.price ?? pkg.price;
    if (price && price > 0) {
      return price;
    }
  }
  const auditPkg = await prisma.servicePackage.findUnique({
    where: { id: AUDIT_PACKAGE_KEY },
    include: {
      pricing_tiers: {
        where: { is_current: true },
        take: 1,
      },
    },
  });
  if (!auditPkg) {
    throw new AppError(404, "PACKAGE_NOT_FOUND", "Không tìm thấy gói dịch vụ nâng cấp");
  }

  const auditPrice = auditPkg.pricing_tiers[0]?.price ?? auditPkg.price;
  if (!auditPrice || auditPrice <= 0) {
    throw new AppError(400, "INVALID_PRICE", "Gói dịch vụ nâng cấp chưa có giá");
  }

  return auditPrice;
}

export async function getCreditBalanceInTx(
  tx: Prisma.TransactionClient,
  caseId: string,
): Promise<number> {
  const result = await tx.creditLedger.aggregate({
    where: { case_id: caseId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function applyPaidCreditCaseUpdate(
  tx: Prisma.TransactionClient,
  params: {
    caseId: string;
    userId: string;
    unitPrice: number;
    caseRecord: CaseCreditRecord;
  },
): Promise<void> {
  const { caseId, userId, unitPrice, caseRecord } = params;
  const isFree =
    caseRecord.package_id === FREE_PACKAGE_KEY || caseRecord.locked_price === 0;

  await tx.case.update({
    where: { id: caseId },
    data: {
      payment_status: "paid",
      ...(isFree
        ? {
            package_id: AUDIT_PACKAGE_KEY,
            locked_price: unitPrice,
          }
        : {}),
    },
  });

  if (isFree) {
    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        actor: { connect: { id: userId } },
        event_type: "package_upgraded",
        metadata_json: {
          from: caseRecord.package_id,
          to: AUDIT_PACKAGE_KEY,
          locked_price: unitPrice,
        },
      },
    });
  }
}
