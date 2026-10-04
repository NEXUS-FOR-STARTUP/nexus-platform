# Backlog Bugs Fix — đóng 8 bug còn lại (intake caps, document model, completion flow, credit UX, SLA refund, admin queue, delete kick)

**Date**: 2026-08-16
**Status**: Completed (8/8 phases) — chờ plan-close
**Component**: apps/api + apps/web-1 (+ migration `20260816170000_add_document_record_superseded_at`)
**Plan**: 260815-2154-backlog-bugs-fix (P0, effort 40h, branch `feat/backlog-bugs-fix`)

## What Happened

Đóng nốt 8 bug backlog sau plan `260814-1825-reject-resubmit-loop-fix` (#2 #4 #7 #15 #17 #18 đã xong trước). 8 phases, 40h. Mọi quyết định khóa 2026-08-15 — không re-litigate. Code review **8.5/10**; warnings đã fix hết. Tests **275/293** (18 lỗi env pre-existing, không liên quan). **45 test mới**.

## Key Decisions (chốt 2026-08-15, locked)

| Bug | Quyết định |
|-----|-----------|
| #13 | Max **10 tài liệu**, intake-only (`Cp1IntakeCaps` + FE `DocumentInputStep`); revision/supporter output không đổi |
| #14 | Text caps: `full_name/student_code/team_role/primary_need` ≤100, `email` ≤254, `current_blocker/case_summary/current_situations[]` ≤20000 |
| #5 | User xác nhận qua T17 (isOwner) → done; T14 **admin-only** force-close; auto-done 7 ngày; mua credit case `done` → T19_REOPEN → `under_review` + re-arm SLA |
| #3 | Banner credit guidance tại `report_ready` (có/hết credit 2 trạng thái); T11/T3 hết credit → 402 `NO_CREDITS`; free case `subtractCredit` no-op |
| #1 | SLA **đếm tiếp** (không reset); T6 self-loop (isAdmin) ở `supporter_working` + `report_ready`; refund credit dư FIFO giá mua thực tế, idempotency `refund-credit-{caseId}`; xóa supporter close-case |
| #9 | Admin queue tách bucket `intake_pending`; detail empty-state khi `intake_snapshot=null` |
| #12 | Bỏ "tài liệu chính"; category codes vào `metadata_json.category`; soft-supersede `superseded_at`; user read filter `null`; `unit_code v00` |
| #16 | Delete case → publish `case_deleted` trên `chat:{caseId}` + FE kick/redirect + poll fallback 404 |

## What Was Built (per phase)

1. **Intake Limits** (#13 #14) — `Cp1IntakeCaps` schema + FE validation; BE reject rõ (FE + BE cùng chặn).
2. **Document Model** (#12) — migration additive `superseded_at` + index (--create-only → review → deploy); `buildSupersedeUpdateArgs` khi nộp lại; read filter `superseded_at null`.
3. **Completion Flow** (#5) — T17/T14 guard swap trong machine; auto-done sweep `auto-done-sweep.ts`; T19 trong `create-order.usecase.ts` (owner verify → 403 nếu mua hộ).
4. **Credit UX** (#3) — banner vào `StatusGuidanceCard`; 402 `NO_CREDITS` pre-check trong `transitionInTx`; fix free-case.
5. **SLA + Refund** (#1) — `services/credit-refund.ts`: walk purchases **DESC**, giá từ `metadata_json.unit_price` → fallback `orderItem.unit_price`; gọi từ T12/T13/T15 + admin delete (chung 1 tx với delete); T13 giữ `locked_price` riêng.
6. **Admin Queue** (#9) — FE-only: bucket `intake_pending` + review queue lọc terminal states; gate approve/reject trên `intake_snapshot`.
7. **Case Delete Kick** (#16) — publish realtime sau deleteCase; FE nhánh `case_deleted` (toast + redirect + invalidate); `useCaseDetails` 404 → redirect.
8. **Tests + Docs Sync** — 45 test mới; bug files + `tasks/README.md` → Done; technical-notes Implementation blocks; CHANGELOG [Unreleased]; journal này.

## Red-Team Critical Fixes (apply trước khi implement)

- **C1**: T19 `TARGET_STAGE = under_review` (KHÔNG `supporter_working` — InternalStatus, không phải CaseStage).
- **C2**: Refund FIFO walk **DESC** — credit dư thuộc purchase mới nhất (consumption ăn credit cũ trước).
- **C3**: Xóa supporter close-case route — không guard, bypass machine.
- **C4**: T19 hook verify owner — chống mua credit hộ case người khác → reopen.
- **C5**: Thêm T6 self-loop ở `supporter_working` + `report_ready` — reassign đang 400 ở đó.
- **M1**: Refund + delete chung 1 tx. **M2**: Resubmit dùng `Cp1IntakeCaps` lean (chỉ max, không kéo min mới). **M3**: Auto-done neo latest T11 + fire T14 ADMIN. **M4**: Fix free-case `subtractCredit` no-op. **M5**: Category qua param scoped intake.

## Verification

- `npm run check-types` PASS; tests 275/293 (18 env pre-existing); migration deploy sạch.
- Ví dụ test refund: mua 3@39k rồi 2@49k, tiêu 2 → hoàn 137,000 VND (2×49k + 1×39k).

## Known Leftovers

- **18 test failures pre-existing** (env DB auth, không phải regression của plan này).
- **Auto-done = `setInterval` daily sweep** (interim, single instance) — follow-up: cron bền vững, ghi backlog.
- **Manual browser verify pending** — chưa click-through dev-server cho banner credit, admin bucket, kick xóa case.
- Plan.md frontmatter còn `status: in-progress` — bước đóng plan (status done + report `plans/reports/`) chưa thực hiện.

## Unresolved

Ai đóng plan (status done + báo cáo tổng kết)? Cron auto-done khi nào làm?
