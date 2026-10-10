export interface CreateOrderItem {
  package_id: string;
  quantity: number;
  /** true = mua lượt cho đánh giá lần 2+: listener ORDER_PAID KHÔNG auto-trigger, user tự bấm từ UI */
  manual_trigger?: boolean;
  metadata_json?: Record<string, unknown>;
}

export interface CreateOrderRequest {
  items: CreateOrderItem[];
  idempotency_key?: string;
}

export type OrderStatus = "pending" | "paid" | "refunded" | "cancelled";
