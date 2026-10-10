import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import type { Prisma } from "@prisma/client";
import type { CreateOrderItem } from "../domain/order.types.js";

export const FREE_PACKAGE_KEY = "pkg_tf_free";

export interface CaseCreditRecord {
  owner_auth_user_id: string;
  internal_status: string;
  package_id: string | null;
  locked_price: number | null;
}

export interface OrderPackage {
  id: string;
  /** Current ServicePricing price, falling back to ServicePackage.price. */
  unitPrice: number;
  creditsGranted: number;
  serviceTypeId: string;
  serviceTypeCode: string;
}

export function generateOrderIdempotencyKey(userId: string, items: CreateOrderItem[]): string {
  const parts = items
    .map((i) => {
      const meta = i.metadata_json as Record<string, unknown> | undefined;
      return `${i.package_id}:${i.quantity}:${String(meta?.["case_id"] ?? "")}`;
    })
    .sort()
    .join(",");
  return `order-${userId}-${crypto.createHash("sha256").update(parts).digest("hex").slice(0, 12)}`;
}

/** Server-side price + grant for a purchasable package; the client never sends a price. */
export async function resolveOrderPackage(packageId: string): Promise<OrderPackage> {
  const pkg = await prisma.servicePackage.findUnique({
    where: { id: packageId },
    include: {
      service_type: true,
      pricing_tiers: { where: { is_current: true }, take: 1 },
    },
  });
  if (!pkg) {
    throw new AppError(404, "PACKAGE_NOT_FOUND", "Không tìm thấy gói dịch vụ");
  }
  if (!pkg.is_active) {
    throw new AppError(400, "PACKAGE_INACTIVE", "Gói dịch vụ này hiện không được bán");
  }
  if (!pkg.service_type || !pkg.credits_granted || pkg.credits_granted <= 0) {
    throw new AppError(400, "INVALID_PACKAGE", "Gói dịch vụ chưa được cấu hình lượt sử dụng");
  }
  const unitPrice = pkg.pricing_tiers[0]?.price ?? pkg.price;
  if (!unitPrice || unitPrice <= 0) {
    throw new AppError(400, "INVALID_PRICE", "Gói dịch vụ chưa có giá");
  }
  return {
    id: pkg.id,
    unitPrice,
    creditsGranted: pkg.credits_granted,
    serviceTypeId: pkg.service_type.id,
    serviceTypeCode: pkg.service_type.code,
  };
}

/**
 * Marks a CP1 case as paid; a free case is upgraded to the purchased package.
 * Only called for CP1 purchases — other service types never change the CP1 case.
 */
export async function applyPaidCreditCaseUpdate(
  tx: Prisma.TransactionClient,
  params: {
    caseId: string;
    userId: string;
    unitPrice: number;
    packageId: string;
    caseRecord: CaseCreditRecord;
  },
): Promise<void> {
  const { caseId, userId, unitPrice, packageId, caseRecord } = params;
  const isFree =
    caseRecord.package_id === FREE_PACKAGE_KEY || caseRecord.locked_price === 0;

  await tx.case.update({
    where: { id: caseId },
    data: {
      payment_status: "paid",
      ...(isFree
        ? {
            package_id: packageId,
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
          to: packageId,
          locked_price: unitPrice,
        },
      },
    });
  }
}

