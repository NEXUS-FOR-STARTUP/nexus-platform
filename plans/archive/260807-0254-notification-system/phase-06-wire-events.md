# Phase 06 — Wire 11 Event vào Usecases

**Effort:** 3h

## Việc

Emit domain event tại 11 điểm. Sau commit, trước return. Không emit ở no_op.

## Rule chung

```ts
// sau logger.info, trước return:
if (!isNoOp) {
  emitEvent({
    eventId: crypto.randomUUID(),
    type: DOMAIN_EVENTS.XXX,
    actorId: <actorId>,           // userId người thực hiện, null = system
    occurredAt: new Date(),
    payload: { caseId, caseCode, ... },
  });
}
```

- Import: `emitEvent` từ `../../../shared/infrastructure/event-bus.js`, `DOMAIN_EVENTS` từ `../../../shared/domain/domain-events.js`
- caseCode/reason lấy từ object đã có — không query lại
- Emit không nằm trong try/catch của repository. emitEvent không throw (phase 02)
- Skip-actor: listener tự lo. Usecase chỉ truyền actorId đúng

## Wire points

### 1. `cases/application/assign-supporter.usecase.ts` — case.assigned

- Sau L118 logger, trước L119 return. **Bọc `if (nextSupporterId)`** — L118-119 nằm TRONG try, cả assign lẫn unassign đi qua. Không guard → emit khi unassign (supporterId=null). Không emit no_op L72-77
- actorId: `adminId`
- payload: `{ caseId, caseCode: existingCase.case_code, supporterId: nextSupporterId, supporterName }`

### 2. `admin/application/accept-case.usecase.ts` — case.approved

- Sau L66 auditLogger, trước L67 return. Không emit no_op L32-43
- actorId: `adminId` · payload: `{ caseId, caseCode: caseItem.case_code }`

### 3. `admin/application/reject-case.usecase.ts` — case.rejected

- Sau L35 logger, trước L36 return. Không emit no_op L25-31
- actorId: `adminId` · payload: `{ caseId, caseCode: caseItem.case_code, reason }`

### 4. `payments/application/upload-payment-proof.usecase.ts` — payment.proof_uploaded

- Sau L87 logger, trước L89 return
- actorId: `userId` · payload: `{ caseId, caseCode: caseObj.case_code, paymentId, amount: payment.amount }`

### 5. `payments/application/verify-payment.usecase.ts` — payment.verified / payment.rejected

- Sau L75 logger, trước L77 return
- actorId: `adminId` · payload: `{ caseId: payment.case_id, paymentId, amount: payment.amount, source: "manual" }` — dùng `payment` object từ L44 (trước verifyPayment call), đã có case_id + amount
- caseCode: findPaymentById chỉ include payer — listener fetch (recipients.ts)
- Branch: `status === "paid"` → PAYMENT_VERIFIED; `"rejected"` → PAYMENT_REJECTED

### 6. `payments/application/sepay-webhook.usecase.ts` — payment.verified (auto)

- Sau L119 logger (sepay: payment auto-verified), trước L121 return. **Anchor thực: L105 là string literal trong log, không phải code**
- actorId: `null` (system — skip-actor không loại ai)
- payload: `{ caseId: payment.case_id, paymentId: payment.id, amount: payment.amount, source: "auto" }`

### 7. `cases/application/update-case-status.usecase.ts` — case.stage_changed

- Sau L149-152 logger, trước L154 return (trong try)
- actorId: `userId` · payload: `{ caseId, caseCode: caseObj.case_code, fromStage: caseObj.user_facing_stage, toStage: updatedCase.user_facing_stage }` — dùng `updatedCase` làm nguồn chuẩn
- Không emit khi stage == status (return sớm L88-93)

### 8. `reports/application/approve-report.usecase.ts` — report.published

- Sau L47 logger.info, trước L48 return. **Anchor thực: L37 là field trong auditLogger.log object, không phải logger riêng**
- Emit ở đây vì publish-report.usecase.ts delegate sang file này (có report.case_id). Không emit ở publish-report (tránh trùng)
- **Sửa kèm `reports/infrastructure/persistence/report.repository.ts`:** `findReportById` select (L12-30) thiếu case_code — thêm `case_code: true`
- actorId: `userId` · payload: `{ caseId: report.case_id, caseCode: report.case.case_code, reportId }`

### 9. `supporter/application/supporter-request-more-info.usecase.ts` — request_more_info

- Sau L48 logger, trước L49 return. Không emit no_op L32-38
- actorId: `userId` · payload: `{ caseId, caseCode: currentCase.case_code, query: trimmedQuery }`

### 10. `admin/application/request-more-info.usecase.ts` — request_more_info

- File KHÔNG có logger. **Thêm `import logger` + `logger.info(...)` trước return L33**, rồi emit giữa logger và return. Không no_op path
- actorId: `userId` · payload: `{ caseId, caseCode, query }` (lấy từ caseItem/body đã có trong file)

### 11. `supporter/application/close-case.usecase.ts` — case.stage_changed (toStage=closed)

- Fix review: close-case gọi thẳng `requestCaseMoreInfo()` — KHÔNG qua update-case-status → không có event → student không biết case đóng
- Emit sau repo call, trước return. Đổi `return await requestCaseMoreInfo(...)` → gán kết quả → emit → return. Không emit no_op L11-16
- actorId: `userId` · payload: `{ caseId, caseCode: currentCase.case_code, fromStage: currentCase.user_facing_stage, toStage: "closed" }`

## Danh sách file sửa

1. `cases/application/assign-supporter.usecase.ts`
2. `admin/application/accept-case.usecase.ts`
3. `admin/application/reject-case.usecase.ts`
4. `payments/application/upload-payment-proof.usecase.ts`
5. `payments/application/verify-payment.usecase.ts`
6. `payments/application/sepay-webhook.usecase.ts`
7. `cases/application/update-case-status.usecase.ts`
8. `reports/application/approve-report.usecase.ts` + `reports/infrastructure/persistence/report.repository.ts` (thêm case_code)
9. `supporter/application/supporter-request-more-info.usecase.ts`
10. `admin/application/request-more-info.usecase.ts` (thêm logger + emit)
11. `supporter/application/close-case.usecase.ts`

## Verify

- [ ] `npm run check-types --workspace=apps/api` pass
- [ ] Từng action thật (tạo case, assign, approve...) → outbox row + notification row đúng recipient
- [ ] no_op (assign lại cùng supporter, reject 2 lần) → KHÔNG có outbox row
- [ ] SePay test payload → payment.verified auto, student nhận

## Chốt

- 9 event type, 11 emit point, đúng payload
- Không duplicate emit
- Không throw làm hỏng usecase
