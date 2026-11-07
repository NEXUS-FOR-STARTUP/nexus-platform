import type { MyDiscountCode } from "@repo/validation";
import { AppError } from "../../../shared/domain/app-error.js";
import { listUserDiscountCodes } from "../infrastructure/persistence/discount-code.repository.js";

/** Personal codes the user was granted for one project, newest first. Scoped by owner, so no other user's code leaks. */
export async function listMyDiscountCodesUseCase(userId: string, caseId: string | undefined): Promise<MyDiscountCode[]> {
  if (!caseId) throw new AppError(400, "INVALID_REQUEST", "Thiếu case_id");
  const now = Date.now();
  const rows = await listUserDiscountCodes(userId, caseId);
  return rows.map((row) => ({
    code: row.code,
    percent_off: row.percent_off,
    service_type_code: row.service_type.code,
    status:
      row.max_redemptions !== null && row.redeemed_count >= row.max_redemptions
        ? "used"
        : !row.is_active || (row.expires_at !== null && row.expires_at.getTime() <= now)
          ? "expired"
          : "available",
  }));
}
