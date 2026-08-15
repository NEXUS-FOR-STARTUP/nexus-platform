export interface WalletTransactionItem {
  id: string;
  wallet_id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  source_type: string;
  source_id: string | null;
  source_description?: string;
  created_at: string;
}

export type SortField = "created_at" | "amount";
export type SortOrder = "asc" | "desc";

export interface SortState {
  field: SortField;
  order: SortOrder;
}

export type QuickFilterTab = "all" | "deposit" | "withdrawal" | "refund";

export const TYPE_LABELS: Record<string, string> = {
  deposit: "Nạp tiền",
  withdrawal: "Trừ ví",
  refund: "Hoàn tiền",
  adjustment: "Điều chỉnh",
  migration: "Chuyển đổi",
  service_payment: "Mua dịch vụ",
};

export const TYPE_COLORS: Record<string, string> = {
  deposit: "green",
  withdrawal: "red",
  refund: "blue",
  adjustment: "orange",
  migration: "orange",
  service_payment: "orange",
};

export const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function formatVND(amount: number): string {
  return `${amount.toLocaleString("vi-VN")} VND`;
}

export function formatDateTime(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}
