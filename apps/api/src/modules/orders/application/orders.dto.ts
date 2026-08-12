export interface CreateOrderResponse {
  orderId: string;
  totalAmount: number;
  status: string;
  paidAt: string | null;
}

export interface OrderItemDto {
  id: string;
  service_type: string;
  quantity: number;
  unit_price: number;
  amount: number;
  metadata_json: unknown | null;
}

export interface GetOrderResponse {
  id: string;
  user_id: string;
  total_amount: number;
  currency: string;
  status: string;
  wallet_transaction_id: string | null;
  items: OrderItemDto[];
  metadata_json: unknown | null;
  created_at: string;
  updated_at: string;
}

export interface OrderHistoryItem {
  id: string;
  total_amount: number;
  status: string;
  service_types: string[];
  created_at: string;
}

export interface ListOrdersResponse {
  orders: OrderHistoryItem[];
}
