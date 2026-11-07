import { z } from "zod";

export const DISCOUNT_PERCENT_MIN = 1;
export const DISCOUNT_PERCENT_MAX = 100;
export const DISCOUNT_CODE_MIN_LENGTH = 3;
export const DISCOUNT_CODE_MAX_LENGTH = 32;
/** Default lifetime of auto-granted and admin-created codes that do not set an expiry. */
export const DISCOUNT_DEFAULT_VALID_DAYS = 30;

/** Codes are stored upper-case and trimmed so lookups are case-insensitive. */
export function normalizeDiscountCode(raw: string): string {
  return raw.trim().toUpperCase();
}

const DiscountCodeValueSchema = z
  .string()
  .transform(normalizeDiscountCode)
  .pipe(
    z
      .string()
      .min(DISCOUNT_CODE_MIN_LENGTH)
      .max(DISCOUNT_CODE_MAX_LENGTH)
      .regex(/^[A-Z0-9_-]+$/, "Mã chỉ gồm chữ, số, gạch ngang hoặc gạch dưới"),
  );

export const CreateDiscountCodeSchema = z.object({
  code: DiscountCodeValueSchema,
  percent_off: z.number().int().min(DISCOUNT_PERCENT_MIN).max(DISCOUNT_PERCENT_MAX),
  service_type_id: z.string().min(1),
  max_redemptions: z.number().int().min(1).nullable().optional(),
  expires_at: z.iso.datetime().nullable().optional(),
});
export type CreateDiscountCodeInput = z.infer<typeof CreateDiscountCodeSchema>;

export const UpdateDiscountCodeSchema = z
  .object({
    is_active: z.boolean().optional(),
    max_redemptions: z.number().int().min(1).nullable().optional(),
    expires_at: z.iso.datetime().nullable().optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Không có thay đổi nào",
  });
export type UpdateDiscountCodeInput = z.infer<typeof UpdateDiscountCodeSchema>;

export const CheckDiscountCodeSchema = z.object({
  code: z.string().min(1).max(64),
  package_id: z.string().min(1),
  /** Needed to validate a code that is bound to one project. */
  case_id: z.string().min(1).optional(),
});
export type CheckDiscountCodeInput = z.infer<typeof CheckDiscountCodeSchema>;

export interface DiscountCodeCheckResult {
  code: string;
  percent_off: number;
  list_price: number;
  discounted_price: number;
}

export type MyDiscountCodeStatus = "available" | "used" | "expired";

/** A personal code granted to the signed-in user for one project. */
export interface MyDiscountCode {
  code: string;
  percent_off: number;
  service_type_code: string;
  status: MyDiscountCodeStatus;
  expires_at: string | null;
}

export type AdminDiscountCodeStatus = "available" | "used" | "expired" | "disabled";

export interface AdminDiscountCode {
  id: string;
  code: string;
  percent_off: number;
  service_type_id: string;
  service_type_code: string;
  max_redemptions: number | null;
  redeemed_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  status: AdminDiscountCodeStatus;
  /** Set only for personal (auto-granted) codes. */
  owner_user_id: string | null;
  owner_email: string | null;
  case_id: string | null;
}

export interface AdminDiscountCodeSummary {
  total: number;
  available: number;
  used: number;
  expired: number;
  disabled: number;
  /** Personal codes granted vs redeemed: the conversion of the first-purchase offer. */
  personal_granted: number;
  personal_redeemed: number;
}

export interface AdminDiscountCodeList {
  codes: AdminDiscountCode[];
  summary: AdminDiscountCodeSummary;
}
