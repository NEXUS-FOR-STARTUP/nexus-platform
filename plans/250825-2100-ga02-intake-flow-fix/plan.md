---
title: "GA-02 — Sửa bug kẹt intake khi trả tiền trước khi nộp hồ sơ"
description: "Bỏ 2 site ghi thẳng user_facing_stage=intake_ready (create-order, verifyPayment) + bỏ ternary T16 trong submit-intake + đổi copy UI/labels để dọn tàn dư nghĩa A (payment không còn bị hiểu là điều kiện nộp hồ sơ). Case trả trước nộp sau không còn kẹt vĩnh viễn ở intake_ready."
status: implemented
priority: P0
effort: 3h
branch: feat/ga02-intake-flow-fix
tags: [bug-fix, workflow, intake, xstate, backend, frontend]
blockedBy: []
blocks: []
created: 2026-08-25
---

# GA-02 — Intake Stuck Bug Fix

## Overview

Case trả tiền trước khi nộp hồ sơ kẹt vĩnh viễn ở `user_facing_stage="intake_ready"`, không vào hàng đợi admin (`submitted`). Gốc: 2 site ghi thẳng stage `intake_pending → intake_ready` khi thanh toán (mua credit / admin verify), và submit-intake dùng ternary chọn `T16_EDIT_INTAKE` (target `intake_ready`) thay vì `T2_SUBMIT_INTAKE` (target `submitted`).

**Quyết định đã duyệt (owner 2026-08-25):** `docs/research/decision-2026-08-25-intake-payment-stage-separation.md` — KHÔNG redesign. Tiền không lái stage; submit luôn = `submitted`; `intake_ready` giữ enum (compat dữ liệu cũ) nhưng không còn writer mới. **Bổ sung 2026-08-25:** dọn copy tàn dư nghĩa A — code chưa bao giờ chặn nộp vì payment (T2 guard chỉ `isOwner`), nên UI phải nói đúng: "có thể nộp trước, thanh toán là điều kiện để được duyệt".

## Quyết định chốt (Q1–Q5)

- Q1: Không ép thứ tự nộp/trả — cổng `T5_ACCEPT` đòi `submitted + hasCredit + hasPaymentComplete`.
- Q2: `paid` = đã mua credit cho case (order paid). Không tạo tem verify riêng.
- Q3: Giữ `intake_pending`/`intake_ready` trong `VALID_CASE_STAGES` (compat). Sau fix không còn writer mới cho `intake_ready`. `T16_EDIT_INTAKE` giữ định nghĩa, không còn caller.
- Q4: Giữ chung bảng `case`; admin queue filter `submitted` (đã đúng).
- Q5: Giữ cổng T5 + dán tem `paid`; bỏ nhảy stage ở 2 site; bỏ ternary trong submit-intake.

## Bất biến (từ nay về sau)

1. **Single writer cho `user_facing_stage`:** chỉ `transitionInTx` (case-transition.service.ts).
2. **Tiền không lái stage:** deposit/order/refund chỉ ghi `payment_status`/ledger/wallet.
3. **Submit = submitted:** endpoint submit intake luôn chạy `T2_SUBMIT_INTAKE`.

## Phases

| # | Phase | File | Status | Depends |
|---|---|---|---|---|
| 01 | Implement API fix (3 edits) | `phase-01-implement-api-fix.md` | implemented | — |
| 02 | UI copy fix | `phase-02-ui-copy-fix.md` | implemented | — |
| 03 | Tests | `phase-03-tests.md` | implemented | Phase 01 |
| 04 | Review & verify | `phase-04-review-verify.md` | implemented | Phases 01–03 |

## Progress

**Status: implemented** — commit/PR đang chờ user duyệt (chưa stage, chưa commit).

**Reality check (2026-08-25):** 6 files đúng scope (5 modified + 1 test mới `phase-09-intake-stuck-fix.test.ts`); scoped suite 7/7 xanh; root `check-types` sạch (3 turbo tasks exit 0); full API suite = 28 failures pre-existing baseline (stash experiment: 0 attributable GA-02); reviewer APPROVED_WITH_NITS (1 MINOR + env-restore NIT đã xử lý bởi advisor); decision doc invariant-1 wording đã sửa. Working tree sạch changes ngoài scope; chưa stage/commit — next step = user duyệt commit (chỉ 6 file code + decision doc + plans dir).

## Key Dependencies

- Phase 03 (tests) cần phase 01 xong (test trực tiếp code đã sửa).
- Phase 02 độc lập (FE copy), có thể chạy song song phase 01/03.
- Không phase nào đụng `schema.prisma`, migration, hay Prisma CLI mutation.

## Điểm sửa (từ decision doc — không thêm scope)

| # | File | Sửa |
|---|---|---|
| 1 | `create-order.usecase.ts:166-172` | Bỏ push stage; giữ `payment_status: "paid"` |
| 2 | `payment.repository.ts` `verifyPayment` :175-186 | Bỏ push stage; giữ tem paid |
| 3 | `submit-intake.usecase.ts:217-220` | Bỏ ternary; nhánh triage_pending luôn `T2_SUBMIT_INTAKE` |
| 4 | `StatusGuidanceCard.tsx` (intake_ready) | Copy: hành động giờ là "Nộp hồ sơ", không còn "chỉ cập nhật" |
| 4b | `StatusGuidanceCard.tsx` (intake_pending, non-free) | Dọn nghĩa "ép trả trước": title/body → "có thể nộp trước, thanh toán sau"; giữ nút "Thanh toán ngay" (gợi ý) |
| 4c | `notification-templates.ts:17-29` (STAGE_LABELS) | "Chờ thanh toán" → "Chờ nộp hồ sơ"; "Sẵn sàng khởi động" → "Đã cập nhật hồ sơ" |
| 5 | Test mới (apps/api, node:test) | 2 path + verify 2 writer không còn ghi stage |

## Hệ quả thiết kế (tự lành, không đụng DB)

- Case đang kẹt (paid + `intake_ready`) tự gỡ: user nộp lại → `T2` → `submitted`. **KHÔNG sửa DB tay.**
- Nộp trước trả sau: `submitted` + `unpaid` → `T5` chặn 402 → mua credit → duyệt được.
- Trả trước bỏ cuộc: credit nằm ở case → policy refund (P2, ngoài scope).

## Ràng buộc bắt buộc

- **DB SAFETY tuyệt đối:** KHÔNG `prisma migrate dev/reset/db push`; KHÔNG DROP/DELETE/TRUNCATE; KHÔNG sửa migration. Plan này không có schema/migration change. Rule: `.agents/rules/prisma-migration-safety.md`.
- **Chỉ touch file liệt kê ở trên.** Working tree có UNRELATED changes (docs/flows/*, .drawio-tmp/, logs/…) — KHÔNG đụng.
- Tests: `node:test` + `node:assert`, đặt trong `apps/api/src/shared/infrastructure/tests/`.
