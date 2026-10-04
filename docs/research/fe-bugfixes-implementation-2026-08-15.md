# FE Implementation Research — 8 Bug Fixes (apps/web-1)

**Date:** 2026-08-15 · **Scope:** READ-ONLY research, file:line evidence, no code written
**Stack:** Next.js 16 App Router · Mantine UI v9 · TanStack Query v5 / Form v1 · Centrifugo v5 WS · Axios apiClient · Vietnamese-first inline copy (no i18n lib)

---

## 0. Global patterns (apply to all fixes)

| Pattern | Location | Evidence |
|---|---|---|
| Query hook | `useQuery` + `queryKey`, mutation `invalidateQueries` onSuccess | `useCaseDetails.ts:24-54`, `useAdminCases.ts:13-77` |
| Query keys | `["cases"]`, `["case", id]`, `["case-messages", caseId]`, `["admin-cases"]`, `["admin-case-detail", caseId]` | `useCaseDetails.ts:50-52`, `useAdminCases.ts:35-37`, `useRealtimeChat.ts:43` |
| Toast | `@mantine/notifications` `notifications.show({title, message, color})` | `supporter/case/[id]/page.tsx:94-96,112-114` |
| apiClient | axios, baseURL `/api`, `withCredentials`, 401 → `/auth` | `lib/api-client.ts:3-30` |
| Stage gating | `filterTransitions(allowedTransitions, {role,isOwner,isAssignedSupporter})` | `_types/transitions.ts:53-75`; pages `case/[id]/page.tsx:81-93`, `supporter/case/[id]/page.tsx:76-86` |
| Stage banner | `StatusGuidanceCard` stage switch, Alert + Button | `StatusGuidanceCard.tsx:55-263` |
| Form validation | TanStack Form `validators.onChange` returning error string; render via `field.state.meta.errors[0]` | `SituationStep.tsx:38-47`, `ContactStep.tsx:29-37` |
| Redirect | `useRouter().push()` | `case/[id]/page.tsx:140,149`, `useIntakeForm.ts:108` |
| Currency | VND, comma thousands separator (no ₫/đ) | `CreditBalanceCard.tsx:68` |
| Styling rule | No Tailwind positioning classes on Mantine Modal/Drawer | `apps/web-1/AGENTS.md` |

**Data availability (useCaseDetails return, `useCaseDetails.ts:67-87`):** `caseData` (incl. `credit_balance`, `sla_deadline_at`, `allowed_transitions`, `user_facing_stage`, `internal_status`, `events`, `orders`, `credit_ledger`), `intake_snapshot`, `document_workspace`, `latest_report`, `openRequestsForMoreInfo`, `roundHistory`, `documentBoardSections`. `refetchInterval: 10000` (`:31`).

**Types:** `Case` interface `types/case.ts:5-60` (fields confirmed `:17-18,20-22`); `statusThemeMap` `types/case.ts:217-335` (labels: `report_ready` "Báo cáo phản biện sẵn sàng" `:232`, `report_ready_to_publish` "Báo cáo chờ gửi" `:312`, `done` "Hoàn thành" `:316`).

---

## #13 — Intake max 10 files

**Component:** `app/dashboard/intake/_components/Steps/DocumentInputStep.tsx`
- `MAX_DOCUMENT_FILE_SIZE_BYTES` const `:21`; `ACCEPT_EXTENSIONS` `:22` — add sibling `MAX_DOCUMENT_COUNT = 10`.
- Upload trigger `:260-269` (Button → `fileInputRef.current?.click()`) — no count guard.
- `handleFileSelect` `:87-135` — appends unconditionally at `:124` (`parentField.handleChange([...currentDocs, newDoc])`). Current `docs` accessible via `parentField.state.value` (`:114`, `:223`).
- Error display pattern exists: `uploadError` state + red Alert `:56,276-287`.
- Upload endpoint `/documents/upload` `:108` (multipart); response fields `url, publicId, originalName, extension, mimeType` `:112`; `document_type: ""` seeded `:121`, user selects later `:148-156`.

**Proposed changes:**
1. Add `MAX_DOCUMENT_COUNT = 10`.
2. In `handleFileSelect` (or at `:260` button): if `(parentField.state.value?.length ?? 0) >= 10` → `setUploadError("Hồ sơ tối đa 10 tài liệu. Vui lòng xóa bớt trước khi thêm.")` + return (block append).
3. Disable upload Button when count ≥ 10; show counter `Tài liệu (n/10)` near label `:294`.
4. Keep remove flow (`:139-144`) — removing frees slot.

**Risks:** low. Guard also needed server-side (intake POST) — FE-only guard bypassable. Check backend intake validation accepts ≤10 (not in this research scope — see open questions).

---

## #14 — Intake text maxLength + counters

**Pattern:** TanStack Form `validators.onChange` per field (error string) — inputs are `TextInput`/`Textarea` with `value`/`onChange`/`onBlur`/`error` props.

**Fields + files (all under `app/dashboard/intake/_components/Steps/`):**
| Field | File:line | Current validation | Target max |
|---|---|---|---|
| `current_blocker` | `SituationStep.tsx:38-79` | min 10 `:44` | long 20000 |
| `contact.full_name` | `ContactStep.tsx:29-54` | required, min 2 `:34` | short 100 |
| `contact.student_code` | `ContactStep.tsx:56-94` | required, min 5 `:61` | short 100 |
| `contact.team_role` | `ContactStep.tsx:96-133` | required `:100` | short 100 |
| `contact.zalo` | `ContactStep.tsx:135-173` | regex `^\d{10}$` `:140` | short 100 |
| `contact.email` | `ContactStep.tsx:175-203` | required, contains `@` `:179-180` | email 254 |
| `contact.telegram` | `ContactStep.tsx:205-218` | none | short 100 |
| `team_context.group_no` | `ProjectContextStep.tsx:113-143` | digits only `:120-122` | short 100 |
| `team_context.project_name` | `ProjectContextStep.tsx:146-174` | required `:152` | short 100 |
| `team_context.team_status_summary` | `ProjectContextStep.tsx:176-206` | none | long 20000 |
| `expected_outputs` | `SupportNeedsStep.tsx:66-107` | optional, min 5 `:70-72` | long 20000 |
| `support_needs.extra_notes` | `SupportNeedsStep.tsx:109-122` | none | long 20000 |

Notes: `case_summary` + `lecturer_feedback` are display-only in `ReviewSubmitStep.tsx:26-27,94-97` (no input in FE — legacy). Shared Zod schema `packages/validation/src/index.ts` has NO intake maxLengths (only TeamFit: `:8-33`) — no shared constraint to sync with.

**Proposed changes (per field):**
1. `maxLength={100|254|20000}` on `TextInput`/`Textarea` (Mantine enforces hard cut; `Textarea` + `autosize` fine).
2. Counter: Mantine `TextInput` `rightSection` or `description` — simplest consistent pattern: `description={`${value.length}/${max}`}` colored `text-danger` when near limit. No existing counter precedent in codebase.
3. Add validator branch: `if (value.length > max) return "Tối đa N ký tự."` for paste-hardened UX.
4. Optionally centralize: define `MAX` consts once per step file (KISS — no shared constants file needed for 3 distinct limits).

**Risks:** low. Backend schema also lacks max — add same limits server-side later (alignment, out of scope here). 20000 on `current_blocker`/`team_status_summary` is generous; ensure DB column varchar length matches (backend concern).

---

## #5 — report_ready confirm (user) + supporter T14 removal + tab filter

### 5a. User case page — "Xác nhận hoàn thành" at report_ready
**Component:** `app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`
- `report_ready` currently falls through to static copy `STATUS_GUIDANCE_COPY.report_ready` (`statusCopyMap.ts:33-39`) rendered at `:246-261`. No button.
- Props interface `:17-26` — add `onConfirmCompletion?: () => void`.
- Caller `case/[id]/page.tsx:141-152` — pass callback.
- **Backend gap (verified):** `T17` does NOT exist — `apps/api/src/modules/cases/domain/transition.types.ts:19,28,45` lists T2–T16 only; machine `report_ready_to_publish` state `case-machine.ts:170-179` has only `T14_COMPLETE`/`T15_CANCEL`; `getAvailableTransitions` `case-machine.ts:247-252` derives from machine `on` keys → student at report_ready currently gets only `T15_CANCEL`. **FE must add** `T17_CONFIRM_COMPLETION: { roles: ["CUSTOMER"], actor: "owner" }` to `_types/transitions.ts:21-37` and gate button on it; **backend must add** T17 machine transition + endpoint (new `POST /cases/:id/confirm-completion` or similar) or FE falls back to stage check `stage === "report_ready"` + direct apiClient call.
- Completed tick: `CaseStatusHeader.tsx:152-167` shows animate-ping dot only for active stages; `completed` stage shows `statusThemeMap.completed` label "Hoàn thành" success badge (`types/case.ts:244-248`) — no tick icon; add `CheckCircle2`/`Check` icon if "clear tick" required on user side. Supporter side: `CaseCard` (`dashboard/_components/CaseCard.tsx:51-65`) shows `user_facing_stage` badge — add tick icon for `completed`/`done`.

### 5b. Supporter case page — remove T14 button, show "Đã giao, chờ sinh viên xác nhận"
**File:** `app/supporter/case/[id]/page.tsx`
- `canComplete = filteredTransitions.includes("T14_COMPLETE")` `:86`; button block `:195-206` ("Hoàn tất hồ sơ"); `hasActionBar` includes `canComplete` `:89`.
- Remove `canComplete` from `hasActionBar` (`:89`) + delete button block `:195-206` + remove `completeCase`/`isCompletingCase` destructure `:45-46` and `handleCompleteCase` `:109-116` (or leave hook unused).
- Add status banner when `caseData.internal_status === "report_ready_to_publish"` — reuse `isWaitingUser` banner pattern `:149-154` (`bg-warning-soft` + `Clock` icon): "Đã giao, chờ sinh viên xác nhận hoàn thành."
- `useSupporterActions.ts:49-56` (`T14_COMPLETE` → `POST /cases/:id/complete`) — keep or delete; endpoint `apps/api/.../cases.routes.ts:48` still exists. Dead code if removed.
- Supporter completed state: `CaseStatusHeader` badge shows `done` label via `statusThemeMap` (`types/case.ts:316-319`) — add tick if needed.

### 5c. Supporter list tab filter (bug)
**File:** `app/supporter/page.tsx`
- `completedCases = internal_status === "done"` `:20-22` (correct).
- `submittedReports = internal_status === "report_ready_to_publish"` `:24-26` — currently shown under tab "Đã gửi báo cáo" `:82-84`.
- Decision: `report_ready_to_publish` belongs in "Đã giao" bucket (delivered, awaiting student confirm), NOT "Đã hoàn thành". Completed (`done`) already isolated.
- Tab state `:13` (`"pending" | "submitted" | "completed" | "all"`); filter resolution `:28-35`; empty-state copy `:133-147`.
- **Proposed:** rename tab label `:82-84` "Đã gửi báo cáo" → "Đã giao, chờ xác nhận" (or new bucket); keep filter `:24-26`; confirm `done` never includes `report_ready_to_publish`. If a separate "Đã giao" tab required: add filter value + tab button (pattern `:61-108`) + empty-state branch.

**Risks:** T17 backend absent — FE must coordinate API contract (endpoint name + `allowed_transitions` inclusion) or gate on stage string only. Removing T14 button permanently changes supporter workflow — confirm T14 endpoint retained for legacy.

---

## #3 — report_ready banner (credit-gated) + T11 blocked error

### 3a. User case page banner at report_ready
**Component:** `StatusGuidanceCard.tsx`
- Credit-gating precedent exists: `intake_pending` branch `:144-173` — `hasCredits = (creditBalance ?? 0) > 0` `:145`, `if (hasCredits) return null` `:146`, else Alert (yellow/blue) + "Mua credit" Button wired to `onOpenPayment` `:165-169`.
- `creditBalance` prop already passed `:19,143-144` from `case/[id]/page.tsx:52,144`.
- `onOpenPayment` currently only wired for `isIntakePending` `case/[id]/page.tsx:148` → extends to report_ready: `onOpenPayment={stage === "intake_pending" || stage === "report_ready" ? () => setCreditBuyOpened(true) : undefined}`.
- CreditPanel (full tab) `case/[id]/page.tsx:195-204`; `CreditBalanceCard.tsx:13-91` (balance + "Mua credit" Button `:79-86`) — decision says "reuse CreditPanel/CreditBalanceCard": simplest is banner Alert (like intake_pending) + keep CreditPanel tab as-is; or render `CreditBalanceCard` inline in the report_ready branch.
- **Proposed:** add `if (stage === "report_ready")` branch BEFORE copy lookup `:246`:
  - `hasCredits` → render `STATUS_GUIDANCE_COPY.report_ready` guidance (hasTransition-based) — i.e., show guidance text.
  - no credits → red Alert (`color="red"`, `AlertCircle`) + "Mua credit" Button → `onOpenPayment`; copy e.g. "Hết credit — mua credit để nhận phản biện vòng tiếp theo."

### 3b. Supporter side T11 blocked error
**File:** `app/supporter/case/[id]/_components/SupporterOutputUploadModal.tsx`
- Already surfaces API error message: catch `:58-67` extracts `response.data.message`, renders `:105-108`; also `notifications.show` `:52`.
- Chat-gate precedent for rich error codes: `TabDiscussionChat.tsx:60-81` (`extractChatGateError` reads `response.data.code` + `details.unlockInMs`).
- **Proposed:** if T11 blocked returns machine-error code (not generic message), extend `SupporterOutputUploadModal` to map code → friendly copy (pattern from `TabDiscussionChat.tsx:66-81`). Verify actual backend error shape before coding.

**Risks:** low-moderate. "Red banner" style — verify danger-soft color classes used elsewhere (`page.tsx` error block `:69-71` uses `bg-danger-soft border-danger/10 text-danger`).

---

## #9 — Admin cases review queue + intake_pending bucket + detail empty-state

### 9a. Filters
**File:** `app/admin/page.tsx`
- Filter state `caseFilter` `:78` (`"all" | "triage" | "unassigned" | "assigned" | "crud"`).
- `filteredCases` `:235-255`: "all" = `triage_pending | accepted_unassigned | assigned` `:239-244`; "triage" `:245-247`; "unassigned" `:248-250`; "assigned" `:251-253`; "crud" = all `:236-238`.
- Sidebar filter buttons `:466-510` ("Tất cả cần xử lý" `:468`, "Chờ duyệt" `:482`, "Chờ phân công" `:489`, "Đang phản biện" `:496`, "Quản lý toàn bộ hồ sơ" `:503`).
- Badge counts: `unassignedCasesCount` `:226` (`triage_pending|accepted_unassigned`).
- Header copy map `:272-306` (per-filter titles).
- **Proposed:**
  1. Add `"intake"` to `caseFilter` union `:78`; filter branch `if (caseFilter === "intake") return cases.filter(c => c.user_facing_stage === "intake_pending")` (internal union lacks `intake_pending` — `types/case.ts:18`; verify what `/admin/cases` returns for such cases, see open questions).
  2. Sidebar button "Chờ sinh viên nộp hồ sơ" + header copy (pattern `:272-306`).
  3. Review queue ("all"/"triage"): decision says filter to `submitted`/`triage_pending` only — currently includes `accepted_unassigned|assigned`; adjust `:239-244` per spec (keep unassigned/assigned reachable via their own tabs).

### 9b. Detail modal empty-state + disable approve/reject
**File:** `app/admin/_components/AdminCaseDetailModal.tsx`
- Buttons derive from transitions: `canReject = includes("T12_REJECT")` `:48`, `canAccept = includes("T5_ACCEPT")` `:47`; rendered `:245-263`.
- "Yêu cầu hiện tại" section `:152-209` renders nothing when `intake_snapshot` empty (all fields conditional).
- **Proposed:** when `detailData?.intake_snapshot` is null/empty → render empty-state block (pattern `TabReportFindings.tsx:51-62` "Chưa có dữ liệu hồ sơ") + hide/disable Reject/Duyệt buttons (`{detailData && detailData.intake_snapshot && canReject ...}`).
- Data source: `useAdminCaseDetail` `useAdminCases.ts:97-110` returns `{case, intake_snapshot, allowed_transitions}`.

**Risks:** "submitted" in decision ambiguous (user_facing_stage vs internal). Verify `/admin/cases` payload for intake_pending cases (`list-admin-cases.usecase.ts:71,82` returns internal_status + sla_deadline_at).

---

## #12 — Intake doc category codes + workspace grouping/superseded

### 12a. DocumentInputStep category codes
**File:** `app/dashboard/intake/_components/Steps/DocumentInputStep.tsx`
- `DOCUMENT_TYPE_OPTIONS` `:24-43` — 6 Vietnamese label/value pairs → replace with category codes:
  `idea_report`, `pitch_deck`, `competitor_analysis`, `customer_research`, `task_assignment`, `other` (+ optional Vietnamese display labels).
- `handleTypeChange` `:148-156` writes code into `doc.document_type`; stored on `IntakeDocument.document_type` (`intake/_types/intake.types.ts:31-37`) → sent in intake POST body (`useIntakeForm.ts:92-100` posts `IntakeData`). So codes flow as metadata via existing field.
- Upload call `:104-122` sends static `documentType: "intake_document"` `:106` — category code attaches on selection (post-upload), not at upload. Confirm backend intake processing persists `document_type` code (see open questions).
- Validation hint "chọn loại tài liệu" `:228-229,351-355` unchanged (checks `!d.document_type`).

### 12b. Document workspace grouping + superseded
**Files:** `app/dashboard/case/[id]/_components/documents/DocumentWorkspace.tsx` + `document-workspace.types.ts` + `types/case.ts`
- Workspace renders per-checkpoint (`DocumentWorkspace.tsx:21-30`), rows from `buildSupportFlowRows(selectedCheckpoint.support_flow_documents)` `:32-41`, grouped by version (`versionLabel` v01/v02, `document-workspace.types.ts:56`), `contextLabel = file.doc_type_label` `:57`.
- Decision: "ALL non-superseded docs grouped by category" — current grouping is by version, NOT category. **FE must regroup** `buildSupportFlowRows` output by `doc_type`/`doc_type_label` (category), or extend backend workspace assembly.
- **Superseded: NOT present anywhere (verified):** `types/case.ts` `DocumentFile` `:192-215` has no superseded flag; `DocumentUnit` `:184-191` none; backend `grep supersed` across `apps/api/src/modules/documents|cases` → 0 hits. Superseded concept must be added backend-side (flag on document, filtering in `assemble-document-workspace`) or FE-only convention (e.g. `doc_type === "other"` + version logic — fragile).
- User workspace used by BOTH user page (`case/[id]/page.tsx:189`) and supporter page (`supporter/case/[id]/page.tsx:233`) — same component.
- Admin raw table: `app/admin/_components/AdminDocumentsTable.tsx` — columns "Loại" `:238`; no superseded badge. Add badge when flag exists.
- Doc uploader-role inference: `document-workspace.types.ts:96-122` (`uploaded_by_role`, `doc_type` sets incl. `intake_document` `:110`).

**Risks:** HIGH for 12b — superseded flag + category grouping require backend contract change (document-contract.ts, assemble-document-workspace.ts, document.dto). FE-only workaround (hide by version comparison) is unreliable. Scope decision needed.

---

## #16 — Case-deleted kick (realtime + poll fallback)

**Realtime (primary):** `app/dashboard/case/[id]/hooks/useRealtimeChat.ts`
- Centrifuge singleton `lib/realtime/centrifuge-client.ts:10-23` (dep `centrifuge ^5.7.0` in `package.json`); token via `/api/realtime/connection-token` `:14-19`; sub token `/api/realtime/cases/:caseId/subscribe-token` `:29-31`.
- Subscription `chat:${caseId}` `:17`; publication handler `:40-49` — **only handles `type === "message"`** `:42`; other types ignored. Arbitrary JSON publications supported by Centrifuge.
- Cleanup `:54-59` (unsubscribe + removeSubscription).
- Hook currently has no router/notifications — add `useRouter` + `notifications` imports.
- **Proposed:** in `sub.on("publication")` add branch: `if (data?.type === "CASE_DELETED")` → `notifications.show({title: "Hồ sơ đã bị xóa", ...color: "red"})`, `router.push("/dashboard")`, `queryClient.invalidateQueries({queryKey: ["cases"]})` + `["case", caseId]`. Backend must publish `{type: "CASE_DELETED"}` on case delete (Centrifugo publish — backend work).
- **IMPORTANT LIMITATION:** `TabDiscussionChat` (which mounts `useRealtimeChat`, `TabDiscussionChat.tsx:103`) renders only when `activeTab === "discussion"` — user page `case/[id]/page.tsx:193`, supporter page `supporter/case/[id]/page.tsx:237`. On other tabs the WS sub is unmounted → realtime kick won't fire. See fallback.

**Fallback (poll 404):** `useCaseDetails.ts:24-32` `refetchInterval: 10000`.
- **Proposed:** in `useCaseDetails`, detect 404 (`error.response?.status === 404` in queryFn or onError) → expose `isNotFound`; or handle in pages' error blocks:
  - user `case/[id]/page.tsx:66-74` — `if 404 → notifications.show + router.push("/dashboard")`.
  - supporter `supporter/case/[id]/page.tsx:64-72` — same (redirect `/supporter` or `/dashboard`).
- Redirect/invalidate precedent: `useIntakeForm.ts:101-109` (invalidate `["cases"]` + `["case", id]` + push).

**Risks:** WS sub only active on discussion tab (primary path unreliable when on other tabs — poll fallback is the real safety net; 10s worst-case delay). Support/owner role split: redirect target role-aware optional. Duplicate handling (real-time + poll both firing) — guard with `router.replace` idempotency or state flag.

---

## #1 — Admin SLA deadline + highlight

**Status: largely ALREADY IMPLEMENTED** — verify only.
- `AdminCaseAssignmentTable.tsx`: SLA column `:185`, `SlaTimer` component `:371-419` (live countdown; <4h danger, <12h warning, >24h green; tooltip full date `:415`), row tint `getSlaRowClass` `:26-33` (overdue red, <12h yellow, <24h subtle yellow) applied `:199`.
- Data present: `/admin/cases` returns `sla_deadline_at` (`list-admin-cases.usecase.ts:82`).
- Global overdue banner: `admin/page.tsx:557-562` (`statsQuery.data.slaBreachCount`).
- **Proposed (gaps only):** align SlaTimer thresholds (`:396-405`) with row-tint thresholds (`:29-31`) if inconsistency bothers; consider showing exact deadline date in column (currently relative + tooltip); confirm `slaBreachCount` in stats payload exists (used already).

**Risks:** none significant.

---

## Cross-cutting open questions (blockers)

1. **T17 (bug #5):** Backend machine + endpoint do not exist (`transition.types.ts:19-45`, `case-machine.ts:170-179`). Who adds T17_CONFIRM_COMPLETION + `POST /cases/:id/confirm-completion` + `allowed_transitions` inclusion? FE needs API contract first.
2. **Superseded (#12):** Flag absent in FE types + backend (grep 0 hits). Requires backend change to `document-contract.ts` / `assemble-document-workspace.ts` + FE type + DocumentWorkspace regrouping + AdminDocumentsTable badge. FE-only scope is not viable for the full requirement.
3. **Intake doc category codes (#12):** Verify backend intake POST persists `documents[].document_type` codes and maps to `doc_type_label` for workspace display (`buildCommonRow` uses `doc_type_label` — `document-workspace.types.ts:57`).
4. **Admin "submitted" filter (#9):** `submitted` = `user_facing_stage` or `internal_status`? Internal union has no `submitted`; `triage_pending` exists. Confirm which field /admin/cases carries for submitted cases.
5. **intake_pending in admin list (#9):** Confirm `/admin/cases` returns intake_pending cases at all (is `intake_pending` a case state in `isValidAdminInternalStatus`? `list-admin-cases.usecase.ts:24-27`).
6. **T11 blocked error shape (#3):** Verify `useSupporterOutputUpload` error response (`supporter-outputs/upload` endpoint) — does it return `code` (machine transition error) or only `message`? Rich-copy mapping depends on it.
7. **Intake maxLength backend (#14):** DB columns / backend zod limits — currently no max anywhere; FE-only enforcement means API accepts oversized payloads.
8. **completed tick (#5):** Exact visual spec ("clear tick both sides") — CaseStatusHeader badge vs CaseCard — confirm placement.
9. **case_summary / lecturer_feedback (#14):** No FE input exists for these (ReviewSubmitStep display-only `:26-27,94-97`) — skip maxLength or add inputs? Confirm intent.

## What was NOT covered

- Backend implementation points (T17, superseded flag, intake doc_type persistence, Centrifugo CASE_DELETED publish) — flagged as required cross-team work, only FE call sites documented.
- Playwright/e2e coverage — none exists in apps/web-1 (no test infra found).
- Exact Vietnamese copy strings for new banners — drafts above, final copy TBD by product.
