import { CheckDiscountCodeSchema, type DiscountCodeCheckResult } from "@repo/validation";
import { AppError } from "../../../shared/domain/app-error.js";
import { resolveOrderPackage } from "./credit-audit-order.helpers.js";
import { claimDiscountCheckSlot } from "./discount-check-rate-limit.js";
import { applyPercentOff, resolveDiscountCode } from "./discount.helpers.js";

/** Previews a code's effect on one package without consuming it. Rate limited per user. */
export async function checkDiscountCodeUseCase(
  userId: string,
  body: unknown,
): Promise<DiscountCodeCheckResult> {
  const slot = claimDiscountCheckSlot(userId);
  if (!slot.ok) {
    throw new AppError(
      429,
      "DISCOUNT_CHECK_RATE_LIMITED",
      `Bạn thử mã quá nhanh. Vui lòng đợi ${Math.ceil(slot.unlockInMs / 1000)} giây rồi thử lại.`,
    );
  }

  const parsed = CheckDiscountCodeSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "INVALID_REQUEST", "Dữ liệu kiểm tra mã không hợp lệ");
  }

  const pkg = await resolveOrderPackage(parsed.data.package_id);
  const discount = await resolveDiscountCode(parsed.data.code, userId, [pkg.serviceTypeId]);

  return {
    code: discount.code,
    percent_off: discount.percentOff,
    list_price: pkg.unitPrice,
    discounted_price: applyPercentOff(pkg.unitPrice, discount.percentOff),
  };
}
