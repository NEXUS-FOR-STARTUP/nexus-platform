# Phase 04 — Review & Verify

- Priority: P1 | Status: implemented | Effort: 0.5h
- Depends: Phase 01, 02, 03 | Blocks: —

## Context Links

- Quyết định gốc: `docs/research/decision-2026-08-25-intake-payment-stage-separation.md`
- Single writer: `apps/api/src/services/case-transition.service.ts`
- DB safety rule: `.agents/rules/prisma-migration-safety.md`
- Test script: `apps/api/package.json` → `npm test` / `npm run check-types`

## Overview

Review diff theo đúng 5 điểm sửa của decision doc, chạy verify scoped (check-types + test), xác nhận không regression và không đụng DB.

## Key Insights

- `verifyPayment` (payment.repository.ts) là dead code HTTP — không có smoke test live; verify qua unit test B1 + review diff.
- `createOrderUseCase` là live path `POST /api/orders` — regression surface chính cần verify `payment_status: "paid"` vẫn được ghi.
- `submitIntakeUseCase` live path `POST /api/cases/:id/intake` — regression surface: submit vẫn 201 + stage `submitted`.
- Working tree có UNRELATED changes → review chỉ so `git diff` trên đúng 4 file đã sửa + 1 file test mới.

## Requirements

- Xác nhận đúng 5 điểm sửa, không thêm scope.
- Xác nhận không còn writer `user_facing_stage` ngoài `transitionInTx`.
- Xác nhận không đụng schema/migration/Prisma CLI mutation.

## Architecture

Không đổi. Chỉ xác minh bất biến: single writer stage + submit = submitted.

## Related Code Files

- Sửa (review): `create-order.usecase.ts`, `payment.repository.ts`, `submit-intake.usecase.ts`, `StatusGuidanceCard.tsx`
- Tạo (review): `phase-09-intake-stuck-fix.test.ts`
- Không đụng: `schema.prisma`, thư mục `prisma/migrations/`, các file working-tree-unrelated

## Implementation Steps

### Step 1 — Review diff (chỉ 4 file + 1 test)

```bash
git diff -- apps/api/src/modules/orders/application/create-order.usecase.ts \
            apps/api/src/modules/payments/infrastructure/persistence/payment.repository.ts \
            apps/api/src/modules/cases/application/submit-intake.usecase.ts \
            apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx \
            apps/api/src/shared/infrastructure/tests/phase-09-intake-stuck-fix.test.ts
```

Checklist:
- [x] `create-order`: chỉ xóa spread stage + bỏ `user_facing_stage` khỏi select; `payment_status: "paid"` còn — reviewer 5/5 khớp
- [x] `verifyPayment`: khối push stage (176-186) đã xóa; nhánh paid còn credit branch; `payment_status` còn.
- [x] `submit-intake`: `const transition = "T2_SUBMIT_INTAKE"`; không còn nhánh `T16_EDIT_INTAKE`.
- [x] `StatusGuidanceCard`: chỉ đổi chữ title/body/button ở branch `intake_ready`; logic không đổi.
- [x] KHÔNG có diff nào khác (không đụng schema/migration/UNRELATED files) — git status chỉ 5 file scoped + 1 test mới

### Step 2 — Verify không còn writer stage ngoài machine (grep)

```bash
# Chỉ case-transition.service.ts (transitionInTx) được phép ghi user_facing_stage
# Các site cũ phải im lặng:
grep -rn "user_facing_stage: \"intake_ready\"" apps/api/src/modules/orders apps/api/src/modules/payments || echo "OK: no stage push"
grep -rn "user_facing_stage" apps/api/src/modules/orders/application/create-order.usecase.ts || echo "OK: create-order clean"
grep -rn "user_facing_stage" apps/api/src/modules/payments/infrastructure/persistence/payment.repository.ts || echo "OK: payment.repository clean"
```

Kỳ vọng: `create-order.usecase.ts` và `payment.repository.ts` không còn reference `user_facing_stage`.

### Step 3 — Type check (apps/api)

```bash
cd apps/api && npm run check-types
```

Kỳ vọng: pass. (Xác nhận xóa field select không để lại reference lỗi; ternary→literal không lỗi type.)

### Step 4 — Test scoped + full

```bash
cd apps/api && npx tsx --test src/shared/infrastructure/tests/phase-09-intake-stuck-fix.test.ts
cd apps/api && npm test   # full suite — xác nhận không regression
```

Kỳ vọng: phase-09 xanh; full suite xanh (đặc biệt phase-07/08 không vỡ — machine không đổi).

### Step 5 — DB safety audit (KHÔNG chạy, chỉ xác nhận)

- [x] KHÔNG chạy `prisma migrate dev/reset/db push` — implementer/tester/reviewer xác nhận
- [x] KHÔNG sửa `schema.prisma` / `prisma/migrations/*`.
- [x] KHÔNG chạy DROP/DELETE/TRUNCATE.
- [x] `git status` chỉ có 5 file sửa + 1 file test mới (ngoài các UNRELATED changes đã có sẵn) — confirm thực tế

## Todo List

- [x] Review diff 4 file + 1 test theo checklist — reviewer: 5/5 điểm sửa khớp decision doc
- [x] Grep xác nhận 2 writer cũ đã sạch `user_facing_stage` — orders module + payment.repository: 0 matches
- [x] `npm run check-types` (apps/api) pass — root, 3 turbo tasks exit 0
- [x] Chạy phase-09 test (scoped) → 7/7 pass, exit 0
- [ ] Chạy full `npm test` pass — KHÔNG đạt: 28 pre-existing baseline failures (stash-proven identical, 0 attributable GA-02) — follow-up ticket ngoài scope
- [x] DB safety audit (không chạy gì, chỉ xác nhận không đụng) — không migrate/push/DDL; schema/migrations untouched

## Success Criteria

- [x] Diff khớp chính xác 5 điểm sửa của decision doc, không thêm/bớt — reviewer table 5/5 khớp
- [x] Không còn writer `user_facing_stage` ngoài `transitionInTx` (trong 3 file API) — grep 0 refs trong 3 file; submit chỉ đọc `fromStage`
- [x] `check-types` xanh — root exit 0 (api/web-1/validation)
- [ ] Full test xanh — KHÔNG đạt: 28 pre-existing baseline failures, 0 attributable GA-02 (ngoài scope, cần follow-up)
- [x] Không đụng schema/migration; không Prisma CLI mutation — implementer/tester/reviewer đều xác nhận

## Risk Assessment

| Rủi ro | Khả năng | Tác động | Giảm thiểu |
|---|---|---|---|
| Regression ở `createOrderUseCase` (mất `payment_status: "paid"`) | Thấp | Cao | Review diff + B2 assert `payment_status: "paid"` |
| Regression ở submit (stage không lên `submitted`) | Thấp | Cao | Machine test A + review diff (T2 literal) |
| Full test vỡ vì test file mới mock chưa chuẩn | Trung bình | Trung bình | Chạy scoped trước, sửa mock, rồi full |
| Lỡ stage vào working-tree dirty | Thấp | Trung bình | `git diff -- <5 file>` + `git status` |

## Security Considerations

- Không thay đổi auth/authorization/role check ở cả 3 site.
- Không mở rộng quyền ghi stage; thu hẹp về single-writer.
- DB: read-only ở bước verify; không mutation.

## Next Steps

- Sau khi xanh: owner/lead review + merge. Không có phase data-repair (case kẹt tự lành khi user nộp lại).
- Policy refund cho "trả trước bỏ cuộc" là P2 ngoài scope — không làm ở đây.
