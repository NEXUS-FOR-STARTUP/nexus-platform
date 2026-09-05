import { notifications } from "@mantine/notifications";

export const PACKAGE_KEYS = {
  FREE: "pkg_tf_free",
  AUDIT: "pkg_tf_audit",
  LEGACY_AUDIT: "pkg_tf_audit",
  AI_AUDIT: "pkg_ai_audit",
  SUPPORTER_AUDIT: "pkg_supporter_audit",
} as const;

export type PackageKey = (typeof PACKAGE_KEYS)[keyof typeof PACKAGE_KEYS];

export function isCaseFree(caseData?: {
  package_id?: string | null;
  locked_price?: number | null;
} | null): boolean {
  return caseData?.locked_price === 0 || caseData?.package_id === PACKAGE_KEYS.FREE;
}

/**
 * Resolves the effective pricing for a case, falling back to the package price
 * or 0 if neither are set.
 */
export function getCaseEffectivePrice(caseData?: {
  locked_price?: number | null;
  package?: { price?: number } | null;
} | null): number {
  return caseData?.locked_price ?? caseData?.package?.price ?? 0;
}

/**
 * Determines whether a case's payment is complete, authorizing admin approval.
 * Fail-closed: only the explicit statuses `paid` (paid/free legacy cases) and
 * `not_required` (AI-engine free path) qualify. Every other value — including
 * missing/unknown data — blocks approval.
 */
export function isCasePaymentComplete(
  caseData: { payment_status?: string } | null | undefined,
): boolean {
  const status = caseData?.payment_status;
  return status === "paid" || status === "not_required";
}

/**
 * Determines whether a case requires a payment to be made.
 * Negation of `isCasePaymentComplete`: any incomplete/missing/unknown status
 * requires payment.
 */
export function caseRequiresPayment(caseData: { payment_status?: string } | null | undefined): boolean {
  return !isCasePaymentComplete(caseData);
}

/**
 * Formats a number as VND with comma thousands separator (e.g. 100,000 VND).
 */
export function formatPrice(price: number): string {
  if (price === 0) return "Miễn phí";
  const num = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(price);
  return `${num} VND`;
}

/**
 * Validates a file for payment proof upload (receipt).
 * Displays a Mantine notification if validation fails.
 * Returns true if valid, false otherwise.
 */
export function validatePaymentProof(file: File): boolean {
  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    notifications.show({
      title: "Kích thước file quá lớn",
      message: "Kích thước file vượt quá 5MB. Vui lòng chọn file nhỏ hơn.",
      color: "red",
    });
    return false;
  }
  
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (!allowedTypes.includes(file.type)) {
    notifications.show({
      title: "Định dạng không hợp lệ",
      message: "Chỉ chấp nhận định dạng ảnh (JPG, PNG, WEBP, HEIC/HEIF).",
      color: "red",
    });
    return false;
  }
  
  return true;
}
