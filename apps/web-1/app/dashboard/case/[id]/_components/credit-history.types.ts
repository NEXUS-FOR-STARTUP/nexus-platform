export type CreditEntryType = "purchase" | "consumption" | "refund";

export interface CreditEntry {
  id: string;
  amount: number;
  balance_after: number;
  type: CreditEntryType;
  reference_type?: string | null;
  reference_id: string | null;
  created_at: string;
  service_type_code?: string | null;
}

export const CREDIT_TYPE_LABELS: Readonly<Record<CreditEntryType, string>> = {
  purchase: "Mua lượt",
  consumption: "Dùng lượt",
  refund: "Hoàn lượt",
};

export const ORDER_REFERENCE_TYPE = "order";

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTimeFull(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** "+2 lượt" / "-1 lượt"; sign follows amount, not type. */
export function formatCreditDelta(amount: number): string {
  return `${amount > 0 ? "+" : amount < 0 ? "-" : ""}${Math.abs(amount)} lượt`;
}
