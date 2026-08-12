import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import { walletService } from "../../wallet/application/wallet.service.js";
import { insertOutboxEvent } from "../../../shared/infrastructure/persistence/outbox.repository.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { CREDIT_AUDIT_SERVICE } from "../domain/order.types.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { CreateOrderItem, CreateOrderRequest } from "../domain/order.types.js";
import type { CreateOrderResponse } from "./orders.dto.js";
import { prisma } from "../../../db.js";
import type { Prisma } from "@prisma/client";

function generateOrderIdempotencyKey(userId: string, items: CreateOrderItem[]): string {
  const parts = items
    .map((i) => `${i.service_type}:${i.quantity}:${(i.metadata_json as any)?.case_id ?? ""}`)
    .sort()
    .join(",");
  return `order-${userId}-${crypto.createHash("sha256").update(parts).digest("hex").slice(0, 12)}`;
}

async function resolveCreditAuditPrice(caseId: string): Promise<number> {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: { package_id: true },
  });
  if (!caseRecord?.package_id) {
    throw new AppError(400, "INVALID_PACKAGE", "Dự án chưa có gói dịch vụ hợp lệ");
  }
  const pkg = await prisma.servicePackage.findUnique({
    where: { id: caseRecord.package_id },
    include: { pricing_tiers: { where: { is_current: true }, take: 1 } },
  });
  if (!pkg) {
    throw new AppError(404, "PACKAGE_NOT_FOUND", "Không tìm thấy gói dịch vụ");
  }
  const price = pkg.pricing_tiers[0]?.price ?? pkg.price;
  if (!price || price <= 0) {
    throw new AppError(400, "INVALID_PRICE", "Gói dịch vụ chưa có giá");
  }
  return price;
}

async function getCreditBalanceInTx(tx: Prisma.TransactionClient, caseId: string): Promise<number> {
  const result = await tx.creditLedger.aggregate({
    where: { case_id: caseId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

export async function createOrderUseCase(
  userId: string,
  request: CreateOrderRequest,
): Promise<CreateOrderResponse> {
  if (!request.items || request.items.length === 0) {
    throw new AppError(400, "INVALID_ORDER", "Đơn hàng phải có ít nhất 1 sản phẩm");
  }

  const resolvedItems: { item: CreateOrderItem; unitPrice: number }[] = [];
  for (const item of request.items) {
    if (item.quantity <= 0 || item.quantity > 50) {
      throw new AppError(400, "INVALID_QUANTITY", "Số lượng không hợp lệ (1-50)");
    }
    if (item.service_type === CREDIT_AUDIT_SERVICE) {
      const caseId = (item.metadata_json as Record<string, unknown> | undefined)?.["case_id"];
      if (typeof caseId !== "string" || !caseId) {
        throw new AppError(400, "INVALID_ORDER", "Thiếu case_id cho credit_audit");
      }
      const unitPrice = await resolveCreditAuditPrice(caseId);
      resolvedItems.push({ item, unitPrice });
    } else {
      throw new AppError(400, "INVALID_SERVICE", `Chưa hỗ trợ service_type: ${item.service_type}`);
    }
  }

  const totalAmount = resolvedItems.reduce(
    (sum, { item, unitPrice }) => sum + item.quantity * unitPrice,
    0,
  );
  const idempotencyKey = request.idempotency_key ?? generateOrderIdempotencyKey(userId, request.items);

  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          user_id: userId,
          total_amount: totalAmount,
          status: "pending",
          idempotency_key: idempotencyKey,
          metadata_json: {} as any,
          items: {
            create: resolvedItems.map(({ item, unitPrice }) => ({
              service_type: item.service_type,
              quantity: item.quantity,
              unit_price: unitPrice,
              amount: item.quantity * unitPrice,
              metadata_json: (item.metadata_json ?? {}) as any,
            })),
          },
        },
        include: { items: true },
      });

      await walletService.withdraw(userId, totalAmount, idempotencyKey, {
        referenceType: "order",
        referenceId: order.id,
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          wallet_transaction_id: order.id,
        },
      });

      for (const { item, unitPrice } of resolvedItems) {
        if (item.service_type !== CREDIT_AUDIT_SERVICE) continue;
        const caseId = (item.metadata_json as Record<string, unknown>)["case_id"] as string;
        const currentBalance = await getCreditBalanceInTx(tx, caseId);

        await tx.creditLedger.create({
          data: {
            case_id: caseId,
            amount: item.quantity,
            balance_after: currentBalance + item.quantity,
            type: "purchase",
            reference_type: "order",
            reference_id: order.id,
            idempotency_key: `credit-purchase-${order.id}-${item.service_type}-${caseId}`,
            metadata_json: { order_id: order.id, quantity: item.quantity, unit_price: unitPrice },
          },
        });
      }

      await insertOutboxEvent(tx, {
        event_type: DOMAIN_EVENTS.ORDER_PAID,
        payload_json: {
          orderId: order.id,
          userId,
          totalAmount,
          totalCredits: resolvedItems.reduce((sum, { item }) => sum + item.quantity, 0),
          items: request.items.map((i) => ({
            service_type: i.service_type,
            quantity: i.quantity,
          })),
        },
      });

      logger.info({ orderId: order.id, userId, totalAmount, items: request.items.length }, "order created and paid");

      return {
        orderId: order.id,
        totalAmount,
        status: "paid",
        paidAt: new Date().toISOString(),
      };
    });
  } catch (error) {
    if ((error as any)?.code === "P2002") {
      const existing = await prisma.order.findUnique({ where: { idempotency_key: idempotencyKey } });
      if (existing) {
        if (existing.user_id !== userId) {
          throw new AppError(409, "IDEMPOTENCY_CONFLICT", "Mã giao dịch đã tồn tại cho user khác");
        }
        return {
          orderId: existing.id,
          totalAmount: existing.total_amount,
          status: existing.status,
          paidAt: existing.updated_at.toISOString() ?? null,
        };
      }
    }
    if (error instanceof AppError) throw error;
    logger.error({ err: error, userId, totalAmount }, "order creation failed");
    throw new AppError(500, "ORDER_FAILED", "Tạo đơn hàng thất bại, vui lòng thử lại");
  }
}
