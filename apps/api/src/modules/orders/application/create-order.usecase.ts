import { AppError } from "../../../shared/domain/app-error.js";
import { walletService } from "../../wallet/application/wallet.service.js";
import { insertOutboxEvent } from "../../../shared/infrastructure/persistence/outbox.repository.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { CreateOrderItem, CreateOrderRequest } from "../domain/order.types.js";
import type { CreateOrderResponse } from "./orders.dto.js";
import { transitionInTx } from "../../../services/case-transition.service.js";
import { prisma } from "../../../db.js";
import {
  CP1_AUDIT_SERVICE_CODE,
  getCreditBalance,
} from "../../cases/infrastructure/persistence/credit-ledger.repository.js";
import {
  resolveOrderPackage,
  applyPaidCreditCaseUpdate,
  generateOrderIdempotencyKey,
  type OrderPackage,
} from "./credit-audit-order.helpers.js";
import {
  applyPercentOff,
  redeemDiscountInTx,
  resolveDiscountCode,
  type ResolvedDiscount,
} from "./discount.helpers.js";

const MAX_ORDER_ITEM_QUANTITY = 50;

interface ResolvedOrderItem {
  item: CreateOrderItem;
  caseId: string;
  pkg: OrderPackage;
  /** Price per package after the discount code (equals pkg.unitPrice when none applies). */
  unitPrice: number;
}

export async function createOrderUseCase(
  userId: string,
  request: CreateOrderRequest,
): Promise<CreateOrderResponse> {
  if (!request.items || request.items.length === 0) {
    throw new AppError(400, "INVALID_ORDER", "Đơn hàng phải có ít nhất 1 sản phẩm");
  }

  const resolvedItems: ResolvedOrderItem[] = [];
  for (const item of request.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > MAX_ORDER_ITEM_QUANTITY) {
      throw new AppError(400, "INVALID_QUANTITY", `Số lượng không hợp lệ (1-${MAX_ORDER_ITEM_QUANTITY})`);
    }
    if (typeof item.package_id !== "string" || !item.package_id) {
      throw new AppError(400, "INVALID_ORDER", "Thiếu package_id");
    }
    const caseId = item.metadata_json?.["case_id"];
    if (typeof caseId !== "string" || !caseId) {
      throw new AppError(400, "INVALID_ORDER", "Thiếu case_id cho đơn mua lượt");
    }
    resolvedItems.push({ item, caseId, pkg: await resolveOrderPackage(item.package_id), unitPrice: 0 });
  }

  let discount: ResolvedDiscount | null = null;
  if (request.discount_code !== undefined && typeof request.discount_code !== "string") {
    throw new AppError(400, "DISCOUNT_INVALID", "Mã giảm giá không hợp lệ hoặc đã hết hạn");
  }
  if (request.discount_code?.trim()) {
    discount = await resolveDiscountCode(
      request.discount_code,
      userId,
      resolvedItems.map(({ pkg }) => pkg.serviceTypeId),
    );
  }
  for (const resolved of resolvedItems) {
    resolved.unitPrice =
      discount && resolved.pkg.serviceTypeId === discount.serviceTypeId
        ? applyPercentOff(resolved.pkg.unitPrice, discount.percentOff)
        : resolved.pkg.unitPrice;
  }

  const totalAmount = resolvedItems.reduce((sum, { item, unitPrice }) => sum + item.quantity * unitPrice, 0);
  const listTotal = resolvedItems.reduce((sum, { item, pkg }) => sum + item.quantity * pkg.unitPrice, 0);
  const idempotencyKey = request.idempotency_key ?? generateOrderIdempotencyKey(userId, request.items);

  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          user_id: userId,
          total_amount: totalAmount,
          status: "pending",
          idempotency_key: idempotencyKey,
          metadata_json: discount
            ? { list_price: listTotal, discount_code: discount.code, percent_off: discount.percentOff }
            : {},
          items: {
            create: resolvedItems.map(({ item, pkg, unitPrice }) => ({
              service_type: pkg.serviceTypeCode,
              package_id: pkg.id,
              quantity: item.quantity,
              unit_price: unitPrice,
              amount: item.quantity * unitPrice,
              metadata_json: (item.metadata_json ?? {}) as any,
            })),
          },
        },
        include: { items: true },
      });

      if (process.env["DUAL_WRITE_PAYMENT"] === "true") {
        await tx.payment.create({
          data: {
            case_id: resolvedItems[0]!.caseId,
            amount: totalAmount,
            status: "paid",
            verified_by_auth_user_id: "system",
            verification_source: "auto",
            verified_at: new Date(),
            type: "deposit",
            transfer_content: idempotencyKey,
            currency: "VND",
          },
        });
      }

      if (discount) {
        await redeemDiscountInTx(tx, {
          discountId: discount.id,
          userId,
          orderId: order.id,
          limited: discount.limited,
        });
      }

      // A fully discounted order moves no money: skip the wallet but still mark it paid.
      if (totalAmount > 0) {
        await walletService.withdraw(userId, totalAmount, idempotencyKey, {
          referenceType: "order",
          referenceId: order.id,
        }, tx);
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          wallet_transaction_id: totalAmount > 0 ? order.id : null,
        },
      });

      let totalCredits = 0;
      for (const { item, caseId, pkg, unitPrice } of resolvedItems) {
        const caseRecord = await tx.case.findUnique({
          where: { id: caseId },
          select: {
            owner_auth_user_id: true,
            internal_status: true,
            package_id: true,
            locked_price: true,
          },
        });
        if (!caseRecord) {
          throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án liên quan đến đơn hàng");
        }
        if (caseRecord.owner_auth_user_id !== userId) {
          throw new AppError(403, "FORBIDDEN", "Không thể mua credit cho dự án của người khác");
        }

        const creditsGranted = pkg.creditsGranted * item.quantity;
        totalCredits += creditsGranted;
        const currentBalance = await getCreditBalance(tx, caseId, pkg.serviceTypeId);
        const paidForPackage = unitPrice * item.quantity;
        const pricePerCredit = Math.round(paidForPackage / creditsGranted);

        await tx.creditLedger.create({
          data: {
            case_id: caseId,
            service_type_id: pkg.serviceTypeId,
            amount: creditsGranted,
            balance_after: currentBalance + creditsGranted,
            type: "purchase",
            reference_type: "order",
            reference_id: order.id,
            idempotency_key: `credit-purchase-${order.id}-${pkg.id}-${caseId}`,
            metadata_json: {
              order_id: order.id,
              package_id: pkg.id,
              quantity: item.quantity,
              unit_price: pricePerCredit,
              package_unit_price: pkg.unitPrice,
              price_per_credit: pricePerCredit,
              credits_granted: creditsGranted,
            },
          },
        });

        // Only CP1 purchases touch the CP1 case (payment status, free-case upgrade, reopen).
        if (pkg.serviceTypeCode !== CP1_AUDIT_SERVICE_CODE) continue;

        await applyPaidCreditCaseUpdate(tx, {
          caseId,
          userId,
          unitPrice: pkg.unitPrice,
          packageId: pkg.id,
          caseRecord,
        });

        if (caseRecord.internal_status === "done") {
          await transitionInTx(tx, {
            transition: "T19_REOPEN",
            caseId,
            actorId: userId,
            roleVerified: "CUSTOMER",
            data: {},
          });
        }
      }

      const first = resolvedItems[0]!;
      await insertOutboxEvent(tx, {
        event_type: DOMAIN_EVENTS.ORDER_PAID,
        payload_json: {
          orderId: order.id,
          userId,
          caseId: first.caseId,
          // Listener auto-triggers the audit only for CP1 purchases that are not manual.
          serviceTypeCode: first.pkg.serviceTypeCode,
          manualTrigger: first.item.manual_trigger === true,
          totalAmount,
          totalCredits,
          items: resolvedItems.map(({ item, pkg }) => ({
            package_id: pkg.id,
            service_type: pkg.serviceTypeCode,
            quantity: item.quantity,
            metadata_json: item.metadata_json,
          })),
        },
      });

      logger.info({ orderId: order.id, userId, totalAmount, items: request.items.length }, "order created and paid");

      return {
        orderId: order.id,
        totalAmount,
        status: "paid",
        paidAt: new Date().toISOString(),
        totalCredits,
      };
    });
  } catch (error) {
    if ((error as any)?.code === "P2002") {
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
