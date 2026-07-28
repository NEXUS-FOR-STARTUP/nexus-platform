// Allowed file extensions for payment proof uploads
export const ALLOWED_PROOF_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"] as const;

// Max file size for payment proof uploads (5 MB)
export const MAX_PROOF_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Valid final decisions for verifying a payment
export const VALID_PAYMENT_DECISIONS = ["paid", "rejected"] as const;

export type PaymentDecision = (typeof VALID_PAYMENT_DECISIONS)[number];

export function isValidPaymentDecision(status: unknown): status is PaymentDecision {
  return (
    typeof status === "string" &&
    (VALID_PAYMENT_DECISIONS as readonly string[]).includes(status)
  );
}

export function normalizePaymentStatus(status: string): string {
  return status === "verified" ? "paid" : status;
}

export function isFinalPaymentStatus(status?: string | null): boolean {
  return status === "paid" || status === "verified" || status === "rejected";
}
