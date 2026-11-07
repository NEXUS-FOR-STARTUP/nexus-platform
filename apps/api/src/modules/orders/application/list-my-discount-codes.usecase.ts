import type { MyDiscountCode } from "@repo/validation";
import { AppError } from "../../../shared/domain/app-error.js";
import { listUserDiscountCodes } from "../infrastructure/persistence/discount-code.repository.js";
import { discountCodeStatus } from "./discount-status.js";

/** Personal codes the user was granted for one project, newest first. Scoped by owner, so no other user's code leaks. */
export async function listMyDiscountCodesUseCase(userId: string, caseId: string | undefined): Promise<MyDiscountCode[]> {
  if (!caseId) throw new AppError(400, "INVALID_REQUEST", "Thiếu case_id");
  const rows = await listUserDiscountCodes(userId, caseId);
  return rows.map((row) => {
    const status = discountCodeStatus(row);
    return {
      code: row.code,
      percent_off: row.percent_off,
      service_type_code: row.service_type.code,
      // A code the admin switched off is dead to the user, same as an expired one.
      status: status === "disabled" ? "expired" : status,
      expires_at: row.expires_at ? row.expires_at.toISOString() : null,
    };
  });
}
