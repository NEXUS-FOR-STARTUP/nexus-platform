import { AppError } from "../../../shared/domain/app-error.js";
import { findOrderById } from "../infrastructure/persistence/order.repository.js";
import type { GetOrderResponse } from "./orders.dto.js";

export async function getOrderUseCase(
  userId: string,
  orderId: string,
): Promise<GetOrderResponse> {
  const order = await findOrderById(orderId);
  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Không tìm thấy đơn hàng");
  }

  if (order.user_id !== userId) {
    throw new AppError(403, "FORBIDDEN", "Bạn không có quyền xem đơn hàng này");
  }

  return {
    id: order.id,
    user_id: order.user_id,
    total_amount: order.total_amount,
    currency: order.currency,
    status: order.status,
    wallet_transaction_id: order.wallet_transaction_id,
    items: order.items.map((i) => ({
      id: i.id,
      service_type: i.service_type,
      quantity: i.quantity,
      unit_price: i.unit_price,
      amount: i.amount,
      metadata_json: i.metadata_json,
    })),
    metadata_json: order.metadata_json,
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString(),
  };
}
