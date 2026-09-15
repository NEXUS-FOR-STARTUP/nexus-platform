const STORAGE_PREFIX = "buyCreditAfterDeposit:";

export interface BuyCreditAfterDepositIntent {
  caseId: string;
  quantity: number;
  orderIdempotencyKey: string;
  /** "credit_audit" = auto-trigger sau khi mua. "credit_audit_manual" = user tự trigger từ UI. Default: "credit_audit" */
  serviceType?: "credit_audit" | "credit_audit_manual";
}

function getKey(depositId: string): string {
  return `${STORAGE_PREFIX}${depositId}`;
}

export function saveBuyCreditAfterDepositIntent(
  depositId: string,
  intent: BuyCreditAfterDepositIntent,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(getKey(depositId), JSON.stringify(intent));
  } catch {
    // sessionStorage quota or security restriction: ignore
  }
}

export function clearBuyCreditAfterDepositIntent(depositId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(getKey(depositId));
  } catch {
    // ignore
  }
}

export function readBuyCreditAfterDepositIntent(
  depositId: string,
): BuyCreditAfterDepositIntent | null {
  if (typeof window === "undefined" || !depositId) return null;
  const key = getKey(depositId);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<BuyCreditAfterDepositIntent>;
    const isValidQuantity =
      typeof parsed?.quantity === "number" &&
      Number.isInteger(parsed.quantity) &&
      parsed.quantity >= 1 &&
      parsed.quantity <= 50;
    const isValidCaseId = typeof parsed?.caseId === "string" && parsed.caseId.trim().length > 0;
    const isValidKey =
      typeof parsed?.orderIdempotencyKey === "string" &&
      parsed.orderIdempotencyKey.trim().length > 0;

    if (!isValidQuantity || !isValidCaseId || !isValidKey) {
      clearBuyCreditAfterDepositIntent(depositId);
      return null;
    }

    return {
      caseId: parsed.caseId!,
      quantity: parsed.quantity!,
      orderIdempotencyKey: parsed.orderIdempotencyKey!,
    };
  } catch {
    clearBuyCreditAfterDepositIntent(depositId);
    return null;
  }
}

export function clearAllBuyCreditAfterDepositIntents(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
