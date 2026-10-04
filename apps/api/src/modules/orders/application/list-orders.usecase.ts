import { findOrdersByUser, countOrdersByUser } from "../infrastructure/persistence/order.repository.js";
import type { ListOrdersResponse, OrderHistoryItem } from "./orders.dto.js";

export async function listOrdersUseCase(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<ListOrdersResponse> {
  const [orders] = await Promise.all([
    findOrdersByUser(userId, limit, offset),
    countOrdersByUser(userId),
  ]);

  const items: OrderHistoryItem[] = orders.map((o) => ({
    id: o.id,
    total_amount: o.total_amount,
    status: o.status,
    service_types: o.items.map((i) => i.service_type),
    created_at: o.created_at.toISOString(),
  }));

  return { orders: items };
}
