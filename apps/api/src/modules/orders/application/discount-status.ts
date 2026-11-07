import type { AdminDiscountCodeStatus } from "@repo/validation";

interface StatusFields {
  max_redemptions: number | null;
  redeemed_count: number;
  is_active: boolean;
  expires_at: Date | null;
}

/** Single source of truth for a code's lifecycle state; "used" wins over "disabled" so history stays truthful. */
export function discountCodeStatus(row: StatusFields, now = new Date()): AdminDiscountCodeStatus {
  if (row.max_redemptions !== null && row.redeemed_count >= row.max_redemptions) return "used";
  if (!row.is_active) return "disabled";
  if (row.expires_at !== null && row.expires_at <= now) return "expired";
  return "available";
}
