import { AppError } from "../../../shared/domain/app-error.js";
import { walletService } from "../../wallet/application/wallet.service.js";
import { insertOutboxEvent } from "../../../shared/infrastructure/persistence/outbox.repository.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { ALL_CREDIT_AUDIT_SERVICES, CREDIT_AUDIT_SERVICE } from "../domain/order.types.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { CreateOrderItem, CreateOrderRequest } from "../domain/order.types.js";
import type { CreateOrderResponse } from "./orders.dto.js";
import { transitionInTx } from "../../../services/case-transition.service.js";
import { prisma } from "../../../db.js";
import {
  resolveCreditAuditPrice,
  getCreditBalanceInTx,
  applyPaidCreditCaseUpdate,
  generateOrderIdempotencyKey,
  AUDIT_PACKAGE_KEY,
  FREE_PACKAGE_KEY,
} from "./credit-audit-order.helpers.js";

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
    if ((ALL_CREDIT_AUDIT_SERVICES as readonly string[]).includes(item.service_type)) {
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

      if (process.env["DUAL_WRITE_PAYMENT"] === "true") {
        const creditItem = request.items.find((i) => (ALL_CREDIT_AUDIT_SERVICES as readonly string[]).includes(i.service_type));
        if (creditItem?.metadata_json?.["case_id"]) {
          await tx.payment.create({
            data: {
              case_id: creditItem.metadata_json["case_id"] as string,
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
      }

      await walletService.withdraw(userId, totalAmount, idempotencyKey, {
        referenceType: "order",
        referenceId: order.id,
      }, tx);

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          wallet_transaction_id: order.id,
        },
      });

      const grantedByItem: number[] = [];
      for (const { item, unitPrice } of resolvedItems) {
        if (!(ALL_CREDIT_AUDIT_SERVICES as readonly string[]).includes(item.service_type)) continue;
        const caseId = (item.metadata_json as Record<string, unknown>)["case_id"] as string;
        const currentBalance = await getCreditBalanceInTx(tx, caseId);

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

        // Resolve credits granted from package features (default to item.quantity for backward compat).
        // BUG FIX: Case free (pkg_tf_free) sẽ được upgrade lên pkg_ai_audit sau khi thanh toán.
        // Phải đọc credits_granted từ AUDIT_PACKAGE_KEY (package đích) chứ không phải pkg_tf_free
        // vì pkg_tf_free không có credits_granted = 2 → sẽ grant sai 1 credit thay vì 2.
        let creditsGranted = item.quantity;
        const isFreeCase =
          caseRecord.package_id === FREE_PACKAGE_KEY || caseRecord.locked_price === 0;
        const effectivePackageId = isFreeCase ? AUDIT_PACKAGE_KEY : (caseRecord.package_id ?? AUDIT_PACKAGE_KEY);
        if (effectivePackageId && (tx as any).servicePackage?.findUnique) {
          const pkg = await tx.servicePackage.findUnique({ where: { id: effectivePackageId } });
          const features = pkg?.features as Record<string, unknown> | undefined;
          if (features && typeof features === "object" && typeof features["credits_granted"] === "number") {
            creditsGranted = features["credits_granted"] * item.quantity;
          } else if (effectivePackageId === "pkg_ai_audit" || effectivePackageId === "pkg_tf_audit" || unitPrice === 79000) {
            creditsGranted = 2 * item.quantity;
          }
        } else if (unitPrice === 79000) {
          creditsGranted = 2 * item.quantity;
        }
        grantedByItem.push(creditsGranted);
        const pricePerCredit = creditsGranted > 0
          ? Math.round((unitPrice * item.quantity) / creditsGranted)
          : unitPrice;

        await tx.creditLedger.create({
          data: {
            case_id: caseId,
            amount: creditsGranted,
            balance_after: currentBalance + creditsGranted,
            type: "purchase",
            reference_type: "order",
            reference_id: order.id,
            idempotency_key: `credit-purchase-${order.id}-${item.service_type}-${caseId}`,
            metadata_json: {
              order_id: order.id,
              quantity: item.quantity,
              unit_price: pricePerCredit,
              package_unit_price: unitPrice,
              price_per_credit: pricePerCredit,
              credits_granted: creditsGranted,
            },
          },
        });

        await applyPaidCreditCaseUpdate(tx, {
          caseId,
          userId,
          unitPrice,
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

      const creditAuditItem = resolvedItems.find((i) =>
        (ALL_CREDIT_AUDIT_SERVICES as readonly string[]).includes(i.item.service_type)
      );
      const caseIdFromMeta =
        creditAuditItem?.item.metadata_json &&
        typeof creditAuditItem.item.metadata_json === "object" &&
        "case_id" in creditAuditItem.item.metadata_json &&
        typeof (creditAuditItem.item.metadata_json as Record<string, unknown>).case_id === "string"
          ? ((creditAuditItem.item.metadata_json as Record<string, unknown>).case_id as string)
          : undefined;
      // serviceType dùng để listener phân biệt auto-trigger vs manual
      const serviceType = creditAuditItem?.item.service_type ?? CREDIT_AUDIT_SERVICE;

      await insertOutboxEvent(tx, {
        event_type: DOMAIN_EVENTS.ORDER_PAID,
        payload_json: {
          orderId: order.id,
          userId,
          caseId: caseIdFromMeta,
          serviceType,
          totalAmount,
          totalCredits: grantedByItem.reduce((sum, g) => sum + g, 0),
          items: request.items.map((i) => ({
            service_type: i.service_type,
            quantity: i.quantity,
            metadata_json: i.metadata_json,
          })),
        },
      });

      logger.info({ orderId: order.id, userId, totalAmount, items: request.items.length }, "order created and paid");

      const totalCredits = grantedByItem.reduce((sum, g) => sum + g, 0);
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
