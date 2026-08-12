# Phase 06: Transactional Outbox

**Status:** pending | **Effort:** 2h | **Depends:** Phase 01 | **Blocked by:** —

## Overview

Replace fire-and-forget `emitEvent` (event-bus.ts) with transactional outbox pattern:
1. DB insert into `domain_event_outbox` table happens in SAME transaction as the business operation
2. Outbox relay worker polls `domain_event_outbox` table every few seconds
3. Worker publishes to EventEmitter (existing event-bus.ts)
4. On success: mark `sent`; on failure: increment `attempts`, schedule retry

This ensures no event is lost even if process crashes between DB write and event emit.

**Naming fix:** Table renamed to `domain_event_outbox` to avoid conflict with existing `notification_outbox` table (both in same schema, different purposes).

## Why Now

The financial domain has critical events:
- `DEPOSIT_VERIFIED` → notification to user
- `ORDER_PAID` → credit ledger update
- `WALLET_BALANCE_CHANGED` → balance reconciliation

Losing any of these means money was deducted but notification/credit not created.

## Task Breakdown

### T06.1: Outbox repository

**File:** `apps/api/src/shared/infrastructure/persistence/outbox.repository.ts` (NEW)

**Naming:** `domain_event_outbox` table (distinct from existing `notification_outbox`).

```typescript
import { prisma } from "../../../db.js";
import type { Prisma } from "@prisma/client";

export interface OutboxEvent {
  event_type: string;
  payload_json: Record<string, unknown>;
}

/**
 * Insert event into outbox within an existing transaction.
 * Caller MUST pass the tx client from their transaction.
 */
export async function insertOutboxEvent(
  tx: Prisma.TransactionClient,
  event: OutboxEvent,
) {
  return tx.domainEventOutbox.create({
    data: {
      event_type: event.event_type,
      payload_json: event.payload_json as any,
      status: "pending",
      attempts: 0,
    },
  });
}

/**
 * Fetch pending events for the relay worker.
 * Locks rows with processing_at to prevent duplicate processing.
 */
export async function fetchPendingOutboxEvents(limit = 10) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const events = await tx.domainEventOutbox.findMany({
      where: {
        status: "pending",
        OR: [
          { next_retry_at: null },
          { next_retry_at: { lte: now } },
        ],
      },
      orderBy: { created_at: "asc" },
      take: limit,
    });

    if (events.length > 0) {
      await tx.domainEventOutbox.updateMany({
        where: { id: { in: events.map((e) => e.id) } },
        data: { status: "processing", processing_at: now },
      });
    }

    return events;
  });
}

/**
 * Mark event as sent.
 */
export async function markOutboxSent(id: string) {
  return prisma.domainEventOutbox.update({
    where: { id },
    data: { status: "sent", sent_at: new Date() },
  });
}

/**
 * Mark event as failed with retry.
 * Exponential backoff: 2^attempts seconds.
 */
export async function markOutboxFailed(id: string, error: string, currentAttempts: number) {
  const nextRetryDelay = Math.min(Math.pow(2, currentAttempts + 1) * 1000, 3600_000); // max 1 hour
  return prisma.domainEventOutbox.update({
    where: { id },
    data: {
      status: "pending",
      attempts: currentAttempts + 1,
      last_error: error,
      next_retry_at: new Date(Date.now() + nextRetryDelay),
    },
  });
}
```

### T06.2: Outbox relay worker

**File:** `apps/api/src/shared/infrastructure/outbox-relay.ts` (NEW)

```typescript
import {
  fetchPendingOutboxEvents,
  markOutboxSent,
  markOutboxFailed,
} from "./persistence/outbox.repository.js";
import { emitter } from "../event-bus.js"; // Export raw emitter from event-bus
import logger from "./logger.js";

const POLL_INTERVAL_MS = 5_000;  // 5 seconds
const MAX_RETRIES = 10;

let relayTimer: ReturnType<typeof setInterval> | null = null;

export function startOutboxRelay(): void {
  if (relayTimer) return;

  relayTimer = setInterval(async () => {
    try {
      const events = await fetchPendingOutboxEvents(10);
      if (events.length === 0) return;

      for (const event of events) {
        try {
          const payload = JSON.parse(JSON.stringify(event.payload_json));
          emitter.emit(event.event_type, {
            eventId: event.id,
            type: event.event_type,
            actorId: null,
            occurredAt: new Date(),
            payload,
          });
          await markOutboxSent(event.id);
        } catch (err: any) {
          logger.error({ err, outboxId: event.id, eventType: event.event_type }, "outbox relay: event publish failed");
          if (event.attempts >= MAX_RETRIES) {
            await markOutboxSent(event.id); // Dead letter — mark sent to stop retries, log for manual review
          } else {
            await markOutboxFailed(event.id, err?.message ?? "Unknown", event.attempts);
          }
        }
      }
    } catch (err) {
      logger.error({ err }, "outbox relay: poll failed");
    }
  }, POLL_INTERVAL_MS);

  logger.info("outbox relay worker started");
}

export function stopOutboxRelay(): void {
  if (relayTimer) {
    clearInterval(relayTimer);
    relayTimer = null;
    logger.info("outbox relay worker stopped");
  }
}
```

### T06.3: Event bus — export emitter + add outbox helper

**File:** `apps/api/src/shared/infrastructure/event-bus.ts`

```typescript
import { EventEmitter } from "node:events";
import type { DomainEvent } from "../domain/domain-events.js";

export const emitter = new EventEmitter();
emitter.setMaxListeners(20);

export function emitEvent(event: DomainEvent): void {
  queueMicrotask(() => {
    try {
      emitter.emit(event.type, event);
    } catch (error) {
      console.error("[event-bus] listener error:", error);
    }
  });
}

// NEW: Emit from outbox relay (already has retry logic, skip queueMicrotask)
export function emitFromOutbox(event: DomainEvent): void {
  try {
    emitter.emit(event.type, event);
  } catch (error) {
    console.error("[event-bus] outbox listener error:", error);
  }
}

export function onEvent(type: string, handler: (event: DomainEvent) => void): void {
  emitter.on(type, handler);
}
```

### T06.4: WalletService — use outbox for deposit events

**File:** `apps/api/src/modules/wallet/application/wallet.service.ts`

In `deposit` method:
```typescript
async deposit(userId, amountVnd, referenceType, referenceId, idempotencyKey, tx?) {
  const client = tx ?? prisma;
  return client.$transaction(async (innerTx) => {
    // ... existing logic: get wallet, create transaction, update balance ...

    // INSERT INTO outbox (in same transaction!)
    await insertOutboxEvent(innerTx as any, {
      event_type: DOMAIN_EVENTS.WALLET_BALANCE_CHANGED,
      payload_json: {
        userId,
        amount: amountVnd,
        balanceBefore,
        balanceAfter,
        referenceType,
        referenceId,
      },
    });

    return txn;
  });
}
```

### T06.5: Create-order use case — use outbox

**Note:** Outbox insert is now done inline in Phase 03's `create-order.usecase.ts` (T03.4). The outbox event `ORDER_PAID` is inserted in the same transaction as order creation.

**H2 fix:** `verify-deposit.usecase.ts` keeps `DEPOSIT_VERIFIED`/`DEPOSIT_REJECTED` outbox inserts (added in Phase 02 T02.5). NOT just `WALLET_BALANCE_CHANGED` — user notification depends on `DEPOSIT_VERIFIED` event for "Nạp tiền thành công" notification.

### T06.6: WalletService refund — add outbox (H5)

**File:** `apps/api/src/modules/wallet/application/wallet.service.ts`

In `refund` method, add outbox insert:
```typescript
async refund(userId, amountVnd, sourceType, caseId, idempotencyKey, tx?) {
  const client = tx ?? prisma;
  return client.$transaction(async (innerTx) => {
    // ... existing refund logic ...

    // H5 fix: Outbox event for refund notification
    await insertOutboxEvent(innerTx as any, {
      event_type: DOMAIN_EVENTS.WALLET_BALANCE_CHANGED,
      payload_json: {
        userId,
        amount: amountVnd,
        sourceType: "refund",
        referenceType: sourceType,
        referenceId: caseId,
      },
    });

    return result;
  });
}
```

### T06.8: Start relay on server boot

**File:** `apps/api/src/index.ts`

```typescript
import { startOutboxRelay } from "./shared/infrastructure/outbox-relay.js";

// After all routes are mounted:
startOutboxRelay();

// Graceful shutdown:
process.on("SIGTERM", () => {
  stopOutboxRelay();
});
```

### T06.7: ND4/UD4 — Notification wiring for new events

**Context:** `notification-listener.ts` auto-subscribe toàn bộ `DOMAIN_EVENTS` (L18-26) → không cần đăng ký thủ công. Nhưng 2 file dưới thiếu dữ liệu cho event mới → implement Phase 06 xong notification vẫn rỗng.

**3 files cần sửa:**

**a) `apps/api/src/modules/notifications/application/recipients.ts`** — thêm 5 event mới vào routers + userId fallback:

```typescript
// Thêm vào STUDENT_EVENTS (L16-25):
"deposit.verified",
"deposit.rejected",
"order.paid",
"order.refunded",
"wallet.balance_changed",
```

**CRITICAL:** `resolveRecipients` (L79) hiện chỉ resolve recipients qua `caseId` (L87: `STUDENT_EVENTS.has(event.type) && caseId`). Event mới `deposit.verified`/`order.paid` chỉ có `userId`, không có `caseId` → recipients = [].

**Fix — thêm userId fallback branch trong `resolveRecipients` (sau L87, trước L101):**

```typescript
// NEW: Events without caseId — resolve recipient directly by userId
const userId = typeof payload.userId === "string" ? payload.userId : null;
if (recipients.length === 0 && STUDENT_EVENTS.has(event.type) && userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (user) {
    recipients.push({ userId: user.id, email: user.email, role: "student" });
  }
}
```

// Nếu order.paid/admin events cũng notify admin:
// Thêm vào ADMIN_EVENTS (L27-30):
"deposit.rejected",  // admin cần biết deposit bị reject

// STUDENT_EMAIL_EVENTS: deposit.verified, order.paid — optional (user setting)
```

**b) `apps/api/src/modules/notifications/application/notification-templates.ts`** — thêm templates:

```typescript
// TEMPLATES object (L36-98):
"deposit.verified": {
  title: "Nạp tiền thành công",
  bodyTemplate: (p: any) => `+${p.amount.toLocaleString("vi-VN")}₫ đã vào ví của bạn`,
  linkTemplate: (p: any) => `/dashboard/wallet`,
  channels: ["in_app"],
},
"deposit.rejected": {
  title: "Nạp tiền bị từ chối",
  bodyTemplate: (p: any) => `Giao dịch ${p.amount.toLocaleString("vi-VN")}₫ không được duyệt`,
  linkTemplate: (p: any) => `/dashboard/wallet`,
  channels: ["in_app"],
},
"order.paid": {
  title: "Mua credit thành công",
  bodyTemplate: (p: any) => `Đã mua ${p.totalCredits || 0} credit. Tổng: ${(p.totalAmount || 0).toLocaleString("vi-VN")}₫`,
  linkTemplate: (p: any) => `/dashboard/wallet`,
  channels: ["in_app"],
},
"order.refunded": {
  title: "Hoàn tiền credit",
  bodyTemplate: (p: any) => `Đã hoàn ${p.amount.toLocaleString("vi-VN")}₫ vào ví`,
  linkTemplate: (p: any) => `/dashboard/wallet`,
  channels: ["in_app"],
},
"wallet.balance_changed": {
  // SSE realtime — không tạo notification push. Chỉ có template nếu FE fallback.
  title: null,   // no push notification — handled via SSE
  bodyTemplate: null,
  linkTemplate: null,
  channels: [],
},
```

**c) `apps/api/src/shared/domain/domain-events.ts`** — thêm 5 hằng số (đã có trong phase-04 T04.7):

```typescript
export const DOMAIN_EVENTS = {
  // ... existing 9 events ...
  DEPOSIT_VERIFIED: "deposit.verified",
  DEPOSIT_REJECTED: "deposit.rejected",
  ORDER_PAID: "order.paid",
  ORDER_REFUNDED: "order.refunded",
  WALLET_BALANCE_CHANGED: "wallet.balance_changed",
} as const;
```

**Lưu ý:**
- `notification-listener.ts` L18-26 dùng `Object.values(DOMAIN_EVENTS)` → tự động bắt event mới khi thêm hằng số — không cần sửa listener.
- `channelsFor` (L121-140) không có case cho event mới → mặc định `["in_app"]` — xác nhận deposit.verified/order.paid có `in_app` là đủ cho MVP.
- `wallet.balance_changed` không tạo push notification (chỉ SSE) — template có title: null để tránh spam.

## Testing

- Integration: Wallet deposit → outbox row created in same tx → relay picks up → event emitted
- Integration: Wallet deposit with relay down → outbox row pending → relay picks up on restart
- Unit: outbox relay poll → fetches only pending events → marks processing_at → locks against duplicate relay instances
- Unit: outbox retry → failed event increments attempts → next_retry_at increases exponentially
- Unit: outbox max retries reached → marked sent (dead letter), logged for manual review

## Rollback

1. Disable outbox relay: `stopOutboxRelay()`
2. Revert wallet.service.ts to direct emitEvent
3. Existing fire-and-forget emitEvent still works as before
4. Outbox table sits idle — no side effects

## Deliverables

- [ ] `outbox.repository.ts` — insert, fetch, mark sent/failed
- [ ] `outbox-relay.ts` — poll worker with retry
- [ ] `event-bus.ts` — export emitter, add emitFromOutbox
- [ ] `wallet.service.ts` — insert outbox event in deposit transaction
- [ ] `create-order.usecase.ts` — insert outbox event in order transaction
- [ ] `index.ts` — start relay on boot, stop on shutdown
- [ ] `domain-events.ts` — 5 hằng số mới (DEPOSIT_VERIFIED, DEPOSIT_REJECTED, ORDER_PAID, ORDER_REFUNDED, WALLET_BALANCE_CHANGED)
- [ ] `notification-listener.ts` — KHÔNG cần sửa (auto-subscribe qua Object.values(DOMAIN_EVENTS))
- [ ] check-types passes
