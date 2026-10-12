import type { Prisma } from "@prisma/client";
import { normalizeDiscountCode } from "@repo/validation";
import { AppError } from "../../../shared/domain/app-error.js";
import {
  findDiscountCodeByCode,
  findUserRedemption,
} from "../infrastructure/persistence/discount-code.repository.js";

const PERCENT_DENOMINATOR = 100;

export interface ResolvedDiscount {
  id: string;
  code: string;
  percentOff: number;
  serviceTypeId: string;
  /** true when the code has max_redemptions (atomic counter path). */
  limited: boolean;
}

const INVALID_CODE_ERROR = () =>
  new AppError(400, "DISCOUNT_INVALID", "Mã giảm giá không hợp lệ hoặc đã hết hạn");

export function applyPercentOff(unitPrice: number, percentOff: number): number {
  return Math.round((unitPrice * (PERCENT_DENOMINATOR - percentOff)) / PERCENT_DENOMINATOR);
}

/**
 * Looks the code up and checks everything except the atomic usage counter.
 * Unknown / inactive / expired / wrong-service codes all return the same error so codes cannot be probed.
 */
export async function resolveDiscountCode(
  rawCode: string,
  userId: string,
  serviceTypeIds: string[],
  now = new Date(),
): Promise<ResolvedDiscount> {
  const code = normalizeDiscountCode(rawCode);
  const record = code ? await findDiscountCodeByCode(code) : null;

  if (
    !record ||
    !record.is_active ||
    (record.expires_at !== null && record.expires_at <= now) ||
    !serviceTypeIds.includes(record.service_type_id)
  ) {
    throw INVALID_CODE_ERROR();
  }
  if (record.max_redemptions !== null && record.redeemed_count >= record.max_redemptions) {
    throw new AppError(409, "DISCOUNT_EXHAUSTED", "Mã giảm giá đã hết lượt sử dụng");
  }
  if (await findUserRedemption(record.id, userId)) {
    throw new AppError(409, "DISCOUNT_ALREADY_USED", "Bạn đã sử dụng mã giảm giá này rồi");
  }

  return {
    id: record.id,
    code: record.code,
    percentOff: record.percent_off,
    serviceTypeId: record.service_type_id,
    limited: record.max_redemptions !== null,
  };
}

/** Atomically consumes one use of the code inside the order transaction. */
export async function redeemDiscountInTx(
  tx: Prisma.TransactionClient,
  params: { discountId: string; userId: string; orderId: string; limited: boolean },
): Promise<void> {
  const { discountId, userId, orderId, limited } = params;

  if (limited) {
    const claimed = await tx.discountCode.updateMany({
      where: {
        id: discountId,
        redeemed_count: { lt: tx.discountCode.fields.max_redemptions },
      },
      data: { redeemed_count: { increment: 1 } },
    });
    if (claimed.count === 0) {
      throw new AppError(409, "DISCOUNT_EXHAUSTED", "Mã giảm giá đã hết lượt sử dụng");
    }
  } else {
    await tx.discountCode.update({
      where: { id: discountId },
      data: { redeemed_count: { increment: 1 } },
    });
  }

  try {
    await tx.discountRedemption.create({
      data: { code_id: discountId, user_id: userId, order_id: orderId },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new AppError(409, "DISCOUNT_ALREADY_USED", "Bạn đã sử dụng mã giảm giá này rồi");
    }
    throw error;
  }
}
