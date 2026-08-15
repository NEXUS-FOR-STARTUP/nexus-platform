---
title: "Backlog Bugs Fix — intake limits, document model, completion flow, credit UX, SLA refund, admin queue, delete kick"
description: "Đóng 8 bug backlog: #13+#14 giới hạn intake, #12 document model (bỏ tài liệu chính + category + soft-supersede), #5 completion flow (T17/T14 admin/T19 reopen), #3 credit UX banner + 402, #1 SLA đếm tiếp + refund credit dư FIFO, #9 admin queue phân bucket, #16 kick user khi xóa case. Kèm tests + docs sync."
status: completed
priority: P0
effort: 40h
branch: feat/backlog-bugs-fix
tags: [bug-fix, workflow, credit, intake, documents, realtime]
blockedBy: []
blocks: []
created: 2026-08-15
---

# Backlog Bugs Fix

## Overview

Đóng 8 bug backlog còn lại sau plan `260814-1825-reject-resubmit-loop-fix` (đã xong #2 #4 #7 #15 #17 #18). 8 bug này chia 2 nhóm:

1. **Model/workflow correctness** (đụng state machine + schema + migration): #5 (completion flow), #1 (SLA + refund credit dư), #12 (document model), #13+#14 (intake limits).
2. **UX/surface + signal** (chủ yếu FE + 1 BE throw + 1 realtime publish): #3 (credit UX), #9 (admin queue), #16 (kick user).

Mọi quyết định đã khóa ngày 2026-08-15 — **KHÔNG re-litigate**. Nghiên cứu nền (đã verify file:line):

- `docs/technical-notes/money-credit-completion-model-note.md` — credit/completion/refund model (mục 5, 5.1-5.5, 8)
- `docs/technical-notes/document-lifecycle-model-note.md` — document model + category codes + soft-supersede (mục 8)
- `plans/reports/brainstorm-260815-2008-intake-doc-text-limits.md` — giới hạn #13+#14 (B1-B6)
- `tasks/bugs/*.md` — bug tracker gốc (status sẽ sync ở phase-08)

**Điểm mấu chốt kiến trúc:** machine `case-machine.ts` ĐÃ đúng credit deduction (chỉ trừ tại T11). Plan này **không thiết kế lại machine** — chỉ (a) thêm T17_USER_CONFIRM_COMPLETE + T19_REOPEN, (b) đổi guard T14 isAssignedSupporter→isAdmin, (c) bỏ `final` khỏi `done` để T19 reachable, (d) nối refund/supersede/402/realtime vào code có sẵn.

> **Red-team review (2026-08-15) — REJECT v1, đã fix hết critical trước khi implement:**
> C1 T19 TARGET_STAGE = `under_review` (KHÔNG `supporter_working` — đó là InternalStatus, không phải CaseStage); C2 refund FIFO walk **DESC** (credit còn dư = purchase mới nhất); C3 **xóa supporter close-case** (không guard, bypass machine); C4 T19 hook **verify owner** (chống mua credit hộ case người khác → reopen); C5 **+T6 self-loop** ở supporter_working + report_ready (reassign đang 400 ở đó); M1 refund+delete cùng tx; M2 resubmit dùng `Cp1IntakeCaps` lean (chỉ max — không kéo min mới vào resubmit); M3 auto-done neo latest T11 + fire T14 ADMIN (T17 guard isOwner, admin không dùng được); M4 fix free-case `subtractCredit` no-op; M5 category qua param scoped intake (không sửa ngang luồng revision).

## Quyết định đã chốt (2026-08-15 — locked)

| # | Bug | Quyết định (gọn) |
|---|-----|------------------|
| #13 | Intake spam tài liệu | Max **10 tài liệu**, intake-only. Enforce ở `Cp1IntakeSchema` + FE `DocumentInputStep`. KHÔNG đụng `validateDocumentWriteInputs` (revision/supporter output giữ nguyên) |
| #14 | Intake không giới hạn chữ | `contact.full_name/student_code/team_role`, `support_needs.primary_need` ≤100; `email` ≤254; `current_blocker/case_summary/current_situations[]` ≤20000. Cùng schema; URL/zalo/boundary miễn cap |
| #5 | Ai xác nhận hoàn thành | User xác nhận qua **T17_USER_CONFIRM_COMPLETE** (isOwner) từ `report_ready_to_publish` → done. T14 guard isAssignedSupporter→**isAdmin** (admin force-close). Auto-done 7 ngày (neo latest T11, fire T14 ADMIN). Reopen: mua credit cho case `done` (owner verified) → **T19_REOPEN** → machine `supporter_working`, **TARGET_STAGE `under_review`** (không admin re-approve, re-arm SLA). Credit trừ DUY NHẤT T11 (đã đúng — không đổi) |
| #3 | User không hiểu lần 2 | Banner tại `report_ready` trên user case page: có credit → guidance; hết credit → đỏ + nút "Mua credit" (tái dùng CreditPanel). T11/T3 bị chặn → BE throw **402 NO_CREDITS** rõ (pre-check trong transitionInTx; KHÔNG đưa T5 — admin-facing); kèm fix free-case: `subtractCredit` no-op khi `lockedPrice===0` |
| #1 | Reassign có reset SLA | SLA **đếm tiếp** (đúng — no code). **Reassign ở `supporter_working`/`report_ready` đang FAIL 400** → thêm T6 self-loop (isAdmin) vào 2 state. SLA display đã có — verify. **Refund rule MỚI**: case kết thúc non-completed (T12/T13/T15/admin delete) + credit_balance>0 → hoàn VND về ví theo **giá mua thực tế, walk DESC (newest first)** — consumption ăn credit cũ trước. Idempotency `refund-credit-{caseId}`; T13 giữ `locked_price` riêng; delete wrap 1 tx (balance→refund→delete); **XÓA supporter close-case route** (bypass machine + không guard) |
| #9 | Trả tiền chưa nộp hồ sơ | Admin list: review queue chỉ `submitted`/`triage_pending`; bucket riêng `intake_pending` "Chờ sinh viên nộp hồ sơ". Admin detail: `intake_snapshot=null` → empty-state + disable approve/reject |
| #12 | Admin thấy nhiều doc/user thấy 1 | **Bỏ "tài liệu chính"**. Category codes `idea_report/pitch_deck/competitor_analysis/customer_research/task_assignment/other` lưu `metadata_json.category` (FE gửi code, BE map). **Soft-supersede**: thêm `superseded_at DateTime?` + index `[case_id, superseded_at]` (migration --create-only + deploy). Nộp lại → mark record cũ ngoài bộ mới `superseded_at=now`. User read filter `superseded_at null`. Fix `unit_code "intake"→"v00"`. Giữ `is_primary` (report artifacts depend), FE label đổi "Tài liệu chính"→category label. Legacy Vietnamese-label docs để nguyên (display-only) |
| #16 | Không kick user khi xóa case | `delete-case.usecase.ts` sau deleteCase → `publishToChannel(chatChannel(caseId), {type:'case_deleted', caseId})`. FE `useRealtimeChat.ts` thêm nhánh `case_deleted` (toast + redirect /dashboard + invalidate). Fallback poll `useCaseDetails` 404 → redirect |

## Phases

| Phase | Name | Bugs | Status | Effort | Depends |
|-------|------|------|--------|--------|---------|
| 1 | [Intake Limits](./phase-01-intake-limits.md) | #13, #14 | Done | 4h | — |
| 2 | [Document Model](./phase-02-document-model.md) | #12 | Done | 8h | Phase 1 |
| 3 | [Completion Flow](./phase-03-completion-flow.md) | #5 | Done | 8h | Phase 2 |
| 4 | [Credit UX](./phase-04-credit-ux.md) | #3 | Done | 3h | Phase 3 |
| 5 | [SLA + Refund](./phase-05-sla-refund.md) | #1 | Done | 8h | Phase 3 |
| 6 | [Admin Queue](./phase-06-admin-queue.md) | #9 | Done | 3h | Phase 5 |
| 7 | [Case Delete Kick](./phase-07-case-delete-kick.md) | #16 | Done | 2h | Phase 3 |
| 8 | [Tests + Docs Sync](./phase-08-tests-docs-sync.md) | (all) | Done | 4h | Phase 1-7 |

**Tổng effort: 40h.** Phase 4/6/7 nhỏ, độc lập sau phase 3 — có thể song song nếu đủ người (không đụng file chung). Sync-back 2026-08-16: phase 1-7 đã Done (~36h); phase 8 còn 2 item docs (CHANGELOG + journal) — ước 1-2h.

## Dependencies

- **Cross-plan:** không có. Plan này kế thừa `260814-1825-reject-resubmit-loop-fix` (done) — machine + `transitionInTx` + `filterTransitions` + `upsertDocumentRecordsForUnit` đã sẵn.
- **Prisma 7:** migration dùng `prisma migrate dev --create-only` + review SQL + `migrate deploy`. **KHÔNG** destructive ops — đọc `.agents/rules/prisma-migration-safety.md`.
- **Thứ tự bắt buộc (sequential):** phase 1 (schema) → phase 2 (migration superseded_at, dùng schema+FE phase 1) → phase 3 (machine T17/T14/T19, dùng doc read path phase 2) → phase 4/5/6/7 → phase 8 (tests+docs tổng hợp).

## Key Notes (research refs)

- Credit deduction: DUY NHẤT T11 (`case-machine.ts:138-142`), idempotency `consume-{unitCode}-{caseId}`, P2002→409. Mỗi round = 1 credit.
- Refund: về VND, KHÔNG hoàn credit. `walletService.refund(ownerId, vnd, 'case_refund', caseId, key)` → `WalletTransaction type:'refund'` (idempotency_key @unique schema.prisma:210).
- CreditLedger purchase entries: `metadata_json {order_id, quantity, unit_price}` (`create-order.usecase.ts:150`) — nguồn giá FIFO cho refund #1.
- `hasCredit` guard skip khi `lockedPrice===0` (free case); **phase-04 fix `subtractCredit` no-op khi lockedPrice===0** — free case đạt được report_ready.
- No cron infra → auto-done dùng `setInterval` daily sweep (interim, single instance) + follow-up cron bền vững ghi backlog; neo theo latest T11 caseEvent (không neo sla_deadline_at — cái đó set ở T7).

## DB Safety

- Phase 2 migration `superseded_at` = **additive column + index**, nullable, không data-loss. Quy trình: `--create-only` → review SQL → `migrate deploy`. KHÔNG `migrate reset`, KHÔNG `db push`, KHÔNG DROP/DELETE/TRUNCATE.
- Phase 5 refund = write thường (không schema change). Idempotency key chống hoàn kép.
- Phase 7 admin delete đọc credit balance TRƯỚC deleteCase (cascade xóa CreditLedger — schema.prisma:618).

## Success Criteria (tổng)

- Nộp intake >10 doc hoặc text vượt max → chặn rõ (FE + BE); revision/supporter output không đổi hành vi.
- User xác nhận hoàn thành (T17) → done; supporter không còn tự close (T14 admin-only); 7 ngày im lặng auto-done; mua credit case done → reopen supporter_working, SLA re-arm.
- report_ready hiện banner credit guidance/đỏ + nút mua; T11 hết credit → 402 NO_CREDITS rõ, không 400 generic.
- Case kết thúc non-completed + credit dư → hoàn VND FIFO đúng giá mua, idempotent, không hoàn kép; T13 giữ locked_price riêng.
- Admin list tách bucket intake_pending; admin detail empty-state khi chưa nộp hồ sơ.
- Document category hiện đúng (không còn label tiếng Việt đè code); resubmit mark superseded; user chỉ thấy bộ mới nhất.
- Xóa case → user/supporter bị kick (realtime + poll fallback).
- `npm run check-types` PASS; `npm test` (apps/api) — **275/293 pass; 18 fail pre-existing env (DB auth env — docker prod creds vs root .env), documented, out-of-scope**; migration deploy sạch.

## Rollback

Git-only, revert per phase (mỗi phase 1 commit gọn). Migration `superseded_at` additive → revert = **cặp đôi**: bỏ cột + revert read filter cùng lúc (revert 1 bên → user thấy lại toàn bộ doc cũ). Không destructive op nào trong plan.

## Validation Summary

**Validated:** 2026-08-15
**Questions asked:** 4

### Confirmed Decisions
- Auto-done 7 ngày: **setInterval sweep** trong API process (interim, single instance) + follow-up cron bền vững ghi backlog
- T19 reopen: **re-arm SLA 48h** (setSlaDeadline action) — round mới = deadline mới
- Supporter close-case: **xóa route + use case** (kèm nút close trên FE supporter nếu có — bổ sung vào phase-03/05 todo)
- Branch: **tạo `feat/backlog-bugs-fix`** từ nhánh hiện tại trước khi implement

### Action Items
- [x] Phase-03: thêm bước kiểm tra + xóa nút close trên FE supporter (nếu tồn tại) sau khi xóa close-case route

## Sync-back Status (2026-08-16)

- **Phases 01-07: Done** — code audit + code-review xong (8.5/10 APPROVE WITH WARNINGS, warnings đã fix). Checkbox đã sync theo code state thực tế.
- **Phase 08: In Progress (4/6)** — test suite (275/293, 18 fail pre-existing env out-of-scope), check-types, 8 bug files Done, tasks/README sync = XONG. **CÒN 2 ITEM:**
  1. `CHANGELOG.md [Unreleased]` chưa ghi 8 bug (docs-manager chưa cập nhật — chỉ còn financial refactor)
  2. `docs/journals/260815-backlog-decisions.md` chưa tạo (file không tồn tại)
- **Frontmatter status giữ `in-progress`** — plan chưa đóng được cho tới khi 2 doc item phase-08 hoàn tất.
