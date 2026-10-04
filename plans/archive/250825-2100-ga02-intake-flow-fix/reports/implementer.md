# GA-02 Intake Stuck Fix — Implementer Report

**Agent:** Ga02Implementer-2
**Status:** completed (phases 01, 02, 03)
**Date:** 2026-08-25

## Files Changed (5 edits + 1 new test)

### Phase 01 — API

1. `apps/api/src/modules/orders/application/create-order.usecase.ts`
   - **Before (155-158):** `select: { owner_auth_user_id: true, internal_status: true, user_facing_stage: true }`
   - **After (155-158):** `select: { owner_auth_user_id: true, internal_status: true }`
   - **Before (166-172):** `tx.case.update` data included `...(caseRecord.user_facing_stage === "intake_pending" ? { user_facing_stage: "intake_ready" } : {})`
   - **After (166-171):** `data: { payment_status: "paid" }` only.
   - `user_facing_stage` fully gone from file (grep confirmed 0 refs).

2. `apps/api/src/modules/payments/infrastructure/persistence/payment.repository.ts`
   - **Before (175-187):** `if (status === "paid")` block opened with the `// --- Intake pending → intake ready ---` comment, a `tx.case.findUnique` reading `user_facing_stage`, and a `tx.case.update` pushing `user_facing_stage: "intake_ready"`.
   - **After (175-177):** `if (status === "paid")` now goes straight to `// --- Credit purchase on successful verification ---`. Stage push removed; `payment_status` write (158-163) and credit branch intact.

3. `apps/api/src/modules/cases/application/submit-intake.usecase.ts`
   - **Before (217-220):**
     ```ts
     const transition = caseRecord.user_facing_stage === "intake_ready"
       ? "T16_EDIT_INTAKE"
       : "T2_SUBMIT_INTAKE";
     ```
   - **After (217-219):**
     ```ts
     // triage_pending: content + transition cùng 1 tx (M1 — tránh partial write).
     // GA-02: submit luôn T2_SUBMIT_INTAKE → user_facing_stage "submitted" (không kẹt intake_ready).
     const transition = "T2_SUBMIT_INTAKE";
     ```
   - No `T16_EDIT_INTAKE` import needed cleanup (it was a string literal, not an imported enum member). `fromStage: caseRecord.user_facing_stage` reads (207/240) preserved as event payload, per plan.

### Phase 02 — Copy only

4. `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`
   - Line 159 (non-free title): `"Chờ thanh toán dịch vụ"` → `"Hồ sơ chưa thanh toán"`
   - Line 168 (non-free body): → `"Bạn có thể nộp hồ sơ trước, thanh toán sau — phản biện chỉ bắt đầu sau khi thanh toán hoàn tất."`
   - Line 192 (intake_ready title): `"Cần cập nhật thông tin hồ sơ"` → `"Nộp hồ sơ khởi nghiệp"`
   - Line 194 (intake_ready body): → `"Vui lòng nộp hồ sơ khởi nghiệp để Supporter có thể đánh giá chính xác."`
   - Line 199 (intake_ready button): `"Cập nhật ngay"` → `"Nộp hồ sơ"`
   - `isFree` branch, "Thanh toán ngay" button, `canOpenIntake`/`onOpenIntake`/`onOpenPayment` logic untouched.

5. `apps/api/src/modules/notifications/application/notification-templates.ts`
   - Line 18: `intake_pending: "Chờ thanh toán"` → `"Chờ nộp hồ sơ"`
   - Line 19: `intake_ready: "Sẵn sàng khởi động"` → `"Đã cập nhật hồ sơ"`

### Phase 03 — New test

6. `apps/api/src/shared/infrastructure/tests/phase-09-intake-stuck-fix.test.ts` (new)

## Test Results

Command: `cd apps/api && npx tsx --test src/shared/infrastructure/tests/phase-09-intake-stuck-fix.test.ts`

```
✔ GA-02 path A/B — submit luôn hạ cánh "submitted"
✔ GA-02 path A/B — T2 khả dụng từ triage_pending (cả intake_pending lẫn intake_ready)
✔ GA-02 — cả intake_pending lẫn intake_ready là pre-submission stage
✔ GA-02 — T16 không thể là submit path (guard isBeforeSubmission chặn sau nộp)
✔ GA-02 — paid stamp giữ nguyên (T5 gate dựa vào nó)
✔ GA-02 verifyPayment — paid KHÔNG ghi user_facing_stage
✔ GA-02 createOrder — mua credit KHÔNG ghi user_facing_stage
ℹ tests 7 | pass 7 | fail 0
```

- Path A (`intake_pending → mua credit → nộp → submitted`) and path B (`intake_ready → nộp → submitted`) covered at machine level (T2 → `submitted`; T16 → `intake_ready` not a submit path; both pre-submission stages allow submit).
- Boundary assertions: `verifyPayment` and `createOrderUseCase` each assert `tx.case.update` data is exactly `{ payment_status: "paid" }` with no `user_facing_stage` key.
- No real DB connection (all prisma calls mocked; `DATABASE_URL` present in repo `.env`, client lazy-connects only).

## Deviations from the Plan

1. **Mock strategy (Phase-03 Section B):** the spec prescribed `t.mock.method` on the shared `prisma` singleton. It fails at runtime on Prisma 7's Proxy-based client — `t.mock.method(prisma, '$transaction', …)` throws `ERR_INVALID_ARG_VALUE: methodName must be a method. Received undefined`, because Prisma delegates expose methods via proxy/accessor descriptors, not data properties. Switched to direct property assignment with `try/finally` restore (verified working). This is the fallback the phase-03 Risk Assessment anticipated ("mock.method trên prisma delegate flaky do Prisma proxy").
2. **Imports:** used static top-level imports instead of the spec's `await import(...)`. Same module singleton, no functional difference; matches the project's no-dynamic-import rule for author-time-known modules.
3. **Types:** no bare `any`; used `unknown`/typed mocks with `as unknown as` casts only at the Prisma/wallet boundary (project `ts-no-any` rule).
4. **B2 fakeTx `case.findUnique`:** returns `{ owner_auth_user_id, internal_status }` (no `user_facing_stage`), reflecting the fixed select list — the code no longer reads that field.

## Invariant Confirmation

- Single writer of `user_facing_stage`: `create-order.usecase.ts` and `payment.repository.ts` now contain zero `user_facing_stage` references (grep confirmed). Only `transitionInTx` writes stage.
- Submit = submitted: `submit-intake.usecase.ts` unconditionally uses `T2_SUBMIT_INTAKE`; no `T16_EDIT_INTAKE` caller remains.
- Payment never drives stage: both payment sites now only write `payment_status: "paid"`.

## DB Safety / Scope

- No `prisma migrate`/`db push`/DDL/DML run. No schema/migration files touched.
- No commit/staging performed.
- `git status` confirms only the 5 scoped files modified + 1 new test file; no unrelated working-tree files touched.
