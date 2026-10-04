# Admin "Từ chối" vs "Yêu cầu làm rõ" — End-to-End Trace

Date: 2026-08-14. READ-ONLY research. Every claim has file:line.

## TL;DR

- **Từ chối** = state-machine transition `T12_REJECT` (executeTransition) → `cancelled` (final). Credit: none. Student sees "rejected" card + intake resubmit button, but resubmit leaves `internal_status='cancelled'` → case invisible to admin triage. Rejection REASON never displayed (event_type mismatch).
- **Yêu cầu làm rõ** = direct DB write (NO machine transition) → `waiting_user`/`need_more_information`. Credit: none. Student sees generic card WITHOUT the request text; the only un-stick button ("Tải tài liệu") posts to `/revisions/upload` which never updates `internal_status` → case stays `waiting_user`, vanishes from admin queue, no supporter assigned, T6/T8 unreachable. Dead-end.

## Flow A — Từ chối (Reject)

### 1. Frontend
- Trigger buttons (only `internal_status==="triage_pending"`): `AdminCaseAssignmentTable.tsx:291,300-306` (menu "Từ chối" → `setRejectingCaseId`); `AdminCaseDetailModal.tsx:237,251-262`.
- Modal `RejectCaseModal.tsx:29-41` (`handleSubmit`, min 10 chars, line 30) → prop `onReject` wired `AdminCaseAssignmentTable.tsx:367-371` ← `page.tsx:624` `handleRejectCase` (`page.tsx:171-186`) → `rejectCase({caseId, reason})`.
- Hook `useAdminCases.ts:41-51`: `POST /admin/cases/${caseId}/reject` body `{reason}`; invalidates `admin-cases`/`admin-case-detail`/`case` (46-50).

### 2. Backend
- Route `admin.routes.ts:30` → `rejectCaseHandler` `admin.controller.ts:101-117`; role gate `getAdminSession` role==='admin' (`admin.controller.ts:27-36`, 102-105).
- Use case `reject-case.usecase.ts:23-29`: `executeTransition({transition:'T12_REJECT', actorId, roleVerified:'ADMIN', data:{reason}})`. Validates reason≥10 (`:18-20`). Emits `CASE_REJECTED` (`:31-37`).

### 3. Machine
- `case-machine.ts:81-84`: `T12_REJECT` on `triage_pending` → target `cancelled`; guard `and(isAdmin, reasonMinLength)`. **No actions** (no refund — refund only on `T13_VETO`, `:141-145`).
- `case-transition.service.ts`: TARGET_STAGE `T12_REJECT→'rejected'` (`:27`); writes `user_facing_stage='rejected'`, `internal_status='cancelled'`, `version_no+1` (`:241-248`); `caseEvent event_type='T12_REJECT'`, `metadata_json={reason}` (`:254-262`, reason allowed `:42`); emits `CASE_STAGE_CHANGED` (`:274-286`). No creditLedger/wallet write for T12.
- Repo `rejectCase()` (`case.repository.ts:261-282`, writes `case_rejected` event) is **dead** — no caller. Current event_type is `T12_REJECT`.

### 4. Result state
`cancelled` = machine `final` (`case-machine.ts:197-211`) but re-entrant via `T3_RESUBMIT_AFTER_REJECT`→`triage_pending` (guard isOwner+hasCredit, `:200-204`). Terminal unless student resubmits.

### 5. Student view
- `StatusGuidanceCard.tsx:189-223` "rejected" branch. Reason lookup `:36-42` matches event_type `case_rejected`|`vetoed` only → **`T12_REJECT` event missed → reason NOT shown**; generic fallback text `:206`.
- `ActivityTimeline.tsx:62-65` same mismatch; `event-details.ts:208-213` FALLBACK → raw label "T12_REJECT".
- Button "Chỉnh sửa hồ sơ để nộp lại" (`:209-220`) → `onOpenIntake` (`page.tsx:130`) → `/dashboard/intake?caseId` → `useIntakeForm.ts:94-95` `POST /cases/:id/intake` → `submitIntakeUseCase` (`submit-intake.usecase.ts:91-111`): sets `user_facing_stage='submitted'` **only**; comment assumes `internal_status` already `triage_pending` (`:89-90`) — false for T12 path. `internal_status` stays `cancelled`.
- Admin list `page.tsx:257-262` filters `triage_pending|accepted_unassigned|assigned` → **resubmitted case invisible in triage** (only via CRUD view). Route `POST /cases/:id/resubmit` (`cases.routes.ts:50`) → `T3_RESUBMIT_AFTER_REJECT` (`resubmit-case.usecase.ts:22-27`) exists but **no FE caller**.
- Notifications: `CASE_REJECTED`+`CASE_STAGE_CHANGED` → student in-app+email (`recipients.ts:16-30,38-46`).

## Flow B — Yêu cầu làm rõ (Request more info)

### 1. Frontend
- Triggers (only `triage_pending`): `AdminCaseAssignmentTable.tsx:293-299`; `AdminCaseDetailModal.tsx:239-250`.
- Modal `RequestMoreInfoModal.tsx:29-41` (min 5 chars `:30`) → `AdminCaseAssignmentTable.tsx:373-377` ← `page.tsx:625` `handleRequestMoreInfo` (`page.tsx:188-203`) → `requestMoreInfo({caseId, query})`.
- Hook `useAdminCases.ts:53-63`: `POST /admin/cases/${caseId}/request-more-info` body `{query}`.

### 2. Backend
- Route `admin.routes.ts:31` → `adminRequestMoreInfoHandler` `admin.controller.ts:123-139`; gate role==='admin' (`:124-127`).
- Use case `request-more-info.usecase.ts:24-52`: idempotent if already `need_more_information`+`waiting_user` (`:29-34`); else `requestCaseMoreInfo(caseId, adminId, "more_info_requested", query, "need_more_information", "waiting_user")` (`:37-44`); emits `REQUEST_MORE_INFO` (`:45-51`).
- Repo `requestCaseMoreInfo` `case.repository.ts:306-327`: direct tx — `user_facing_stage='need_more_information'`, `internal_status='waiting_user'`, `caseEvent event_type='more_info_requested'` `metadata={query}`.

### 3. Machine
- **BYPASSES the machine.** No `executeTransition`. `T8_REQUEST_INFO` exists (`case-machine.ts:126-130`, from `supporter_working`, guard `isAssignedSupporter`, → `waiting_user`) but is **never invoked by admin or supporter request flows** (grep: only tests + `update-case-status.usecase.ts:22` mapping).
- No state guard — can fire from any non-final state; only idempotency check.

### 4. Result state
`waiting_user` — non-final machine state (`case-machine.ts:153-165`), transitions `T9_SUBMIT_REVISION` (isOwnerOrMember → `supporter_working`) and `T15_CANCEL`. **But** admin fired it from `triage_pending` → no `assigned_supporter`. Dead-ends:
- `T6_ASSIGN_SUPPORTER` only defined on `accepted_unassigned` (`:94`) → admin assign on `waiting_user` = `INVALID_TRANSITION` (`assign-supporter.usecase.ts:38-43`).
- Admin UI hides actions for `waiting_user` (`AdminCaseAssignmentTable.tsx:291,316`); case drops out of `page.tsx:257-262` triage filter.

### 5. Student view
- `CaseStatusHeader.tsx:31,44-47`: `waiting_user` → "Đang chờ nhóm bổ sung thông tin".
- `StatusGuidanceCard.tsx:44-63` CAN render the query text — **but `page.tsx:127` passes `openRequestsForMoreInfo={null}` → branch dead**. Actual branch `:82-96` ("need_more_information") = generic text, **request text never shown**. (Also `findOpenRequestsForMoreInfo` `case.repository.ts:395-403` matches `more_info_requested` only; supporter writes `request_more_info` — second mismatch.)
- Un-stick button: `canSubmitRevision` includes `need_more_information` (`page.tsx:75`) → "Tải tài liệu" (`page.tsx:149-158`) → `StudentDocumentUploadModal.tsx:45-64` → `useCaseDocumentUploads.ts:138-141` `POST /cases/:id/revisions/upload` → `submitRevisionUploadUseCase` (`submit-revision.usecase.ts:129-213`) → `submitCaseRevision` (`case.repository.ts:466-471`) sets **stage only**, `internal_status` unchanged (`waiting_user`). Machine-path twin `submitRevisionUseCase` (`:120-126`, T9) is unused by this FE. So after student uploads: stage=`revision_submitted`, status=`waiting_user`, no supporter → still invisible in admin queue, `T10/T11` unreachable. Dead-end.

### 6. Supporter comparison
- Separate endpoint `POST /supporter/cases/:caseId/request-more-info` (`supporter.routes.ts:15`); guard `requireCaseAccess` supporter|admin (`supporter.controller.ts:75-99`) vs admin-only.
- Same repo call, **different event_type string**: admin `"more_info_requested"` (`request-more-info.usecase.ts:40`) vs supporter `"request_more_info"` (`supporter-request-more-info.usecase.ts:45`). Supporter checks `isFinalCaseStage` (`:26-32`); admin does not. Both bypass machine.

## Bugs / dead-ends (file:line)

1. Reject reason never shown to student: event written as `T12_REJECT` (`case-transition.service.ts:257`) but UI reads `case_rejected`/`vetoed` (`StatusGuidanceCard.tsx:36-42`, `ActivityTimeline.tsx:62`).
2. Resubmit-after-reject leaves `internal_status='cancelled'` (`submit-intake.usecase.ts:88-111` -- writes stage only) → invisible in admin triage (`page.tsx:257-262`). T3 resubmit route (`cases.routes.ts:50`) exists but has no FE caller.
3. Admin request-more-info bypasses machine from `triage_pending` → `waiting_user` with no supporter (`request-more-info.usecase.ts:37-44`); T6 not available from `waiting_user` (`case-machine.ts:92-103`); case vanishes from admin filters (`page.tsx:257-262`).
4. Request TEXT never rendered: `page.tsx:127` hardcodes `null` for `openRequestsForMoreInfo`; dead branch `StatusGuidanceCard.tsx:44-63`.
5. Event_type inconsistency admin `more_info_requested` vs supporter `request_more_info`; `findOpenRequestsForMoreInfo` matches only the former (`case.repository.ts:395-403`).
6. Student upload after request-info (`/revisions/upload`) never updates `internal_status` (`case.repository.ts:466-471`); machine T9 path (`submit-revision.usecase.ts:120-126`) unused by FE.
7. Repo `rejectCase()` (`case.repository.ts:261-282`) dead code.

## Comparison table

| Nut | Endpoint | Transition/State | Credit impact | Sinh vien thay | Ket? |
|---|---|---|---|---|---|
| Tu choi | POST /admin/cases/:id/reject (admin.routes.ts:30) | T12_REJECT via executeTransition, target cancelled (final) (case-machine.ts:81-84; case-transition.service.ts:241-262) | none | "Ho so bi tu choi xet duyet" card; reason KHONG hien (StatusGuidanceCard.tsx:189-223); nut "Chinh sua de nop lai" → intake (page.tsx:130) | Ban ket: nop lai chi doi stage, internal_status van `cancelled` (submit-intake.usecase.ts:88-111) → mat khoi hang cho admin (page.tsx:257-262) |
| Yeu cau lam ro | POST /admin/cases/:id/request-more-info (admin.routes.ts:31) | Direct DB write, NO machine → waiting_user / need_more_information (request-more-info.usecase.ts:37-44; case.repository.ts:306-327) | none | Card generic (StatusGuidanceCard.tsx:82-96); text yeu cau KHONG hien (page.tsx:127 null); nut "Tai tai lieu" (page.tsx:149-158) | Ket: upload khong doi internal_status (case.repository.ts:466-471); khong supporter, T6/T8/T10/T11 khong chay duoc |
