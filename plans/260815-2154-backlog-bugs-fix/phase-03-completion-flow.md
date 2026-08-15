# Phase 03 — Completion Flow (#5)

- Priority: P0 | Status: Pending | Effort: 8h
- Depends: Phase 02 | Blocks: Phase 04, 05, 07

## Overview

Chốt ai xác nhận hoàn thành: **user** (T17) từ `report_ready_to_publish` → done. Supporter không tự close (T14 → admin-only force-close). Auto-done 7 ngày. Reopen: mua credit cho case `done` → T19_REOPEN.

> **Red-team fixes đã áp dụng:** C1 (T19 TARGET_STAGE = `under_review`, KHÔNG `supporter_working` — `supporter_working` là InternalStatus, không phải CaseStage, sẽ ghi user_facing_stage hỏng + vỡ check-types); C4 (T19 hook bắt buộc verify `owner_auth_user_id === userId` — chống cross-user reopen); M3 (auto-done neo theo latest T11 event, fire qua T14 admin — KHÔNG dùng T17 vì guard isOwner); m4 (T19 chỉ fire khi `internal_status === 'done'`, ngược lại no-op); m6 (setInterval = interim, ghi follow-up cron bền vững).

## Requirements

- T17_USER_CONFIRM_COMPLETE (isOwner) từ `report_ready_to_publish` → `completed` (TARGET_STAGE).
- T14_COMPLETE guard: `isAssignedSupporter` → `isAdmin` (admin force-close).
- Auto-done: `report_ready_to_publish` + **latest T11 caseEvent > 7 ngày** → fire **T14 với actor ADMIN** (T17 guard isOwner — admin không dùng được T17). Interim: setInterval sweep; follow-up: cron bền vững (outbox-relay/Cloud cron).
- Reopen: order credit purchase cho case `internal_status === 'done'` + **owner verified** → T19_REOPEN → machine target `supporter_working`, TARGET_STAGE `under_review`; không admin re-approve; re-arm SLA (`setSlaDeadline` action). Case KHÔNG done → no-op (không fail order).
- Credit deduction KHÔNG đổi — chỉ trừ tại T11 (machine đã đúng).
- `done` state phải bỏ `type:'final'` để T19 reachable.

## Architecture

### 1. Machine (`case-machine.ts`)

- `report_ready_to_publish` block (:169-181): T14 guard isAssignedSupporter→isAdmin (:171-175); thêm T17 sibling `{ target:'done', guard:'isOwner', actions:'notifyUser' }`.
- `done` state (:183-185): **bỏ `type:'final'`**, thêm `on: T19_REOPEN { target:'supporter_working', guard:'isOwner', actions:'setSlaDeadline' }`.
- Guard: `isOwner` (:15-16) dùng cho T17 + T19 (defense-in-depth — hook cũng check ownership).
- `transition.types.ts`: TransitionName +T17/T19 (:5-21), ALL_TRANSITIONS (:23-29), TARGET_STAGE (:31-48): **T17→`completed`, T19→`under_review`** (mirror T7 — KHÔNG dùng `supporter_working` vì đó là InternalStatus, không nằm trong VALID_CASE_STAGES).

### 2. BE

- `case-transition.service.ts`: `setSlaDeadline` (:137-144) hiện chỉ chạy ở T7 (:112) → thêm actions `'setSlaDeadline'` cho T19 (re-arm now+48h).
- `create-order.usecase.ts` hook (:141): sau `creditLedger.create`:
  1. Đọc case theo `metadata_json.case_id` (:138)
  2. **Verify `case.owner_auth_user_id === userId`** — nếu không → 403 FORBIDDEN (chống mua credit vào case người khác + fire T19 hộ)
  3. Nếu `internal_status === 'done'` → fire T19_REOPEN (actorId=userId, roleVerified CUSTOMER). Ngược lại (chưa done / đã reopened) → **no-op**, order vẫn thành công
- `complete-case.usecase.ts:15-19` pre-gate → admin-only (T14). `update-case-status.usecase.ts:18` map `'report_ready_to_publish:done'`→T14 (admin force-close path) — giữ nguyên.
- Auto-done sweep: `setInterval` daily — scan `internal_status='report_ready_to_publish'`, tìm latest caseEvent `T11_SUBMIT_OUTPUT`, nếu `created_at < now-7d` → fire T14 với `roleVerified: 'ADMIN'`. Pattern `outbox-relay.ts:17`. Ghi caseEvent `auto_completed`. **Interim — follow-up task: cron bền vững.**

### 3. FE

- `_types/transitions.ts`: +T17 `{roles:["CUSTOMER"], actor:"owner"}`; T14 roles `["SUPPORTER"]→["ADMIN"]` (:34); **T19: KHÔNG thêm rule** (bỏ qua = filterTransitions trả false = không render nút — reopen chỉ trigger từ mua credit, không có nút).
- `StatusGuidanceCard.tsx:246-261`: report_ready static copy → thêm nút "Xác nhận hoàn thành" (T17) + banner branches. **Phải return trước STATIC_COPY fallback** (chống double-render).
- `supporter/case/[id]/page.tsx`: bỏ nút "hoàn thành" (:195-206) + hasActionBar (:89) + banner "Đã giao, chờ sinh viên xác nhận" (pattern :149-154).
- `supporter/page.tsx:24-26`: retitle tab "Đã giao" (report_ready_to_publish đang sai vào done bucket).

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/modules/cases/domain/case-machine.ts` (169-185) | SỬA: +T17, T14 guard isAdmin, bỏ final khỏi done, +T19 (guard isOwner + setSlaDeadline) |
| `apps/api/src/modules/cases/domain/transition.types.ts` (5-48) | SỬA: +T17/T19 names, ALL_TRANSITIONS, TARGET_STAGE (T17→completed, T19→under_review) |
| `apps/api/src/services/case-transition.service.ts` (112, 137-144) | SỬA: setSlaDeadline cho T19 |
| `apps/api/src/modules/cases/application/complete-case.usecase.ts` (15-19) | SỬA: admin-only pre-gate |
| `apps/api/src/modules/cases/application/update-case-status.usecase.ts` (18) | VERIFY: map report_ready→T14 |
| `apps/api/src/modules/orders/application/create-order.usecase.ts` (141-152) | SỬA: hook T19 (owner check + done check + no-op ngược lại) |
| `apps/api/src/modules/cases/application/` (sweep) | TẠO: auto-done sweep (setInterval, neo latest T11, fire T14 ADMIN) |
| `apps/web-1/_types/transitions.ts` (34) | SỬA: +T17, T14 ADMIN; KHÔNG thêm T19 |
| `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx` (246-261) | SỬA: nút xác nhận + banner (return trước static copy) |
| `apps/web-1/app/supporter/case/[id]/page.tsx` (89, 149-154, 195-206) | SỬA: bỏ nút hoàn thành, banner chờ xác nhận |
| `apps/web-1/app/supporter/page.tsx` (24-26) | SỬA: retitle tab "Đã giao" |
| `apps/api/src/shared/infrastructure/tests/phase-07-xstate-case-machine.test.ts` | SỬA: test T17/T14 admin/T19 + done non-final |

## Implementation Steps

1. transition.types.ts: thêm T17/T19 vào TransitionName, ALL_TRANSITIONS, TARGET_STAGE (T17→completed, **T19→under_review**).
2. case-machine.ts: +T17 trong report_ready_to_publish; T14 guard isAdmin; done bỏ final + on T19 (guard isOwner, actions setSlaDeadline).
3. case-transition.service.ts: setSlaDeadline trigger thêm ở T19.
4. create-order.usecase.ts: hook — owner check (403) → done check (no-op nếu không done) → fire T19.
5. complete-case.usecase.ts admin-only pre-gate.
6. Auto-done sweep: setInterval daily, neo latest T11 event > 7d, fire T14 roleVerified ADMIN, ghi caseEvent auto_completed. Ghi follow-up cron bền vững vào backlog.
7. FE transitions.ts (T17/T14; không T19) + StatusGuidanceCard + supporter pages.
8. Test machine: T17 owner-only; T14 admin-only (supporter null); done có T19 (owner-only); getAvailableTransitions.
9. `npm run check-types` + `npm test`.

## Todo List

- [ ] transition.types.ts: +T17/T19 (names, ALL_TRANSITIONS, TARGET_STAGE — T19→under_review)
- [ ] case-machine.ts: T17, T14→isAdmin, done bỏ final + T19 (isOwner + setSlaDeadline)
- [ ] case-transition.service.ts: setSlaDeadline ở T19
- [ ] create-order.usecase.ts: hook T19 — owner verify + done check + no-op
- [ ] complete-case.usecase.ts: admin-only
- [ ] Auto-done sweep (7 ngày kể từ latest T11, fire T14 ADMIN, setInterval interim)
- [ ] FE: transitions T17/T14 (không T19) + StatusGuidanceCard nút xác nhận + supporter pages
- [ ] Test machine T17/T14/T19
- [ ] `npm run check-types` + `npm test` PASS
- [ ] Manual: supporter nộp → report_ready → user xác nhận → done; supporter không còn nút hoàn thành; admin force-close; mua credit case done (chủ case) → reopen; mua credit case done của người khác → 403

## Success Criteria

- User xác nhận hoàn thành (T17) → done, tick rõ 2 phía.
- Supporter không tự close (T14 admin-only); admin force-close hoạt động.
- 7 ngày im lặng sau báo cáo → auto-done.
- Mua credit case done (đúng chủ case) → T19 reopen, SLA re-arm, không admin re-approve; mua hộ case người khác → 403; order cho case không done → no-op không fail.
- `done` không phải final (T19 reachable); credit deduction vẫn chỉ T11; `user_facing_stage` không bao giờ = `supporter_working`.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Bỏ `final` khỏi done → getAvailableTransitions('done') có T19, FE hiện nút sai | Thấp | Trung bình | KHÔNG khai T19 trong FE rules → filterTransitions bỏ → không nút; T19 chỉ fire từ order hook |
| Auto-done sweep race với T17 user thật | Thấp | Thấp | Sweep check lại internal_status trước fire (only report_ready); T14 guard isAdmin |
| T19 hook double-fire (order lần 2) | Thấp | Thấp | Chỉ fire khi internal_status === 'done'; đã reopened → no-op |
| setSlaDeadline re-arm T19 làm sai SLA lịch sử | Thấp | Trung bình | Chỉ set khi vào supporter_working qua T19, ghi caseEvent |
| setInterval không sống qua restart / multi-instance | Trung bình | Thấp | Interim chấp nhận (single instance); follow-up cron bền vững ghi backlog |

## Next Steps

→ Phase 04 (credit UX #3) + Phase 05 (SLA refund #1) + Phase 07 (delete kick #16) — song song được.
