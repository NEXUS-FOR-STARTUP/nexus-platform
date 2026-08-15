# BE Wiring Gaps — XState v5 Workflow Engine (T2/T16, T11, T8, publish-report, F11)

Researcher: technical-analyst | Date: 2026-08-14 | READ-ONLY. Sources: verbatim file reads + phase-03/04/06 plans.

Wiring status TODAY (verified): wired = T3/T4 (resubmit-case.usecase.ts:22), T5 (admin/accept-case.usecase.ts:18), T6 (cases/assign-supporter.usecase.ts:74 + admin/assign-supporter.usecase.ts:38), T9 (submit-revision.usecase.ts:120), T12 (admin/reject-case.usecase.ts:23), T13 (veto-case.usecase.ts:15), T14 (complete-case.usecase.ts:22). **NOT wired: T2, T16, T7, T8, T10, T11, T15.**

---

## 1. T2/T16 — submit-intake

### Current flow (submit-intake.usecase.ts:9-130)
```
L1 auth owner/member (16-20) → requireCredits (22, violates Q5: remove — credit moves to T5)
→ outer prisma.$transaction (25) ← F8 violation: service owns its own tx, nested tx crashes
→ find/create CP1 checkpoint if current_checkpoint missing (29-48)
→ lifecycleUnit v00 create, unit_type 'version', version_no 1 (51-61)
→ createDocumentRecordsForUnit doc_type 'intake_document', direction 'inbound', label 'intake' (64-74)
→ case.update payment_status + school/course_context/group_no/team_name (77-86)
→ stage→'submitted' IF intake_pending|intake_ready|rejected (91-111) + caseEvent case_submitted|case_resubmitted
→ caseEvent 'intake_submitted' (113-120)
```

### New-case state (createCaseWithCheckpointAndIntake, case.repository.ts:167-231)
```ts
// case.repository.ts:179-183
user_facing_stage: isFree ? "submitted" : "intake_pending",
internal_status: "triage_pending",
payment_status: isFree ? "paid" : "unpaid",
current_checkpoint: "CP1",
```
CP1 checkpoint + v00 lifecycleUnit (version_no 1) + intake_document records are ALREADY created at case creation (186-218). **So on first submit, checkpoint + v00 unit exist; submit-intake currently creates a SECOND duplicate v00 unit (51-61).**

### Machine facts (case-machine.ts)
- T2_SUBMIT_INTAKE: state `triage_pending` self-loop (68), guard `isOwnerOrMember` (69), action `upsertDoc` (70). TARGET_STAGE[T2]='submitted' (case-transition.service.ts:17).
- T16_EDIT_INTAKE: state `triage_pending` self-loop (77), guard `isBeforeSubmission` (78: `event.data.currentStage === 'intake_pending' || 'intake_ready'` — case-machine.ts:38-39), action `upsertDoc` (79). TARGET_STAGE[T16]='intake_pending' (:31).
- `currentStage` injected from `caseRecord.user_facing_stage` (case-transition.service.ts:209).
- **CONTRADICTION with phase-04 plan (phase-04:54-56):** plan says `isFirstSubmission = stage∈{intake_pending,intake_ready} → T2; else → T16`. But machine guard `isBeforeSubmission` BLOCKS T16 for stage='submitted' → plan's "else → T16" would throw `INVALID_TRANSITION` for submitted cases. Semantics must be fixed in new plan. Correct mapping:
  - stage intake_pending/intake_ready (status triage_pending) → **T2** (first submit).
  - stage submitted + status triage_pending → T2 technically still fires (guard isOwnerOrMember passes, self-loop, upsertDoc reruns) — decide: no-op or block.
  - stage rejected (status cancelled) → machine state 'cancelled' has ONLY T3/T4 (case-machine.ts:197-211) → **T2 unavailable**; current use case handles rejected (91) → must route via **T3_RESUBMIT_AFTER_REJECT** (guard isOwner+hasCredit, actions upsertDoc+resetStatus) or keep old path.
  - T16 EDIT: only meaningful pre-submission (target stage intake_pending). Phase-04 success criteria "T16 block sau nộp" IS enforced by guard — but then T16 is nearly useless (only fires when already intake_pending).

### upsertDoc executor vs intake docs (case-transition.service.ts:77-117)
Executor requires: `tx.case.findUniqueOrThrow` + `current_checkpoint` else NO_CHECKPOINT error (92-94) → `checkpoint.findFirstOrThrow` (95-97) → `lifecycleUnit.findFirstOrThrow` where `unit_type:'version' AND version_no: checkpoint.latest_version_no` (98-105) → `upsertDocumentRecordsForUnit(... 'revision_document', 'outbound', label v{latest})` (106-116).
**Does NOT fit intake:** (a) doc_type/direction hardcoded 'revision_document'/'outbound' — intake needs 'intake_document'/'inbound'; (b) attaches to EXISTING version unit — cannot create new lifecycleUnit; (c) intake checkpoint creation (CP1 branch, submit-intake:34-48) is out-of-machine logic.
**Verdict:** checkpoint/lifecycleUnit creation MUST stay in use case (or become a new executor action type). T2/T16 CANNOT carry all current intake logic inside existing `upsertDoc`. Options:
1. **Recommended (KISS):** keep unit/doc creation in use case (optionally parametrize a new `upsertIntakeDoc` executor action for atomicity), call `executeTransition(T2|T16|T3)` only for stage/status/caseEvent; drop the duplicate v00 creation + drop requireCredits (Q5). Accept non-atomic doc-write vs transition unless new action added.
2. New action `upsertIntakeDoc` in executor doing checkpoint/unit/doc inside service tx (full atomicity, matches F8). More code, aligns with machine-design intent.

---

## 2. T11 — submitSupporterOutputUploadUseCase

### Current flow
- Use case (submit-revision.usecase.ts:215-283): auth = assigned supporter OR admin (237-240); force doc_type 'supporter_output' (247-249); validateDocumentsByFlow 'supporter_output'/'version' (250); selectCheckpoint (252); `createSupporterOutput` (258); post-commit `emitEvent(REPORT_PUBLISHED)` (266-276).
- Repo `createSupporterOutput` (case.repository.ts:486-573): versionNo=checkpoint.latest_version_no (505), unitCode=`v{versionNo}` padded (506, buildVersionUnitCode :405-407); find version unit (507-515); **credit check** balance≥1 else NO_CREDITS (521-528); docs `supporter_output`/'outbound' (530-540); **stage/status write** report_ready + report_ready_to_publish (542-548); caseEvent supporter_output_uploaded (550-561); **credit consume** -1, idempotency_key `consume-${unitCode}-${caseId}` (563-573); caseEvent credit_used (575-579).
- Route: cases.routes.ts:38 `POST /:id/supporter-outputs/upload` → submitSupporterOutputUploadHandler (cases.controller.ts:242-261; auth = getSession + role param, use case re-checks assignment).
- **Frontend USES it:** useCaseDocumentUploads.ts:57 + SupporterOutputUploadModal (supporter/case/[id]/page.tsx:119-123, button 100-107).

### Machine vs executor (T11)
Machine: `supporter_working` → `report_ready_to_publish`, guard `and(isAssignedSupporter, hasCredit)`, actions `[subtractCredit, lockPrice]` (case-machine.ts:136-140). TARGET_STAGE[T11]='report_ready' (:26).
`subtractCredit` executor (case-transition.service.ts:120-144): `unitCode = context.unitCode ?? case-${caseId}` (121); key `consume-${unitCode}-${caseId}` (122); balance aggregate (123-127); NO_CREDITS if <1 (128-130); creditLedger.create amount -1, balance_after, type 'consumption', **reference_type 'audit_round'**, reference_id unitCode, idempotency_key key (132-142).

### Idempotency conflict
| Source | Key | reference_type |
|---|---|---|
| Repo createSupporterOutput (:571) | `consume-v01-{caseId}` (version embedded in unitCode) | null |
| Machine executor (:122) | `consume-{unitCode}-{caseId}`; unitCode defaults `case-{caseId}` | 'audit_round' |
| Phase-03 plan (:148) | `consume-{unitCode}-{caseId}-v{versionNo}-{nonce}` | — |
| Phase-04 plan (:18) | `consume-{unitCode}-{caseId}-v{versionNo}` | — |

Keys MATCH (same shape) **only if** use case passes `data.unitCode = v{versionNo}`. Without it, machine key = `consume-case-{caseId}-{caseId}` → replay of same version double-charges. Version change (v01→v02) yields different key either way → OK. Also note repo's `createDocumentRecordsForUnit` (not upsert) → **re-upload same version hits P2002** (duplicate lifecycle_unit_id+doc_type+seq); machine `upsertDoc` fixes that (bug #2/#13).
**Wire plan:** use case → `executeTransition({transition:'T11_SUBMIT_OUTPUT', data:{files, unitCode: v{versionNo}}})`; credit check+consume inside tx (F2); drop repo credit/stage logic; keep `emitEvent(REPORT_PUBLISHED)` post-commit. `lockPrice` action is currently no-op (case-transition.service.ts:164-169) — fine.

---

## 3. T8 — request-more-info (admin + supporter)

### Current direct-write paths
- `requestCaseMoreInfo` (case.repository.ts:306-327): tx case.update stage+status + caseEvent w/ {query}. No machine.
- Admin (admin/application/request-more-info.usecase.ts:7-53): validates (12-22); no-op if already need_more_information/waiting_user (29-34); `requestCaseMoreInfo(caseId, adminId, 'more_info_requested', query, 'need_more_information', 'waiting_user')` (37-44); **emit REQUEST_MORE_INFO** (45-51).
- Supporter (supporter/application/supporter-request-more-info.usecase.ts:8-63): isFinalCaseStage block (26-32); no-op if already waiting (34-40); `requestCaseMoreInfo(caseId, userId, 'request_more_info', ...)` (42-49); **emit REQUEST_MORE_INFO** (51-57).

### Routes + auth
- Admin: admin.routes.ts:31 `POST /api/admin/cases/:id/request-more-info` → admin.controller.ts:120 (getAdminSession, admin-only).
- Supporter: supporter.routes.ts:15 `POST /api/supporter/cases/:caseId/request-more-info` → supporter.controller.ts:75-99 with `requireCaseAccess(c, caseId, {allowStudent:false, allowSupporter:true, allowAdmin:true})` — authorization.ts:44: supporter granted **only if `assigned_supporter_auth_user_id === userId`** → **YES, guarded to assigned supporter at route level** (admin also passes via :40-42).

### notifyUser situation
Machine T8 action `notifyUser` (case-machine.ts:129) → executor no-op (case-transition.service.ts:166-169, grouped with autoResumeWork/resetStatus/emitStageChanged/lockPrice). **Real notifications** come from use-case `emitEvent(DOMAIN_EVENTS.REQUEST_MORE_INFO)` post-commit (admin:45-51, supporter:51-57) → consumed by notifications/application/recipients.ts:24,45. So machine action is redundant but harmless.

### Wiring risk
Machine T8 exists: `supporter_working` → `waiting_user`, guard isAssignedSupporter (case-machine.ts:126-130); also reachable via update-case-status gate `'supporter_working:waiting_user'` (update-case-status.usecase.ts:22). **Blocking issue:** admin triage requests info on cases in `submitted`/`triage_pending` (pre-accept) — machine T8 only from `supporter_working` → wiring T8 for admin path BREAKS triage. Plan: wire T8 only for supporter path (or add T8 to more machine states); keep admin path direct OR gate admin calls to supporter_working cases only. Update-case-status gate (:22) currently serves T8 but has **no caller** (see §6/§7: no FE consumer of /status).

---

## 4. publish-report path (bypasses T11)

### Call chain
`publishReportUseCase` (supporter/application/publish-report.usecase.ts:4-14) → `approveReportUseCase` (reports/application/approve-report.usecase.ts:8-66): status must be 'draft' else 409 (18-35) → `publishReport(reportId, case_id, userId)` (:37) → audit + emit REPORT_PUBLISHED (:50-60).
`publishReport` (report.repository.ts:83-120): tx report.update status 'APPROVED' + approved_by + sent_at (85-92) → **case.update user_facing_stage 'report_ready' + internal_status 'report_ready_to_publish'** (94-100) → upsertReportArtifactDocumentRecord (108-116). **No credit operation.**

### Routes
- supporter.routes.ts:14 `POST /api/supporter/reports/:reportId/publish` (supporter only, requireReportCaseAccess allowSupporter allowAdmin:false — supporter.controller.ts:55-73).
- reports.routes.ts:13 `POST /api/reports/:id/approve` (same use case, reports.controller.ts:61-79).
- **Frontend: NO caller** — grep apps/web-1 for `reports/`, `/publish`, `/approve` → zero. Supporter publishes via `/cases/:id/supporter-outputs/upload` instead. publish-report path is backend-only/legacy.

### T11 vs T14 intended design (plans)
- Phase-04:32 — submitSupporterOutput → executeTransition(T11); **credit consumed at supporter-output-upload** (not at publish). Phase-04:18 — idempotent key per version.
- Phase-06:36-38 — T14 complete from report_ready/report_ready_to_publish → completed/done, guard isAssignedSupporter, notify — no credit.
- **Conclusion:** credit consumption at supporter-output-upload IS the intended design. publish-report should NOT subtract credit. But it writes the same stage/status pair as T11 → **split-brain risk** (two paths write report_ready/report_ready_to_publish). Since FE never calls publish-report, recommend: (a) keep T11 as the canonical report_ready path; (b) either delete/disable publish-report routes+use cases (report-table artifact flow superseded by supporter_output doc records), or keep report-table management but REMOVE its case.update stage/status writes (defer to T11). Decision needed — see Unresolved.

---

## 5. F11 — isValidStageTransition removal

### Definition (case.types.ts:54-68)
```ts
export function isValidStageTransition(from: string, to: string): boolean {
  if (from === to) return true;
  if (isFinalCaseStage(from)) return false;
  const allowed: Record<string, string[]> = {
    submitted: ["need_more_information", "under_review", "rejected", "closed"],
    need_more_information: ["revision_submitted", "closed"],
    under_review: ["report_ready", "need_more_information", "closed"],
    report_ready: ["waiting_for_revision", "completed", "closed"],
    waiting_for_revision: ["revision_submitted", "closed"],
    revision_submitted: ["under_review", "need_more_information", "closed"],
  };
  return allowed[from]?.includes(to) ?? false;
}
```

### All callers
| Caller | Lines | Assertions that break |
|---|---|---|
| update-case-status.usecase.ts (PROD) | :89 | stage-validation branch in fallback — breaks only if function removed; fallback then allows anything or must be deleted |
| upgrade-package.test.ts | :45-59 | 5 asserts (:51-58): completed→under_review false, closed→submitted false, rejected→submitted false, submitted→under_review true, submitted→need_more_information true |
| phase-06-core-usecases.test.ts | :314-323 | 4 asserts (:318-322): submitted→under_review true, submitted→completed false, completed→under_review false, isFinalCaseStage checks |
| phase-02-lifecycle.test.ts | :7-13 | 4 asserts (:9-12): submitted→under_review true, under_review→report_ready true, submitted→completed false, completed→under_review false |

Total **13 assertions** + 1 production call. Deleting function breaks all imports → tests fail at import. Replacement: keep tests but assert against `getAvailableTransitions(machine)` semantics, or delete the test blocks with phase-04 F11 (`grep isValidStageTransition → 0 caller`, phase-04:178-180, :26).

### Fallback structure (update-case-status.usecase.ts:61-151)
1. XState gate (:61-71): `XSTATE_TRANSITIONS` map (:19-31) — 11 status pairs → executeTransition.
2. Fallback (:73-151): stage validation via isValidCaseStage/isFinalCaseStage/**isValidStageTransition** (:74-96) → direct `prisma.case.update` (:120-123) + caseEvent + emit.

### Pairs reachable ONLY via fallback (not in XSTATE_TRANSITIONS)
Map keys (:20-30): accepted_unassigned:assigned, assigned:supporter_working, supporter_working:waiting_user, supporter_working:supporter_working, report_ready_to_publish:done, and 6× :cancelled (triage_pending, accepted_unassigned, assigned, supporter_working, waiting_user, report_ready_to_publish).
Stage-level pairs allowed by isValidStageTransition that are NOT machine transitions: **submitted→need_more_information, submitted→under_review, submitted→rejected, submitted→closed, need_more_information→revision_submitted, need_more_information→closed, under_review→report_ready, under_review→need_more_information, under_review→closed, report_ready→waiting_for_revision, report_ready→completed, report_ready→closed, waiting_for_revision→revision_submitted, waiting_for_revision→closed, revision_submitted→under_review, revision_submitted→need_more_information, revision_submitted→closed** (17 pairs) + any stage-only update (nextStatus undefined, :103-105 rejects both-undefined; stage-only passes :107-112).

### Recommendation
Per phase-04 F11 + F5: **remove fallback entirely** once T2/T16/T8/T11/T15 wired through machine. All 17 "fallback-only" stage pairs are covered by machine transitions (T5=submitted→under_review, T8=need_more_information, T12=rejected, T15=closed, T9=revision_submitted, T11=report_ready, T14=completed, T10=under_review self-loop). No legitimate pair needs the direct prisma.update path. Keep `XSTATE_TRANSITIONS` gate only if T15-close/close-case keeps routing through /status (see §7) — better: route close-case through executeTransition(T15) directly and delete the gate+fallback. NOTE close-case today writes **'done'** status (close-case.usecase.ts:31-32) but machine T15 targets **'cancelled'** (case-machine.ts:174-177) — semantic conflict to resolve.

---

## 6. Routes (verbatim) — cases.routes.ts (full, :27-50)
```ts
casesRouter.get("/", listCasesHandler);
casesRouter.post("/", createCaseHandler);
casesRouter.get("/supporters", listSupportersHandler);
casesRouter.get("/document-types", listDocumentTypesHandler);
casesRouter.post("/uploads/managed-document", uploadManagedDocumentHandler);
casesRouter.get("/:id", getCaseDetailHandler);
casesRouter.get("/:id/documents", getCaseDocumentsHandler);
casesRouter.post("/:id/revisions", submitRevisionHandler);            // T9 (wired)
casesRouter.post("/:id/revisions/upload", submitRevisionUploadHandler); // legacy direct path
casesRouter.post("/:id/supporter-outputs/upload", submitSupporterOutputUploadHandler); // T11 target
casesRouter.post("/:id/external-feedback/upload", submitExternalFeedbackUploadHandler);
casesRouter.post("/:id/assign", assignSupporterHandler);              // T6 (wired)
casesRouter.post("/:id/status", updateCaseStatusHandler);             // T7/T8/T10/T15 gate (no FE caller)
casesRouter.get("/:id/messages", listMessagesHandler);
casesRouter.post("/:id/messages", sendMessageHandler);
casesRouter.put("/:id/settings", updateCaseSettingsHandler);
casesRouter.delete("/:id", deleteCaseHandler);
casesRouter.post("/:id/intake", intakeHandler);                       // T2/T16 target
casesRouter.post("/:id/veto", vetoHandler);                           // T13 (wired)
casesRouter.post("/:id/complete", completeCaseHandler);               // T14 (wired)
casesRouter.post("/:id/upgrade-package", upgradePackageHandler);
casesRouter.post("/:id/resubmit", resubmitCaseHandler);               // T3/T4 (wired)
```
Related: admin.routes.ts:29-32 (accept/reject/request-more-info/assign), supporter.routes.ts:12-16 (draft report, edit report, publish, request-more-info, close), reports.routes.ts:11-14 (draft/edit/approve/latest).

## 7. Frontend endpoint usage (apps/web-1)
| Endpoint | FE caller |
|---|---|
| `POST /cases/:id/intake` | useIntakeForm.ts:95 (both T2/T16; gated by page.tsx:122-144 — opens when isIntakeReady or stage rejected) |
| `POST /cases/:id/revisions/upload` | useCaseDocumentUploads.ts:138 (student revision) |
| `POST /cases/:id/supporter-outputs/upload` | useCaseDocumentUploads.ts:57 + SupporterOutputUploadModal |
| `POST /cases/:id/status` | useCaseDetails.ts:31 — **`updateStage` exported (:99) but ZERO consumers in web-1** → dead endpoint |
| `POST /cases/:id/resubmit` | useCaseDetails.ts:74 |
| `POST /admin/cases/:id/request-more-info` | useAdminCases.ts:55 (admin/page.tsx:190) |
| `POST /admin/cases/:id/accept\|reject\|assign` | useAdminCases.ts:31,43,67 |
| `GET /cases/:id`, `/cases/:id/messages`, PUT `/cases/:id/settings` | useCaseDetails/useCaseChat |
| `/reports/:id/publish`, `/reports/:id/approve`, `/supporter/cases/:id/request-more-info`, `/supporter/cases/:id/close`, `POST /cases/:id/complete`, `POST /cases/:id/veto` | **no FE caller** (backend-only/legacy) |
| `POST /cases/:id/revisions` (plain) | **no FE caller** (only `/revisions/upload` used) |

---

## Gap Summary

| Transition | Current path | Target path | Files to change | Risk notes |
|---|---|---|---|---|
| T2_SUBMIT_INTAKE | submit-intake.usecase.ts direct tx write | use case → executeTransition(T2); keep unit/doc logic or new `upsertIntakeDoc` action | submit-intake.usecase.ts, case-transition.service.ts (action), case.repository.ts (remove dup v00) | F8 nested tx must go; drop requireCredits (Q5); duplicate v00 unit today |
| T16_EDIT_INTAKE | none (guard blocks; plan mapped wrong) | T2/T16 split per machine semantics (T16 only pre-submit) | submit-intake.usecase.ts, phase-04 mapping | Plan-vs-guard contradiction: T16 from 'submitted' throws INVALID_TRANSITION |
| rejected resubmit via intake | submit-intake.ts:91 'rejected'→submitted | T3_RESUBMIT_AFTER_REJECT (machine 'cancelled' state) | submit-intake.usecase.ts | T2 unavailable from status 'cancelled'; hasCredit guard applies |
| T11_SUBMIT_OUTPUT | createSupporterOutput direct (credit+stage+docs) | use case → executeTransition(T11), pass `unitCode=v{versionNo}` | submit-revision.usecase.ts, case.repository.ts (createSupporterOutput slims to docs only), service (key verify) | Idempotency key shape must equal `consume-{unitCode}-{caseId}`; P2002 on same-version re-upload fixed by upsertDoc |
| T8_REQUEST_INFO | requestCaseMoreInfo direct (2 use cases) | supporter path → executeTransition(T8); admin triage path blocked | supporter-request-more-info.usecase.ts, admin/request-more-info.usecase.ts | Machine T8 only from supporter_working → admin triage-stage requests break; notifyUser no-op OK (use-case emit works) |
| publish-report | report.repository.ts:83-120 direct stage write | stop writing case stage/status (T11 owns it) or remove flow | report.repository.ts, approve-report.usecase.ts, supporter/reports routes | Split-brain with T11 (both write report_ready/report_ready_to_publish); no FE caller; no credit here (correct per design) |
| close-case (T15) | close-case.usecase.ts:26-33 writes 'closed'/'done' | executeTransition(T15) (machine target 'cancelled') | close-case.usecase.ts, machine | Status mismatch: 'done' vs machine 'cancelled' — resolve semantics |
| isValidStageTransition | case.types.ts:54 + 13 test asserts + prod :89 | delete (F11) after all wired; rewrite 3 test files | case.types.ts, upgrade-package.test.ts, phase-06-core-usecases.test.ts, phase-02-lifecycle.test.ts, update-case-status.usecase.ts | 13 asserts break; fallback pairs (17) all machine-covered |
| update-case-status fallback | direct prisma.update :120-123 | remove entirely; keep only gate or delete use case | update-case-status.usecase.ts | /status endpoint dead in FE; assign-supporter T6 reassignment edge (machine T6 only from accepted_unassigned) |

## Unresolved questions
1. T16 intended product semantics: "edit intake before submission" (machine) vs "edit after submit" (phase-04 plan)? Guard says pre-submit only — confirm with PO.
2. publish-report flow: delete (report-table superseded by supporter_output doc records) or keep report-table artifact mgmt without stage writes? FE shows zero usage.
3. close-case target status: 'done' (current) vs 'cancelled' (machine T15)? Machine 'cancelled' has T3/T4 resubmit; 'done' is final.
4. Admin request-more-info on pre-accept cases: keep direct write, or restrict admin T8 to supporter_working only?
5. Supporter reassignment (assigned→assigned, new supporter): machine T6 not available from 'assigned' state → INVALID_TRANSITION today via cases/assign-supporter.usecase.ts:74; needs machine T6 in 'assigned' state or fallback.
