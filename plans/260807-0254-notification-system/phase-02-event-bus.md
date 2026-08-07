# Phase 02 — Event Bus

**Effort:** 1h

## Việc

Event bus in-process (EventEmitter). Cầu nối giữa usecase và notification module.

Module khác chỉ import từ `shared/`. Chúng không biết gì về notifications module.

## Files

### 1. `apps/api/src/shared/domain/domain-events.ts` (mới)

```ts
export const DOMAIN_EVENTS = {
  CASE_ASSIGNED: "case.assigned",
  CASE_APPROVED: "case.approved",
  CASE_REJECTED: "case.rejected",
  PAYMENT_PROOF_UPLOADED: "payment.proof_uploaded",
  PAYMENT_VERIFIED: "payment.verified",
  PAYMENT_REJECTED: "payment.rejected",
  CASE_STAGE_CHANGED: "case.stage_changed",
  REPORT_PUBLISHED: "report.published",
  REQUEST_MORE_INFO: "request_more_info",
} as const;

export type DomainEventType = (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];

export interface DomainEvent<T = Record<string, unknown>> {
  eventId: string;          // crypto.randomUUID() — correlation + idempotency
  type: DomainEventType;
  actorId: string | null;   // null = hệ thống (sepay)
  occurredAt: Date;
  payload: T;
}
```

**Payload chuẩn:**

| Event | Payload |
|---|---|
| case.assigned | `{ caseId, caseCode, supporterId, supporterName }` |
| case.approved | `{ caseId, caseCode }` |
| case.rejected | `{ caseId, caseCode, reason }` |
| payment.proof_uploaded | `{ caseId, caseCode, paymentId, amount }` |
| payment.verified | `{ caseId, caseCode, paymentId, amount, source: "manual"\|"auto" }` |
| payment.rejected | `{ caseId, caseCode, paymentId, reason }` |
| case.stage_changed | `{ caseId, caseCode, fromStage, toStage }` |
| report.published | `{ caseId, caseCode, reportId }` |
| request_more_info | `{ caseId, caseCode, query }` |

### 2. `apps/api/src/shared/infrastructure/event-bus.ts` (mới)

```ts
import { EventEmitter } from "node:events";
import type { DomainEvent } from "../domain/domain-events.js";

const emitter = new EventEmitter();
emitter.setMaxListeners(20);

export function emitEvent(event: DomainEvent): void {
  // Dispatch async. Không bao giờ throw về usecase.
  queueMicrotask(() => {
    try {
      emitter.emit(event.type, event);
    } catch (error) {
      console.error("[event-bus] listener error:", error);
    }
  });
}

export function onEvent(type: string, handler: (event: DomainEvent) => void): void {
  emitter.on(type, handler);
}
```

**Design:**
- `queueMicrotask` — emit không block usecase
- Listener phải catch mọi lỗi (phase 04). Event bus là lưới an toàn thứ 2
- 1 instance — không cần Redis (đã chốt)

## Verify

- [ ] `npm run check-types --workspace=apps/api` pass
- [ ] Test: handler throw → emitEvent không throw

## Chốt

- Emit không bao giờ fail usecase
- Zero phụ thuộc từ module khác vào notifications
