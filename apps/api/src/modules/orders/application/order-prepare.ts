import { AppError } from "../../../shared/domain/app-error.js";
import type { CreateOrderItem, CreateOrderRequest } from "../domain/order.types.js";
import {
  resolveOrderPackage,
  generateOrderIdempotencyKey,
  type OrderPackage,
} from "./credit-audit-order.helpers.js";
import { applyPercentOff, resolveDiscountCode, type ResolvedDiscount } from "./discount.helpers.js";

const MAX_ORDER_ITEM_QUANTITY = 50;

export interface ResolvedOrderItem {
  item: CreateOrderItem;
  caseId: string;
  pkg: OrderPackage;
  /** Price per package after the discount code (equals pkg.unitPrice when none applies). */
  unitPrice: number;
}

export interface PreparedOrder {
  resolvedItems: ResolvedOrderItem[];
  discount: ResolvedDiscount | null;
  totalAmount: number;
  listTotal: number;
  idempotencyKey: string;
}

/** Validation and price resolution. Reads only; safe to run before opening a transaction. */
export async function prepareOrder(userId: string, request: CreateOrderRequest): Promise<PreparedOrder> {
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
  return { resolvedItems, discount, totalAmount, listTotal, idempotencyKey };
}
