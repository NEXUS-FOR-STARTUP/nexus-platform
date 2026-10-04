# Journal: GA-02 intake stuck fix (case kẹt `intake_ready` khi thanh toán trước khi nộp)

**Date:** 2026-08-25

**Branch:** `feat/ga02-intake-flow-fix`

**Decision:** `docs/research/decision-2026-08-25-intake-payment-stage-separation.md`

**Plan:** `plans/250825-2100-ga02-intake-flow-fix/`

**Status:** Implemented + tested + reviewed (APPROVED_WITH_NITS; M1 + env-restore NIT đã fix). Chưa commit/PR — chờ lead duyệt.

## Bug

Case thanh toán trước khi nộp hồ sơ kẹt vĩnh viễn ở `intake_ready` thay vì lên `submitted` — người dùng đã trả tiền nhưng hồ sơ không tiến triển. Nguyên nhân: `create-order.usecase.ts` và `payment.repository.ts` (verifyPayment) tự ghi `user_facing_stage: "intake_ready"` khi paid, còn `submit-intake.usecase.ts` chỉ dùng `T2_SUBMIT_INTAKE` khi stage đang `intake_pending` (stage `intake_ready` rẽ `T16_EDIT_INTAKE` — không phải submit path).

## Fix (6 files: 5 modified + 1 new test)

1. `create-order.usecase.ts` — bỏ `user_facing_stage` khỏi select + bỏ spread; `tx.case.update` chỉ còn `{ payment_status: "paid" }`.
2. `payment.repository.ts` (verifyPayment) — xóa block push stage `intake_pending → intake_ready`; giữ `payment_status` + credit branch.
3. `submit-intake.usecase.ts` — `transition = "T2_SUBMIT_INTAKE"` unconditionally; submit luôn hạ cánh `submitted`, kể cả từ `intake_ready`.
4. `StatusGuidanceCard.tsx` — 5 copy strings (intake_ready title/body/button + intake_pending non-free title/body).
5. `notification-templates.ts` — 2 `STAGE_LABELS` entries ("Chờ nộp hồ sơ", "Đã cập nhật hồ sơ").
6. `phase-09-intake-stuck-fix.test.ts` (mới).

## Invariants (3)

- **Single writer:** payment paths không còn ghi `user_facing_stage` (0 ref trong orders module + payment.repository.ts).
- **Payment không drive stage:** chỉ ghi `payment_status: "paid"`.
- **Submit luôn `T2_SUBMIT_INTAKE` → `submitted`;** `T16_EDIT_INTAKE` không còn production caller.

## Verify

- Scoped suite `phase-09-intake-stuck-fix.test.ts`: 7/7 pass (path A `intake_pending → mua credit → nộp`; path B `intake_ready → nộp`).
- `npm run check-types` (root): 3/3 turbo tasks pass, exit 0.
- Full API suite vẫn 28 failures — pre-existing baseline (stash experiment chứng minh 0 regression do GA-02); tách ticket GA-21.

## Note

- Không `prisma migrate`/`db push`/DDL/DML; không schema change; DB không đụng.
- Chưa stage/commit — commit là bước riêng chờ user duyệt.
