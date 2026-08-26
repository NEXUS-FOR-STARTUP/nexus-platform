# Phase 01 — Implement API Fix (3 edits)

- Priority: P1 | Status: implemented | Effort: 1h
- Depends: — | Blocks: Phase 03

## Context Links

- Quyết định gốc: `docs/research/decision-2026-08-25-intake-payment-stage-separation.md`
- Brainstorm gốc: `docs/research/brainstorm-2026-08-21-flow-confusion-intake-payment-credit.md`
- Single writer bất biến: `apps/api/src/services/case-transition.service.ts` (`transitionInTx` — dòng 264-271 ghi `user_facing_stage` qua `tx.case.updateMany`)
- Stage enum: `apps/api/src/modules/cases/domain/case.types.ts` (`VALID_CASE_STAGES`, `isPreSubmissionStage`)
- Machine: `apps/api/src/modules/cases/domain/case-machine.ts`; `TARGET_STAGE`: `apps/api/src/modules/cases/domain/transition.types.ts:34-53`

## Overview

Bỏ 2 site ghi thẳng `user_facing_stage = "intake_ready"` khi thanh toán, và bỏ ternary chọn `T16_EDIT_INTAKE` khi nộp. Sau phase này: **chỉ `transitionInTx` ghi stage**, tiền chỉ ghi `payment_status`, submit luôn `T2_SUBMIT_INTAKE`.

## Key Insights

- `transitionInTx` là single writer hợp pháp: mọi ghi `user_facing_stage` ngoài nó là bug.
- `TARGET_STAGE.T2_SUBMIT_INTAKE = 'submitted'`; `TARGET_STAGE.T16_EDIT_INTAKE = 'intake_ready'`. Ternary cũ chọn T16 khi stage `intake_ready` → stage ở nguyên `intake_ready` → không bao giờ `submitted` (kẹt).
- `T5_ACCEPT` guard `hasPaymentComplete` đòi `payment_status` ∈ {`paid`, `not_required`} — vì vậy **phải giữ** `payment_status: "paid"` ở cả 2 site (chỉ bỏ phần stage, không bỏ tem paid).
- `verifyPayment` (payment.repository.ts) hiện là dead code HTTP (route không wire — `payments.routes.ts` chỉ có `/proof`; usecase `verify-payment.usecase.ts` ghi `@deprecated`). Vẫn sửa theo decision (bất biến single-writer, phòng thủ) nhưng **không có regression surface live**.
- `createOrderUseCase` là **live** credit-purchase path (`POST /api/orders` — `app.route('/api/orders', orderRouter)` trong `index.ts:163`).

## Requirements

- Bỏ push stage ở `create-order.usecase.ts` và `payment.repository.ts` (giữ `payment_status: "paid"`).
- Submit intake (triage_pending) luôn dùng `T2_SUBMIT_INTAKE`.
- KHÔNG sửa schema, migration, enum, hay bất kỳ file nào khác.

## Architecture

```
[Thanh toán] createOrderUseCase ──► tx.case.update { payment_status: "paid" }   (KHÔNG user_facing_stage)
            verifyPayment       ──► tx.case.update { payment_status: "paid" }   (KHÔNG user_facing_stage)
[Submit]    submitIntakeUseCase ──► transitionInTx({ transition: "T2_SUBMIT_INTAKE" }) ──► stage "submitted"
```

`transitionInTx` đọc `internal_status` (vẫn `triage_pending`), chạy guard `isOwner`, rồi ghi `user_facing_stage = targetStageFor("T2_SUBMIT_INTAKE") = "submitted"` + `internal_status` qua optimistic `updateMany`. Cả path A (`intake_pending`) lẫn path B (`intake_ready`) đều có `internal_status = triage_pending` → cùng đi qua T2 → `submitted`.

## Related Code Files

- **Sửa:** `apps/api/src/modules/orders/application/create-order.usecase.ts`
- **Sửa:** `apps/api/src/modules/payments/infrastructure/persistence/payment.repository.ts`
- **Sửa:** `apps/api/src/modules/cases/application/submit-intake.usecase.ts`
- Không tạo/xóa file.

## Implementation Steps

### Step 1 — `create-order.usecase.ts`: bỏ push stage

**Hiện tại (lines 166-172):**
```ts
await tx.case.update({
  where: { id: caseId },
  data: {
    payment_status: "paid",
    ...(caseRecord.user_facing_stage === "intake_pending" ? { user_facing_stage: "intake_ready" } : {}),
  },
});
```

**Sau khi sửa:**
```ts
await tx.case.update({
  where: { id: caseId },
  data: {
    payment_status: "paid",
  },
});
```

Chính xác: **xóa dòng 170** (`...(caseRecord.user_facing_stage === ...)`).

**Cleanup kèm theo (bắt buộc — tránh dead read):** dòng 157 `select` đang chọn `user_facing_stage: true`. Sau khi xóa dòng 170, field này không còn ai dùng (chỉ `owner_auth_user_id` ở dòng 162 và `internal_status` ở dòng 174 còn dùng). Đổi:

```ts
// trước (155-158)
const caseRecord = await tx.case.findUnique({
  where: { id: caseId },
  select: { owner_auth_user_id: true, internal_status: true, user_facing_stage: true },
});
// sau
const caseRecord = await tx.case.findUnique({
  where: { id: caseId },
  select: { owner_auth_user_id: true, internal_status: true },
});
```

Kết quả mong đợi: `createOrderUseCase` không còn bất kỳ tham chiếu nào tới `user_facing_stage`; `payment_status: "paid"` vẫn được ghi.

### Step 2 — `payment.repository.ts` `verifyPayment`: bỏ push stage

**Hiện tại (lines 175-186):**
```ts
if (status === "paid") {
  // --- Intake pending → intake ready on successful payment ---
  const caseRecord = await tx.case.findUnique({
    where: { id: caseId },
    select: { user_facing_stage: true },
  });
  if (caseRecord?.user_facing_stage === "intake_pending") {
    await tx.case.update({
      where: { id: caseId },
      data: { user_facing_stage: "intake_ready" },
    });
  }

  // --- Credit purchase on successful verification ---
  if (process.env["USE_ORDER_DOMAIN"] !== "true") {
```

**Sau khi sửa:**
```ts
if (status === "paid") {
  // --- Credit purchase on successful verification ---
  if (process.env["USE_ORDER_DOMAIN"] !== "true") {
```

Chính xác: **xóa các dòng 176–186** (comment `Intake pending → intake ready` + khối `case.findUnique` + khối `if (caseRecord?.user_facing_stage...)` + dòng trống). Giữ dòng 175 `if (status === "paid") {` và dòng 188 `// --- Credit purchase...`.

Biến `caseRecord` (dòng 177) chỉ tồn tại trong khối bị xóa → không còn reference nào khác trong hàm.

Kết quả mong đợi: nhánh `status === "paid"` chỉ còn ghi `payment_status` (đã ghi ở dòng 158-163, trước đó) + credit ledger; **không còn ghi `user_facing_stage`**.

### Step 3 — `submit-intake.usecase.ts`: bỏ ternary

**Hiện tại (lines 217-220):**
```ts
// triage_pending: content + transition cùng 1 tx (M1 — tránh partial write)
const transition = caseRecord.user_facing_stage === "intake_ready"
  ? "T16_EDIT_INTAKE"
  : "T2_SUBMIT_INTAKE";
```

**Sau khi sửa:**
```ts
// triage_pending: content + transition cùng 1 tx (M1 — tránh partial write).
// GA-02: submit luôn T2_SUBMIT_INTAKE → user_facing_stage "submitted" (không kẹt intake_ready).
const transition = "T2_SUBMIT_INTAKE";
```

Chính xác: **thay 4 dòng 217-220** bằng 3 dòng trên. Không đổi phần `caseRecord.user_facing_stage` ở chỗ khác (dòng 241 `fromStage: caseRecord.user_facing_stage` giữ nguyên — dùng cho event payload, không phải writer).

Kết quả mong đợi: cả khi stage là `intake_pending` lẫn `intake_ready`, submit đều chạy T2 → `submitted`. `T16_EDIT_INTAKE` không còn caller.

## Todo List

- [x] Step 1: xóa spread stage + bỏ `user_facing_stage` khỏi select ở `create-order.usecase.ts` (giữ `payment_status: "paid"`)
- [x] Step 2: xóa khối push stage (176-186) trong `verifyPayment` ở `payment.repository.ts` (giữ tem paid + credit branch)
- [x] Step 3: thay ternary bằng `const transition = "T2_SUBMIT_INTAKE"` ở `submit-intake.usecase.ts`
- [x] Xác nhận KHÔNG còn reference `user_facing_stage` ghi thẳng trong 3 file (chỉ `transitionInTx` ghi stage)

## Success Criteria

- [x] `createOrderUseCase` ghi `payment_status: "paid"` và **không** ghi `user_facing_stage`.
- [x] `verifyPayment` (status `paid`) ghi `payment_status` và **không** ghi `user_facing_stage`.
- [x] `submitIntakeUseCase` (triage_pending) luôn truyền `T2_SUBMIT_INTAKE`, không còn nhánh `T16_EDIT_INTAKE`.
- [x] `npm run check-types` (apps/api) pass — xác minh ở phase-04.
- [x] Không đụng `schema.prisma`/migration; không chạy Prisma CLI mutation.

## Risk Assessment

| Rủi ro | Khả năng | Tác động | Giảm thiểu |
|---|---|---|---|
| Bỏ nhầm `payment_status: "paid"` khi xóa stage → T5 chặn 402 sai | Thấp | Cao | Step ghi rõ chỉ xóa spread/khối stage, giữ tem paid; test phase-03 khóa `payment_status` |
| `verifyPayment` là dead code — fix không có live caller để smoke test | — | Thấp | Ghi rõ trong plan; test phase-03 gọi trực tiếp repo fn |
| Lỡ sửa file khác (working tree đang bẩn) | Trung bình | Trung bình | Chỉ touch 3 file liệt kê; `git diff -- <3 file>` trước khi commit |

## Security Considerations

- Không thay đổi auth/authorization: submit vẫn owner-only (dòng 162-165), verify vẫn admin-only (controller), order vẫn check owner (dòng 162-164).
- Không mở rộng quyền ghi stage: ngược lại, thu hẹp về đúng single-writer `transitionInTx`.

## Next Steps

- Phase 03 (tests) — cần phase này xong để test trực tiếp.
- Phase 04 (review & verify) — chạy `check-types` + test scoped.
