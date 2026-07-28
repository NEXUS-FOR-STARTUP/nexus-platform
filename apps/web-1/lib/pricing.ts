import { notifications } from "@mantine/notifications";

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
 * Determines whether a case requires a payment to be made.
 * Checks the case-level payment status.
 */
export function caseRequiresPayment(caseData: { payment_status?: string }): boolean {
  return caseData.payment_status === "unpaid" || caseData.payment_status === "pending_verification" || caseData.payment_status === "rejected";
}

/**
 * Formats a number as VND (e.g. 100.000 VND).
 */
export function formatPrice(price: number): string {
  if (price === 0) return "Miễn phí";
  const num = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(price);
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
