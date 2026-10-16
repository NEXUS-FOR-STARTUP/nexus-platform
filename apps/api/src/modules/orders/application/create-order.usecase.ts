import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { CreateOrderRequest } from "../domain/order.types.js";
import type { CreateOrderResponse } from "./orders.dto.js";
import { prisma } from "../../../db.js";
import { createOrderInTx } from "./order-in-tx.js";
import { prepareOrder } from "./order-prepare.js";

export async function createOrderUseCase(
  userId: string,
  request: CreateOrderRequest,
): Promise<CreateOrderResponse> {
  const prepared = await prepareOrder(userId, request);
  const { idempotencyKey, totalAmount } = prepared;

  try {
    return await prisma.$transaction(async (tx) => {
      const { grantTxId: _grantTxId, ...response } = await createOrderInTx(tx, userId, prepared);
      return response;
    });
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "P2002") {
      const existing = await prisma.order.findUnique({ where: { idempotency_key: idempotencyKey } });
      if (existing) {
        if (existing.status === "paid") {
          throw new AppError(409, "ORDER_ALREADY_PAID", "Bạn đã mua gói này rồi. Không thể mua trùng.");
        }
        // Retry an unpaid order → return existing (idempotent resume)
        return {
          orderId: existing.id,
          totalAmount: existing.total_amount,
          status: existing.status,
          paidAt: existing.updated_at.toISOString() ?? null,
          totalCredits: 0,
        };
      }
    }
    if (error instanceof AppError) throw error;
    logger.error({ err: error, userId, totalAmount }, "order creation failed");
    throw new AppError(500, "ORDER_FAILED", "Tạo đơn hàng thất bại, vui lòng thử lại");
  }
}
