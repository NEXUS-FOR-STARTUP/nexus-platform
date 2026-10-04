# FE Allowed-Transitions Consumer Research

**Date:** 2026-08-14
**Scope:** apps/web-1 rendering of actions from `allowed_transitions` (BE: `getAvailableTransitions(internal_status)`, XState machine)
**Mode:** READ-ONLY research. No files edited.

---

## 1. `allowed_transitions` consumers (today)

| Location | Line | Usage |
|---|---|---|
| `apps/web-1/types/case.ts` | 23 | `allowed_transitions?: string[];` — declaration only |
| `apps/web-1/app/dashboard/case/[id]/hooks/useCaseDetails.ts` | 87 | `allowedTransitions: caseQuery.data?.case?.allowed_transitions || [],` — **exposed but never consumed** |

**Type check:** `apps/web-1/types/case.ts:23` declares `string[]` (loose). BE type is `TransitionName` union (16 names, `apps/api/src/modules/cases/domain/transition.types.ts:5-21`). FE has **no TransitionName type** — plan should add a typed union in `types/case.ts` (or import from `@repo/validation` if promoted there) instead of raw `string[]`.

**BE guarantee:** `get-case-detail.usecase.ts:152,156` — `allowed_transitions = getAvailableTransitions(caseDetails.internal_status)`; attached for **all roles** (student base response + admin/supporter extended). Raw machine output per state (`case-machine.ts:257-262`): keys of `stateNode.on` — **includes role-restricted transitions** (e.g. student sees `T5_ACCEPT`, `T12_REJECT`, `T7_START_WORK` in `triage_pending` list because machine has no role-aware projection). Plan must filter by actor role before rendering buttons — raw list ≠ "actions I may perform".

### Allowed transitions per internal_status (machine truth, case-machine.ts:63-213)

| internal_status | allowed_transitions |
|---|---|
| triage_pending | T2_SUBMIT_INTAKE, T5_ACCEPT, T16_EDIT_INTAKE, T12_REJECT, T15_CANCEL |
| accepted_unassigned | T6_ASSIGN_SUPPORTER, T15_CANCEL |
| assigned | T7_START_WORK, T13_VETO, T15_CANCEL |
| supporter_working | T8_REQUEST_INFO, T10_START_REVIEW_REVISION, T11_SUBMIT_OUTPUT, T13_VETO, T15_CANCEL |
| waiting_user | T9_SUBMIT_REVISION, T15_CANCEL |
| report_ready_to_publish | T14_COMPLETE, T15_CANCEL |
| done | T3_RESUBMIT_AFTER_REJECT, T4_RESUBMIT_AFTER_VETO |
| cancelled | T3_RESUBMIT_AFTER_REJECT, T4_RESUBMIT_AFTER_VETO |

`T1_CREATE_CASE` never appears (pre-creation only). Stage mapping: `case-transition.service.ts:15-32` (T2→submitted, T5→under_review, T8→need_more_information, T9→revision_submitted, T11→report_ready, T14→completed, T12/T13→rejected, T15→closed).

---

## 2. Student workspace hardcoded stage checks — `apps/web-1/app/dashboard/case/[id]/`

### 2.1 `page.tsx` (209 lines)

| Line | Condition | Controls | Correct TransitionName |
|---|---|---|---|
| 71-74 | `isPreSubmission = stage==="intake_pending"‖"intake_ready"`; `isIntakeReady`; `isIntakePending` | Tab gating + intake buttons | T16_EDIT_INTAKE (before submission) |
| 75 | `canSubmitRevision = ["report_ready","waiting_for_revision","need_more_information"].includes(stage)` | "Tải tài liệu" button (opens StudentDocumentUploadModal) | T9_SUBMIT_REVISION (BE guard already: waiting_user only — **BUG**: FE shows button in report_ready/need_more_information stages where T9 is NOT available → upload 400s) |
| 77-82 | `isTabAvailable`: intake_pending→overview/settings/credits; intake_ready→+documents | Tab availability | T16 gate (pre-submission) |
| 122 | `onEditIntake = isIntakeReady ? push(intake?caseId) : undefined` | "Cập nhật" from overview | T16_EDIT_INTAKE |
| 129 | `onOpenPayment = isIntakePending ? setCreditBuyOpened : undefined` | Payment CTA | not a transition (payment flow) — keep |
| 130 | `onOpenIntake = (isIntakeReady ‖ stage==="rejected") ? push(intake) : undefined` | Re-open intake | T16_EDIT_INTAKE (intake_ready); T3_RESUBMIT_AFTER_REJECT (rejected — but rejected maps to internal `cancelled`, allowed T3) |
| 139-148 | `stage === "intake_ready"` | "Cập nhật thông tin" button (documents tab) | T16_EDIT_INTAKE |
| 149-158 | `canSubmitRevision` | "Tải tài liệu" button | T9_SUBMIT_REVISION |
| 192 | `<StudentDocumentUploadModal isOpen...>` — unconditional render | Modal always mounted (harmless, opens only via button) | — |
| 193-198 | ExternalFeedbackUploadModal — unconditional | "Tải đánh giá bên ngoài" button (line 159-167, no gating) | not a transition (doc upload) — keep ungated |

**Note:** `caseData.allowed_transitions` never read in page.tsx; `allowedTransitions` from hook (line 87) not destructured at line 34-40.

### 2.2 `StatusGuidanceCard.tsx` (296 lines) — switch on `user_facing_stage` (line 31)

| Line | case | Renders | TransitionName |
|---|---|---|---|
| 44-63 | `hasInfoRequest` (open_requests_for_more_info) — BEFORE switch | passive alert | (T8_REQUEST_INFO state: waiting_user) |
| 66-80 | `"submitted"` | passive alert | (T5 pending) |
| 82-96 | `"need_more_information"` | passive alert, no action button | **GAP: T9_SUBMIT_REVISION action missing** (stage maps to waiting_user where T9 available; page.tsx canSubmitRevision DOES include need_more_information but card itself offers no CTA) |
| 98-112 | `"under_review"` | passive alert | — |
| 114-132 | `"report_ready"`+`"waiting_for_revision"` | passive alert mentions "Tải tài liệu" button (text only) | T9_SUBMIT_REVISION (text-only CTA — **not available in report_ready, only waiting_user** — misleading copy) |
| 134-152 | `"revision_submitted"` | passive alert | (T10/T11 pending) |
| 154-168 | `"closed"` | passive alert | — |
| 170-187 | `"completed"/"approved"/"APPROVED"/"sent"` | passive alert | — |
| 189-223 | `"rejected"` | **Button "Chỉnh sửa hồ sơ để nộp lại"** (line 209-220, gated `onOpenIntake`) | T3_RESUBMIT_AFTER_REJECT (needs hasCredit guard BE-side; T4 only if vetoed) |
| 225-260 | `"intake_pending"` | Payment/mua gói CTA if no credits (line 247-256) | not a transition |
| 262-291 | `"intake_ready"` | **Button "Cập nhật ngay"** (line 279-288) | T16_EDIT_INTAKE |
| 293-294 | default | null | — |

**Problem:** switch is on `user_facing_stage`, not `allowed_transitions`; `need_more_information` card has NO button though T9 available; no `onSubmitRevision` prop exists — page never passes one.

### 2.3 `CaseStatusHeader.tsx` (210 lines)

| Line | Hardcode | Purpose |
|---|---|---|
| 31 | `isPaused = internal_status === "waiting_user"` | SLA timer pause label (timer block currently commented out 195-207) |
| 37 | `preSupporterInternal = ["triage_pending","accepted_unassigned","assigned"]` | "Đang chờ phân công" timer label |
| 38 | `preSupporterUserFacing = ["intake_pending","intake_ready","submitted","need_more_information"]` | fallback when internal_status absent |
| 152-156 | 5-stage list for pulsing dot: submitted/under_review/revision_submitted/need_more_information/intake_ready | cosmetic (status badge animation) |

Display-only; **no action gating**. `isPaused`/preSupporter lists are cosmetic — can stay or derive from transitions (low priority).

### 2.4 `TabReportFindings.tsx` (193 lines)

| Line | Condition | Purpose |
|---|---|---|
| 54-63 | `internal_status === "triage_pending"` / `"accepted_unassigned"` / `"assigned"‖"supporter_working"` | Empty-state title/desc when no report |

Display-only copy. Keep (reads internal_status, which students DO receive since VERIFY-001 only stripped it for... actually: **students receive internal_status too** — `toBaseResponse` line 46-78 excludes it, `extendWithInternalFields` line 84-90 only adds for admin/supporter → student gets NO internal_status. But TabReportFindings:54 reads `caseData.internal_status` on student workspace → **always undefined → always generic "Chưa có báo cáo"** unless report exists. Bug worth noting: empty-state variants are dead code on student surface. Should derive from `allowed_transitions` or `user_facing_stage`.)

### 2.5 `WorkspaceSidebar.tsx` (126 lines)

| Line | Condition | Controls |
|---|---|---|
| 29 | `isPreSubmission = stage==="intake_pending"‖"intake_ready"` | hides discussion + timeline tabs |
| 30 | `isIntakePending` | hides documents tab |

Tab visibility = T16 pre-submission gate. Could key off `allowed_transitions.includes("T16_EDIT_INTAKE")` or keep stage-based (tabs are structural, not action buttons — **recommend keep**).

### 2.6 `TabCaseSettings.tsx` (277 lines)

| Line | Condition | Controls |
|---|---|---|
| 196 | `user_facing_stage === "submitted"` | "Vùng nguy hiểm" delete-case section (calls DELETE `/cases/:id`) |

**GAP:** delete allowed only while `submitted`; no transition corresponds (delete is not in machine). Internal `triage_pending` is the true precondition. Recommend keep explicit (delete is BE-side endpoint, not transition-driven) — but fix to also cover intake stages where admin hasn't triaged (or guard on BE only).

---

## 3. Admin UI — `apps/web-1/app/admin/`

### 3.1 `AdminCaseDetailModal.tsx` (297 lines)

| Line | Condition | Buttons | TransitionName | Verdict |
|---|---|---|---|---|
| 237 | `internal_status === "triage_pending"` | "Yêu cầu làm rõ" (241), "Từ chối" (251), "Duyệt hồ sơ" (263) | request-more-info (NOT machine); T12_REJECT; T5_ACCEPT | **→ read allowed_transitions** (T5/T12 present in triage_pending list). "Yêu cầu làm rõ" has NO machine transition — separate admin endpoint, keep as admin-only hardcode |
| 279 | `internal_status === "accepted_unassigned" ‖ "assigned"` | "Phân công Supporter / Phân công lại" (280-290) | T6_ASSIGN_SUPPORTER | **→ allowed_transitions.includes("T6_ASSIGN_SUPPORTER")** |

### 3.2 `AdminCaseAssignmentTable.tsx` (437 lines)

| Line | Condition | Menu items | TransitionName | Verdict |
|---|---|---|---|---|
| 291 | `item.internal_status === "triage_pending"` | "Yêu cầu làm rõ" (293), "Từ chối" (300), "Duyệt hồ sơ" (307) | request-more-info; T12_REJECT; T5_ACCEPT | → allowed_transitions (T5/T12); request-more-info keep |
| 316 | `accepted_unassigned ‖ assigned` | "Phân công Supporter / Phân công lại" (317-323) | T6_ASSIGN_SUPPORTER | → allowed_transitions |

**Caveat:** table row `item` comes from `/admin/cases` list (useAdminCases.ts:16) — **list endpoint must also return `allowed_transitions`** or admin table can't render from it. Verify BE `list-cases.usecase.ts`; if absent, plan adds it or falls back to status checks in the list (recommend: only detail-view gating uses allowed_transitions; table row menus keep status checks unless BE list enriched).

### 3.3 `admin/page.tsx` (674 lines)

| Line | Hardcode | Purpose | Verdict |
|---|---|---|---|
| 244 | `internal_status === "triage_pending" ‖ "accepted_unassigned"` | badge count (sidebar) | **KEEP** — admin filter logic, not action gating |
| 253-273 | `filteredCases`: active = triage_pending/accepted_unassigned/assigned; per-filter triage/unassigned/assigned | list filtering | **KEEP** — admin-only workspace filters |

---

## 4. Supporter UI — `apps/web-1/app/supporter/`

### 4.1 `page.tsx` (159 lines) — buckets by `internal_status`

| Line | Filter | internal_status | Actions on card |
|---|---|---|---|
| 16-18 | `pendingCases` | assigned, supporter_working, waiting_user | **none** (CaseCard is display-only, badge + link to case detail) |
| 20-22 | `completedCases` | done | none |
| 24-26 | `submittedReports` | report_ready_to_publish | none |

Buckets are list filters — **KEEP as-is** (transitions not suitable for list bucketing; only detail page actions should read allowed_transitions).

### 4.2 `supporter/case/[id]/page.tsx` (126 lines)

| Line | Hardcode | Controls | TransitionName | Gap |
|---|---|---|---|---|
| 99-108 | unconditional "Tải output hỗ trợ" button (opens SupporterOutputUploadModal) | doc upload only | T11_SUBMIT_OUTPUT is triggered **nowhere** | **GAP: no "Submit output" transition trigger.** Button only uploads docs; supporter must separately hit `/cases/:id/status` (or `/complete`) to move state. No T7_START_WORK button, no T8_REQUEST_INFO button, no T14_COMPLETE button anywhere in supporter surface |

**Supporter triggers today:** NONE via dedicated buttons. The generic `/cases/:id/status` endpoint exists (cases.routes.ts:41) with XSTATE_TRANSITIONS map (update-case-status.usecase.ts:19-31: T6/T7/T8/T10/T14/T15) — but **no FE code calls it** (`updateStage` in useCaseDetails.ts:99 never invoked; grep confirms only declaration). Supporter output upload (submit-revision.usecase.ts:277) does NOT executeTransition. **The entire supporter action surface is unwired.**

---

## 5. `useCaseDetails.ts` (108 lines) — summary

- Query: `GET /cases/:id` (line 22), 10s polling, key `["case", id]` — **response is `{case, intake_snapshot, ...}` and `allowed_transitions` rides on `case`** (BE get-case-detail.usecase.ts:156).
- **Exposes `allowedTransitions` (line 87) — but `page.tsx:34-40` doesn't destructure it.** Also exposes unused `updateStage` (line 99), `resubmitCase` (line 105, unused), `deleteCase`, `updateSettings`.
- 5 mutations: updateStage→`POST /cases/:id/status` (:31, **unused**), updateSettings→`PUT /cases/:id/settings` (:51), deleteCase→`DELETE /cases/:id` (:63), resubmitCase→`POST /cases/:id/resubmit` (:74, **unused**).
- **Plan must destructure `allowedTransitions` in page.tsx + supporter case page and thread down.**

---

## 6. Endpoint call inventory (FE → BE, case-related)

### Student workspace
| File:Line | Method+Path | Transition | Status |
|---|---|---|---|
| useCaseDetails.ts:22 | GET `/cases/:id` | — | used (poll) |
| useCaseDetails.ts:31 | POST `/cases/:id/status` | T6/T7/T8/T10/T14/T15 (via map) | **UNUSED in FE** |
| useCaseDetails.ts:51 | PUT `/cases/:id/settings` | — | used (TabCaseSettings) |
| useCaseDetails.ts:63 | DELETE `/cases/:id` | — | used (TabCaseSettings danger zone) |
| useCaseDetails.ts:74 | POST `/cases/:id/resubmit` | T3/T4 | **UNUSED in FE** |
| useCaseDocumentUploads.ts:15 | POST `/cases/uploads/managed-document` | — | used (all 3 uploads) |
| useCaseDocumentUploads.ts:27 | GET `/cases/document-types` | — | used |
| useCaseDocumentUploads.ts:57 | POST `/cases/:id/supporter-outputs/upload` | **NONE (no transition)** | used (supporter modal) |
| useCaseDocumentUploads.ts:98 | POST `/cases/:id/external-feedback/upload` | none | used |
| useCaseDocumentUploads.ts:138 | POST `/cases/:id/revisions/upload` | T9_SUBMIT_REVISION (submit-revision.usecase.ts:121) | used (student upload) |
| useIntakeForm.ts:95 | POST `/cases/:id/intake` | **T2/T16 NOT wired** (submit-intake.usecase.ts:110 direct stage update) | used (update mode) |
| useIntakeForm.ts:98 | POST `/cases` | T1 (create) | used |
| CreditQuantityModal.tsx:35 | POST `/cases/:id/upgrade-package` | none | used |
| CreditQuantityModal.tsx:39 | POST `/orders` | — | used |

### Admin
| File:Line | Method+Path | Transition | Status |
|---|---|---|---|
| useAdminCases.ts:16 | GET `/admin/cases` | — | used (list — **lacks allowed_transitions?** verify) |
| useAdminCases.ts:24 | GET `/cases/supporters` | — | used |
| useAdminCases.ts:31 | POST `/admin/cases/:id/accept` | T5_ACCEPT (accept-case.usecase.ts:19) | used |
| useAdminCases.ts:43 | POST `/admin/cases/:id/reject` | T12_REJECT (admin/reject-case.usecase.ts:24) | used |
| useAdminCases.ts:55 | POST `/admin/cases/:id/request-more-info` | **none (not machine)** | used |
| useAdminCases.ts:67 | POST `/admin/cases/:id/assign` | T6_ASSIGN_SUPPORTER (admin/assign-supporter.usecase.ts:39) | used |
| useAdminCases.ts:81 | DELETE `/cases/:id` | — | used (crud mode) |
| useAdminCases.ts:115 | GET `/admin/cases/:id` | — | used (detail modal — **returns allowed_transitions?** verify controller) |

### Supporter
- No case-state endpoint calls at all. Only `SupporterOutputUploadModal` → `/cases/:id/supporter-outputs/upload` (no transition).

### BE routes not yet consumed by FE (candidates to wire in plan)
- `POST /cases/:id/assign` (cases.routes.ts:40), `POST /cases/:id/veto` (T13, :47), `POST /cases/:id/complete` (T14, :48), `POST /cases/:id/resubmit` (:50), `POST /cases/:id/status` (:41).
- **T11_SUBMIT_OUTPUT has NO endpoint** → plan must either add `POST /cases/:id/complete`-style flow (submit output → T11) or wire `supporter-outputs/upload` to executeTransition(T11) with fileCount metadata (needs machine action upsertDoc? T11 has subtractCredit+lockPrice actions only; upsertDoc not in T11 — documents already inserted separately).

---

## 7. Intake page + DemoDataFAB — `apps/web-1/app/dashboard/intake/page.tsx`

- Update mode exists: `caseId` from searchParams (line 72), `isUpdateMode` (73), loads `GET /cases/:id` (78), submits `POST /cases/:id/intake` (useIntakeForm.ts:95).
- **No stage restriction on update mode** — any caseId can open the form (backed by BE submit-intake guard). Plan: entry points already gated by T16/T3 in case page; intake page itself needs no transition check.
- DemoDataFAB (line 325-357): dev-only form filler, no stage gating — keep.

---

## 8. FE Gap Summary — components to change

| # | Component | File | Change |
|---|---|---|---|
| 1 | **page.tsx** (student) | `dashboard/case/[id]/page.tsx` | Destructure `allowedTransitions` (line 34-40). Replace `canSubmitRevision` (75) with `allowedTransitions.includes("T9_SUBMIT_REVISION")`; replace `onEditIntake`/`onOpenIntake` (122,130) with T16 gate; add submit-revision button per T9; add T15_CANCEL handling if desired; filter transition list by role (student: T2/T3/T4/T9/T15/T16 only) |
| 2 | **StatusGuidanceCard** | `_components/StatusGuidanceCard.tsx` | Switch on transitions instead of stage (or supplement): render T9 button in waiting_user, T16 in intake_ready, T3 in cancelled(rejected). Add `onSubmitRevision` prop. Fix misleading copy at 127 (T9 CTA shown in report_ready where unavailable) |
| 3 | **useCaseDetails.ts** | hooks | Already exposes `allowedTransitions` — optionally add typed `TransitionName` union; keep `updateStage` for supporter actions |
| 4 | **Supporter case page** | `supporter/case/[id]/page.tsx` | **Biggest gap.** Render action bar from `allowedTransitions`: T7_START_WORK (assigned), T8_REQUEST_INFO (supporter_working), T10_START_REVIEW_REVISION, T11_SUBMIT_OUTPUT (needs BE endpoint), T14_COMPLETE (report_ready_to_publish). Wire to `POST /cases/:id/status` (T7/T8/T10/T14) — or dedicated endpoints |
| 5 | **AdminCaseDetailModal** | `admin/_components/AdminCaseDetailModal.tsx` | Lines 237/279 → allowed_transitions (T5/T12/T6); keep request-more-info hardcoded |
| 6 | **AdminCaseAssignmentTable** | `admin/_components/AdminCaseAssignmentTable.tsx` | Lines 291/316 → allowed_transitions IF `/admin/cases` list returns it; else keep + note |
| 7 | **TabReportFindings** | `_components/TabReportFindings.tsx` | Fix dead empty-state branch (student never gets internal_status): derive from allowed_transitions/user_facing_stage |
| 8 | **TabCaseSettings** | `_components/TabCaseSettings.tsx` | Line 196: extend delete window beyond `submitted` (or leave, note BE authority) |
| 9 | **WorkspaceSidebar / CaseStatusHeader** | both | Optional cosmetic sync (tab gating from T16; paused-dot from transitions). Low priority — stage checks fine |
| 10 | **supporter/page.tsx buckets, admin/page.tsx filters** | both | **KEEP** — list filtering is not action gating; no change |

### BE coordination needed (not FE-only)
- `T11_SUBMIT_OUTPUT` has no endpoint → add (or reuse `/complete` pattern).
- `/admin/cases` list + `/admin/cases/:id` detail must include `allowed_transitions` if admin tables/modals consume them.
- `submit-intake` doesn't run T2/T16 through machine → `allowed_transitions` for triage_pending lists T2/T16 but `/cases/:id/intake` bypasses XState; harmless for UI (buttons route correctly) but machine/DB can diverge — plan should note.

---

## Limitations
- Did not read `list-cases.usecase.ts` / `cases.controller.ts` fully — `/admin/cases` and `/admin/cases/:id` payload shape (allowed_transitions presence) unverified; flagged as open question.
- Did not inventory `CaseOverviewPanel`, `DocumentWorkspace`, `CreditPanel` internals for stage gating (grep showed none).
- `request-more-info` admin endpoint has no machine transition — treated as non-transition action.
- T2/T16 not executed via XState — machine is source of truth for `allowed_transitions` but intake path bypasses it.

## Open questions
1. Does `GET /admin/cases` (list) and `GET /admin/cases/:id` return `allowed_transitions`? (verify BE before trusting admin-table gating)
2. T11_SUBMIT_OUTPUT: add new endpoint vs. wire existing `supporter-outputs/upload` to executeTransition?
3. Should `allowed_transitions` be role-filtered on BE (per-role projection) or filtered on FE by actor role? BE-side is safer (student sees T5/T12/T7 today).
4. `resubmitCase` + `updateStage` unused in FE — wire now (T3/T4 buttons on rejected/closed) or delete?
