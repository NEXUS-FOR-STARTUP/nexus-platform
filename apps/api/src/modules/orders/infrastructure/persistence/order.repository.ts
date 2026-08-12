import { prisma } from "../../../../db.js";

export async function createOrder(data: {
  userId: string;
  totalAmount: number;
  idempotencyKey: string;
  items: { service_type: string; quantity: number; unit_price: number; amount: number; metadata_json?: unknown }[];
  metadataJson?: Record<string, unknown>;
}) {
  return prisma.order.create({
    data: {
      user_id: data.userId,
      total_amount: data.totalAmount,
      status: "pending",
      idempotency_key: data.idempotencyKey,
      metadata_json: data.metadataJson as any,
      items: {
        create: data.items.map((item) => ({
          service_type: item.service_type,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          metadata_json: item.metadata_json as any,
        })),
      },
    },
    include: { items: true },
  });
}

export async function findOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
}

export async function findOrdersByUser(userId: string, limit = 20, offset = 0) {
  return prisma.order.findMany({
    where: { user_id: userId },
    include: { items: { select: { service_type: true } } },
    orderBy: { created_at: "desc" },
    take: limit,
    skip: offset,
  });
}

export async function countOrdersByUser(userId: string): Promise<number> {
  return prisma.order.count({ where: { user_id: userId } });
}
