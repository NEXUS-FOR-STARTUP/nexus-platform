# Phase 03: Order Module (New)

**Status:** pending | **Effort:** 2.5h | **Depends:** Phase 01, Phase 02 | **Blocked by:** —

## Overview

New `orders` module — cầu nối wallet ↔ service. User has wallet balance → creates order with `order_items` → wallet deducted → `credit_ledger` funded → service can consume credits.

Replaces: direct `Payment → CreditLedger` purchase path. Old path stays for backward compat.

## Task Breakdown

### T03.1: Domain types

**File:** `apps/api/src/modules/orders/domain/order.types.ts` (NEW)

```typescript
export interface CreateOrderItem {
  service_type: string;    // "credit_audit" | ...
  quantity: number;
  unit_price?: number;     // IGNORED server-side (GAP-4) — price resolved từ service package
  metadata_json?: Record<string, unknown>;  // credit_audit BẮT BUỘC chứa case_id
}

export interface CreateOrderRequest {
  items: CreateOrderItem[];
  idempotency_key?: string;
}

export type OrderStatus = "pending" | "paid" | "refunded" | "cancelled";

export const CREDIT_AUDIT_SERVICE = "credit_audit";
```

### T03.2: DTOs

**File:** `apps/api/src/modules/orders/application/orders.dto.ts` (NEW)

```typescript
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
```

### T03.3: Repository

**File:** `apps/api/src/modules/orders/infrastructure/persistence/order.repository.ts` (NEW)

```typescript
import { prisma } from "../../../../db.js";
import type { Prisma } from "@prisma/client";

export async function createOrder(data: {
  userId: string;
  totalAmount: number;
  items: { service_type: string; quantity: number; unit_price: number; amount: number; metadata_json?: unknown }[];
  metadataJson?: Record<string, unknown>;
}) {
  return prisma.order.create({
    data: {
      user_id: data.userId,
      total_amount: data.totalAmount,
      status: "pending",
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

export async function markOrderPaid(
  id: string,
  walletTransactionId: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  return client.order.update({
    where: { id },
    data: {
      status: "paid",
      wallet_transaction_id: walletTransactionId,
    },
  });
}

export async function markOrderRefunded(id: string, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  return client.order.update({
    where: { id },
    data: { status: "refunded" },
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
```
<!-- Note: createOrder/markOrderPaid/markOrderRefunded NOT used by T03.4 (inline tx.order.create/update). Keep for future refactor or remove Phase 09. -->

### T03.4: Use case — Create Order (GAP-2 + GAP-4 fixed)

**File:** `apps/api/src/modules/orders/application/create-order.usecase.ts` (NEW)

```typescript
import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import { walletService } from "../../wallet/application/wallet.service.js";
import { insertOutboxEvent } from "../../shared/infrastructure/persistence/outbox.repository.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { CREDIT_AUDIT_SERVICE } from "../domain/order.types.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { CreateOrderItem, CreateOrderRequest, CreateOrderResponse } from "./orders.dto.js";
import { prisma } from "../../../db.js";
import type { Prisma } from "@prisma/client";

function generateOrderIdempotencyKey(userId: string, items: CreateOrderItem[]): string {
  // GAP-2: key bao gồm case_id — retry trả về đúng order cũ
  const parts = items
    .map((i) => `${i.service_type}:${i.quantity}:${(i.metadata_json as any)?.case_id ?? ""}`)
    .sort()
    .join(",");
  return `order-${userId}-${crypto.createHash("sha256").update(parts).digest("hex").slice(0, 12)}`;
}

// GAP-4: giá resolve từ service package — KHÔNG trust client unit_price
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

  // Resolve price server-side — client unit_price BỊ BỎ QUA (GAP-4 / lỗ hổng giá)
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
      // Future service: thêm resolver riêng. Từ chối nếu chưa hỗ trợ.
      throw new AppError(400, "INVALID_SERVICE", `Chưa hỗ trợ service_type: ${item.service_type}`);
    }
  }

  const totalAmount = resolvedItems.reduce(
    (sum, { item, unitPrice }) => sum + item.quantity * unitPrice,
    0,
  );
  const idempotencyKey = request.idempotency_key ?? generateOrderIdempotencyKey(userId, request.items);

  // CRITICAL FIX (C5): Atomic tx — create order FIRST (pending), then withdraw, then mark paid
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Create order (pending status — order.id now available for wallet reference)
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
              unit_price: unitPrice,           // price server-side — không phải giá client
              amount: item.quantity * unitPrice,
              metadata_json: (item.metadata_json ?? {}) as any,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Check wallet + deduct (SELECT FOR UPDATE inside)
      const walletTxn = await walletService.withdraw(
        userId,
        totalAmount,
        idempotencyKey,
        { referenceType: "order", referenceId: order.id },
      );

      // 3. Mark order paid + link to wallet transaction
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          wallet_transaction_id: walletTxn.id,
        },
      });

      // 4. Credit credit_ledger cho từng credit_audit item (aggregate _sum — P3)
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

      // 5. Outbox event (same tx)
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
    // GAP-2 fix: retry trùng idempotency_key → P2002 → trả order cũ thay vì 500
    if ((error as any)?.code === "P2002") {
      const existing = await prisma.order.findUnique({ where: { idempotency_key: idempotencyKey } });
      if (existing) {
        if (existing.user_id !== userId) {
          throw new AppError(409, "IDEMPOTENCY_CONFLICT", "Mã giao dịch đã tồn tại cho user khác");
        }
        // Trả order gốc (status phản ánh kết quả thực của lần create đầu)
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
```

**Note:** C5 fixed: order created FIRST (pending, so `order.id` exists), then `withdraw` with `{ referenceType: "order", referenceId: order.id }`, then mark paid. P3 fixed: balance read via `aggregate _sum`. GAP-2: P2002 catch → lookup by `idempotency_key` → trả order gốc (test "duplicate returns same result" giờ chạy thật). GAP-4: `unit_price` KHÔNG lấy từ client — resolve từ `case → service_packages` (fix luôn lỗ hổng price-trust của `createPaymentUseCase` cũ, nơi `body.amount` được tin tưởng trực tiếp).

### T03.5: Use case — List Orders

**File:** `apps/api/src/modules/orders/application/list-orders.usecase.ts` (NEW)

```typescript
import { findOrdersByUser, countOrdersByUser } from "../infrastructure/persistence/order.repository.js";
import type { ListOrdersResponse, OrderHistoryItem } from "./orders.dto.js";

export async function listOrdersUseCase(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<ListOrdersResponse> {
  const [orders, total] = await Promise.all([
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
```

### T03.6: Use case — Get Order

**File:** `apps/api/src/modules/orders/application/get-order.usecase.ts` (NEW)

```typescript
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
```

### T03.7: HTTP Routes + Controller

**File:** `apps/api/src/modules/orders/infrastructure/http/order.controller.ts` (NEW)

```typescript
import type { Context } from "hono";
import { getSession } from "../../../../shared/infrastructure/http-helpers.js";
import { handleError } from "../../../../shared/infrastructure/http-helpers.js";
import { createOrderUseCase } from "../../application/create-order.usecase.js";
import { listOrdersUseCase } from "../../application/list-orders.usecase.js";
import { getOrderUseCase } from "../../application/get-order.usecase.js";

export async function createOrderHandler(c: Context) {
  try {
    const session = await getSession(c);
    const body = await c.req.json();
    const result = await createOrderUseCase(session.user.id, body);
    return c.json(result, 201);
  } catch (err) { return handleError(c, err); }
}

export async function listOrdersHandler(c: Context) {
  try {
    const session = await getSession(c);
    const { limit = "20", offset = "0" } = c.req.query();
    const result = await listOrdersUseCase(session.user.id, Number(limit), Number(offset));
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}

export async function getOrderHandler(c: Context) {
  try {
    const session = await getSession(c);
    const { id } = c.req.param();
    const result = await getOrderUseCase(session.user.id, id);
    return c.json(result);
  } catch (err) { return handleError(c, err); }
}
```

**File:** `apps/api/src/modules/orders/infrastructure/http/order.routes.ts` (NEW)

```typescript
import { Hono } from "hono";
import { createOrderHandler, listOrdersHandler, getOrderHandler } from "./order.controller.js";

export const orderRouter = new Hono();

orderRouter.get("/", listOrdersHandler);
orderRouter.post("/", createOrderHandler);
orderRouter.get("/:id", getOrderHandler);
```

### T03.8: Mount Route in index.ts

**File:** `apps/api/src/index.ts`

```typescript
import { orderRouter } from "./modules/orders/infrastructure/http/order.routes.js";
app.route("/api/orders", orderRouter);
```

### T03.9: WalletService — update `withdraw` to accept generic reference

**File:** `apps/api/src/modules/wallet/application/wallet.service.ts`

Current signature:
```typescript
async withdraw(userId: string, amountVnd: number, caseId: string, idempotencyKey: string)
```

Change to:
```typescript
async withdraw(
  userId: string,
  amountVnd: number,
  idempotencyKey: string,
  opts?: { referenceType?: string; referenceId?: string },
)
```

**CRITICAL (H6): Implement this BEFORE wiring create-order.usecase.ts.** Old callers update:
```typescript
// purchase-credits.usecase.ts:
// OLD: await walletService.withdraw(userId, amount, caseId, key)
// NEW: await walletService.withdraw(userId, amount, key, { referenceType: 'credit_purchase', referenceId: caseId })
```

In `withdraw` body, update wallet_tx columns:
```typescript
reference_type: opts?.referenceType ?? 'adjustment',   // NEW canonical
reference_id: opts?.referenceId ?? idempotencyKey,      // NEW canonical
source_type: opts?.referenceType ?? 'adjustment',       // OLD compat (dual-write)
source_id: opts?.referenceId ?? idempotencyKey,         // OLD compat
```


### T03.10: WalletRepository — dual-write old + new columns

**File:** `apps/api/src/modules/wallet/infrastructure/persistence/wallet.repository.ts`

In `createTransaction`:
```typescript
// ADD after source_type/source_id assignment:
reference_type: params.referenceType,   // NEW — canonical
reference_id: params.referenceId,       // NEW — canonical
source_type: params.referenceType,      // OLD — backward compat (drop in Phase 09)
source_id: params.referenceId,          // OLD — backward compat
```

Update param interface:
```typescript
interface CreateTransactionParams {
  walletId: string;
  type: WalletTxType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: string;   // RENAMED from sourceType
  referenceId: string | null;  // RENAMED from sourceId
  idempotencyKey: string;
}
```

Update all callers in wallet.service.ts to use new param names.

### T03.11: GET /api/packages/:id — nguồn giá cho frontend (GAP-4)

`CreditQuantityModal` (T07.2) cần hiển thị giá TRƯỚC khi mua — không hardcode, không dựa client amount. Thêm endpoint public trả giá hiện tại của 1 package.

**File:** `apps/api/src/modules/packages/application/get-package.usecase.ts` (NEW)

```typescript
import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../../db.js";

export async function getPackageUseCase(packageId: string) {
  const pkg = await prisma.servicePackage.findUnique({
    where: { id: packageId, is_active: true },
    include: { pricing_tiers: { where: { is_current: true }, take: 1 } },
  });
  if (!pkg) {
    throw new AppError(404, "PACKAGE_NOT_FOUND", "Không tìm thấy gói dịch vụ");
  }
  return {
    id: pkg.id,
    name: pkg.name,
    price: pkg.pricing_tiers[0]?.price ?? pkg.price,   // CÙNG logic resolve với create-order
  };
}
```

**File:** `apps/api/src/modules/packages/infrastructure/http/package.routes.ts` (ADD — public như GET /)

```typescript
packageRouter.get("/:id", async (c) => {
  try {
    const result = await getPackageUseCase(c.req.param("id"));
    return c.json(result);
  } catch (err) { return handleError(c, err); }
});
```

**Lưu ý:** `is_active/is_current` filter giữ nguyên ngữ nghĩa như `purchase-credits.usecase.ts:11-19` — 2 nơi resolve giá PHẢI luôn cùng logic (DRY: prefer helper dùng chung trong packages module nếu tiện).

### T03.12: G3/UD2 — Bỏ UPGRADE_LOCKED_PRICE hardcode, resolve giá từ DB

**File:** `apps/api/src/modules/cases/application/upgrade-package.usecase.ts`

**Current:** `UPGRADE_LOCKED_PRICE = 39000` (L10) — hardcode giá gói audit. Mọi upgrade đều set `locked_price: 39000` bất kể giá thực trong DB.

**Fix:** Bỏ constant, resolve `locked_price` từ `service_packages`:

```typescript
// REMOVE: const UPGRADE_LOCKED_PRICE = 39000

// In upgrade function, add:
import { getPackageUseCase } from "../../packages/application/get-package.usecase.js";

const targetPkg = await getPackageUseCase(targetPackageId);
const lockedPrice = targetPkg.price;   // server resolve — đúng giá hiện tại

await caseRepository.upgradeCasePackage(caseId, targetPackageId, lockedPrice);
```

**Lưu ý:** `upgradeCasePackage` (`case.repository.ts:790-803`) nhận `lockedPrice` param — không cần sửa schema hay repository.

**Test:**
- Unit: upgrade free→audit → locked_price = giá hiện tại của audit (VD: 39000), KHÔNG hardcode
- Unit: upgrade giữa các gói audit (future multi-package) → mỗi gói locked_price đúng giá riêng

## Testing

- Integration: POST /orders (credit_audit x2, unit_price 39000) → 201, wallet deducted 78000, credit_ledger +2 for case
- Integration: POST /orders with insufficient balance → 400 InsufficientBalanceError
- Integration: GET /orders → list with correct items
- Integration: GET /orders/:id → full order with items
- Unit: createOrderUseCase with idempotency key → duplicate call returns same result
- **GAP-4 test:** POST /orders credit_audit KHÔNG gửi unit_price → 201, giá resolve từ case package
- **GAP-4 test:** POST /orders gửi unit_price=1 (tấn công giá) → BỊ BỎ QUA, trừ đúng giá package
- **GAP-2 test:** gọi createOrder 2 lần cùng payload → lần 2 trả order cũ, KHÔNG double-deduct
- Integration: GET /packages/:id → price + pricing_tiers hiện tại

## Rollback

1. Remove `app.route("/api/orders", orderRouter)` from index.ts
2. Old POST /payments (case-bound purchase) still active

## Deliverables

- [ ] `orders/` module created with all files
- [ ] WalletService.withdraw updated with generic reference
- [ ] WalletRepository dual-writes old + new columns
- [ ] Route mounted in index.ts
- [ ] `GET /packages/:id` endpoint (get-package.usecase.ts + package.routes.ts) — T03.11
- [ ] `upgrade-package.usecase.ts` — bỏ UPGRADE_LOCKED_PRICE hardcode, resolve DB (T03.12/G3)
- [ ] check-types passes
