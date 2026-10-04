export interface CreateOrderItem {
  service_type: string;
  quantity: number;
  unit_price?: number;
  metadata_json?: Record<string, unknown>;
}

export interface CreateOrderRequest {
  items: CreateOrderItem[];
  idempotency_key?: string;
}

export type OrderStatus = "pending" | "paid" | "refunded" | "cancelled";

export const CREDIT_AUDIT_SERVICE = "credit_audit";
/** Mua credit cho đánh giá lần 2+ — listener sẽ KHÔNG auto-trigger, user tự trigger từ UI */
export const CREDIT_AUDIT_MANUAL_SERVICE = "credit_audit_manual";
/** Tất cả service_type thuộc nhóm credit audit */
export const ALL_CREDIT_AUDIT_SERVICES = [CREDIT_AUDIT_SERVICE, CREDIT_AUDIT_MANUAL_SERVICE] as const;
