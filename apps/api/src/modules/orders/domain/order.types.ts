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
