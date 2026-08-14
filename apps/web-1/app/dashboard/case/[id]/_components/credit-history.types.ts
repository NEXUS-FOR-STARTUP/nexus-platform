import type { Order } from "@/types/payment";

export interface CreditEntry {
  id: string;
  amount: number;
  balance_after: number;
  type: "purchase" | "consumption" | "refund";
  reference_id: string | null;
  created_at: string;
}

export interface CreditTransactionHistoryProps {
  entries?: CreditEntry[];
  orders?: Order[];
  pricePerCredit?: number;
  isLoading?: boolean;
}

export type DateFilter = "all" | "today" | "7days" | "30days";
export type TypeFilter = "all" | "purchase" | "consumption" | "refund" | "order";

export type SortField = "created_at" | "amount";
export type SortOrder = "asc" | "desc";

export interface SortState {
  field: SortField;
  order: SortOrder;
}

export interface UnifiedTransactionItem {
  id: string;
  timestamp: number;
  created_at: string;
  date: string;
  time: string;
  typeKey: TypeFilter;
  typeLabel: string;
  badgeColor: string;
  description: string;
  subDescription?: string;
  amountValue: number;
  amountDisplay: {
    text: string;
    colorClass: string;
  };
  balanceAfterDisplay: string;
  statusLabel: string;
  statusColor: string;
}

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

function getOrderItemSummary(order: Order): string {
  if (!order.items || order.items.length === 0) return "Mua credit";
  return order.items
    .map((item) => `${item.service_type === "credit_audit" ? "Credit" : item.service_type} x${item.quantity}`)
    .join(", ");
}

export function transformToUnifiedItems(
  entries?: CreditEntry[],
  orders?: Order[]
): UnifiedTransactionItem[] {
  const items: UnifiedTransactionItem[] = [];

  (orders || []).forEach((order) => {
    const { date, time } = formatDateTime(order.created_at);
    const timestamp = new Date(order.created_at).getTime();
    const isPaid = order.status === "paid";
    const isPending = order.status === "pending";

    let statusLabel = "Chờ thanh toán";
    let statusColor = "yellow";

    if (isPaid) {
      statusLabel = "Đã thanh toán";
      statusColor = "green";
    } else if (order.status === "cancelled") {
      statusLabel = "Đã hủy";
      statusColor = "red";
    } else if (order.status === "refunded") {
      statusLabel = "Đã hoàn tiền";
      statusColor = "orange";
    }

    items.push({
      id: `order-${order.id}`,
      timestamp,
      created_at: order.created_at,
      date,
      time,
      typeKey: "order",
      typeLabel: "Đơn mua",
      badgeColor: isPaid ? "teal" : isPending ? "yellow" : "gray",
      description: getOrderItemSummary(order),
      subDescription: `Mã đơn hàng: #${order.id.slice(0, 8).toUpperCase()}`,
      amountValue: order.total_amount,
      amountDisplay: {
        text: formatVND(order.total_amount),
        colorClass: "text-text-app",
      },
      balanceAfterDisplay: "—",
      statusLabel,
      statusColor,
    });
  });

  (entries || []).forEach((entry) => {
    const { date, time } = formatDateTime(entry.created_at);
    const timestamp = new Date(entry.created_at).getTime();
    const isConsumption = entry.type === "consumption" || entry.amount < 0;

    let typeKey: TypeFilter = "purchase";
    let typeLabel = "Nạp credit";
    let badgeColor = "green";
    let description = "Cộng credit vào số dư";
    let statusLabel = "Thành công";
    let statusColor = "green";

    if (isConsumption) {
      typeKey = "consumption";
      typeLabel = "Trừ credit";
      badgeColor = "red";
      description = "Sử dụng cho lượt đánh giá case";
      statusLabel = "Thành công";
      statusColor = "green";
    } else if (entry.type === "refund") {
      typeKey = "refund";
      typeLabel = "Hoàn credit";
      badgeColor = "orange";
      description = "Hoàn trả credit đánh giá";
      statusLabel = "Thành công";
      statusColor = "green";
    }

    const absAmount = Math.abs(entry.amount);
    const amountText = isConsumption ? `-${absAmount} credit` : `+${absAmount} credit`;
    const colorClass = isConsumption
      ? "text-red-600 dark:text-red-400"
      : "text-emerald-600 dark:text-emerald-400";

    items.push({
      id: `ledger-${entry.id}`,
      timestamp,
      created_at: entry.created_at,
      date,
      time,
      typeKey,
      typeLabel,
      badgeColor,
      description,
      subDescription: entry.reference_id ? `Mã tham chiếu: ${entry.reference_id}` : undefined,
      amountValue: isConsumption ? -absAmount : absAmount,
      amountDisplay: {
        text: amountText,
        colorClass,
      },
      balanceAfterDisplay: `${entry.balance_after} credit`,
      statusLabel,
      statusColor,
    });
  });

  return items;
}
