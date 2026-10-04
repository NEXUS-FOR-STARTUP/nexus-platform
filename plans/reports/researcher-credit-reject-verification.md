# Researcher — Credit Lifecycle & Reject/Resubmit Verification

Generated: 2026-08-14. Read-only investigation. Corrections to plan statements with file:line.

## MISSION A — Credit lifecycle (mua / check / trừ)

### A1. REAL lifecycle (state-diagram form)

```
1. CREATE CASE (no credit yet)
   - POST /cases  -> createCaseUseCase -> createCaseWithCheckpointAndIntake
     case.repository.ts:168-231 — creates CASE + CP1 + lifecycleUnit v00 + intake docs
     stage: isFree ? "submitted" : "intake_pending"; internal_status: "triage_pending"
     (case.repository.ts:179-181). locked_price = package price (create-case.usecase.ts:89).
     Team-fit save ALSO creates case: ai-engine.routes.ts:90-118 (stage intake_pending,
     payment_status: isFree ? "not_required" : "unpaid"), default pkg 'pkg_tf_free'
     (save-team-fit.usecase.ts:83,111 -> lockedPrice=0, isFree=true).

2. BUY CREDIT (AFTER case exists — per-case, never before)
   - FE: CreditQuantityModal.tsx:34-52 -> POST /orders (only if currentPackageId ===
     PACKAGE_KEYS.FREE -> first POST /cases/:id/upgrade-package, line 36-40).
     Requires caseId prop — modal only reachable from case page (page.tsx:112,129,182,200).
     -> purchase is per-case, always after case creation. case/[id]/payment/page.tsx:1-6
     is a dead redirect to /dashboard/case/:id — no standalone payment page.
   - BE: createOrderUseCase (create-order.usecase.ts:51-197):
     - validates service_type credit_audit + resolves price from case package (21-41)
     - order.create status pending (84-102)
     - DUAL_WRITE_PAYMENT=true -> tx.payment.create status paid (104-121)
     - walletService.withdraw(VND) (123-126) — wallet.service.ts:71-105
     - order -> paid (128-134)
     - creditLedger.create amount=+quantity type=purchase ref=order (141-152)
     - outbox ORDER_PAID (155-167)

3. CHECK (credit gate points)
   a. T5_ACCEPT guard hasCredit — case-machine.ts:72-75 (triage_pending->accepted_unassigned,
      guard and(isAdmin, hasCredit)). hasCredit = lockedPrice===0 -> true | creditBalance>=1
      (case-machine.ts:30-33). NO subtractCredit action on T5 (no action key — verified).
      Guard input: executeTransition computes creditBalance for
      ['T11_SUBMIT_OUTPUT','T5_ACCEPT','T3_RESUBMIT_AFTER_REJECT']
      (case-transition.service.ts:198-200).
   b. requireCredits(caseId) — case.types.ts:77-90. Checks getCreditBalance(caseId) >= 1;
      throws AppError(402, 'NO_CREDITS', 'Het luot kiem tra. Vui long mua them credit.')
      (case.types.ts:81). Graceful fallback P2021 (table missing) -> allow (85-87).
      CALLERS (all 4, verified by grep):
      - submit-intake.usecase.ts:22
      - submit-revision.usecase.ts:151 (submitRevisionUploadUseCase — /revisions/upload)
      - submit-revision.usecase.ts:306 (submitExternalFeedbackUploadUseCase — /external-feedback/upload)
      - send-message.usecase.ts:37 (every chat message!)
      NOTE: "external-feedback" = submitExternalFeedbackUploadUseCase, lives inside
      submit-revision.usecase.ts — matches user's list. requireCredits CHECKS only, never deducts.
   c. createSupporterOutput repo balance check — case.repository.ts:521-528:
      throws AppError(402, 'NO_CREDITS') if balance < 1.

4. CONSUME (who actually subtracts)
   - REAL consumption today: createSupporterOutput repo — case.repository.ts:563-573
     creditLedger.create amount=-1 type=consumption, idempotency_key consume-{unitCode}-{caseId}
     (unitCode = buildVersionUnitCode(versionNo) = "v01" padded, case.repository.ts:506).
     Path: POST /cases/:id/supporter-outputs/upload (cases.routes.ts:38)
     -> submitSupporterOutputUploadUseCase (submit-revision.usecase.ts:215-283)
     -> createSupporterOutput (case.repository.ts:486). Feeds stage=report_ready + status
     report_ready_to_publish (542-548).
   - MACHINE action subtractCredit (case-machine.ts:139, T11 actions ['subtractCredit','lockPrice'])
     is NEVER invoked — no use case calls executeTransition with T11_SUBMIT_OUTPUT
     (grep: zero production callers; only tests + machine). Dead machine path.
   - No other subtraction anywhere (refundCredit does NOT touch creditLedger, see A4).

5. REFUND (veto only)
   - T13_VETO action refundCredit — case-machine.ts:112-116,141-145 -> executed in
     case-transition.service.ts:146-153 -> walletService.refund(VND to wallet, sourceType
     'admin_veto') wallet.service.ts:107-145. Does NOT create creditLedger entry and does NOT
     decrement credit balance. Veto use case: veto-case.usecase.ts:15-21 (T13, roleVerified ADMIN).
```

### A2. Purchase timing answer
Purchase ALWAYS after case creation (per-case). Case -> upgrade (free->audit, optional) -> order
-> wallet withdraw -> creditLedger purchase. T5_ACCEPT (hasCredit) happens AFTER purchase.
The machine's hasCredit guard assumes credits bought before accept.

### A3. Duplicated / contradictory credit logic (list)
1. subtractCredit in machine action (case-machine.ts:139) vs consumption in createSupporterOutput
   repo (case.repository.ts:563-573). Machine path dead; repo path live. Idempotency key format
   differs: machine consume-{unitCode}-{caseId} with unitCode default `case-{caseId}`
   (case-transition.service.ts:121-122) vs repo consume-v01-{caseId} (case.repository.ts:571).
   New plan phase-02:17 acknowledges ("Credit hien bi tru o 2 noi").
2. purchase in payment.repository.ts:188-228 (verifyPayment 'paid' -> creditLedger purchase,
   idempotency purchase-{paymentId}) vs create-order.usecase.ts:141-152 (purchase ref order).
   verifyPayment purchase gated by USE_ORDER_DOMAIN !== "true" (payment.repository.ts:189)
   AND verifyPaymentUseCase/handler are NOT mounted on any route (payments.routes.ts:8 only
   mounts /proof; /api/payments mounted at index.ts:152-153). FE admin still calls
   POST /payments/:id/verify (useAdminPayments.ts:26) -> 404 today. Legacy purchase = dead-ish,
   only reachable via tests.
3. requireCredits (check-only) vs T5 hasCredit (check) vs repo balance check
   (createSupporterOutput :521-528) — 3 separate balance gates, 2 of which are per-request
   pre-checks outside a transaction (TOCTOU window).
4. refundCredit action refunds VND only; creditLedger balance untouched -> after veto user keeps
   unconsumed credit AND gets money back (policy intent was "credit->VND", phase-06:32, but
   implementation never decrements credit). After veto, credit balance remains (e.g. 1) so
   T3 resubmit hasCredit passes anyway.
5. hasCredit guard double: lockedPrice===0 bypass (case-machine.ts:31) + requireCredits has no
   such bypass — free cases still hit requireCredits on intake/message/external-feedback (402 if
   balance 0). Contradiction acknowledged as R11 in new plan.

### A4. Team-fit package/price/credit implications
- saveTeamFitUseCase: default package 'pkg_tf_free' (save-team-fit.usecase.ts:83), lockedPrice =
  pkg.price (110), isFree = pkg.price===0 (111). createCaseAndReport sets payment_status
  'not_required' when isFree (ai-engine.routes.ts:103). Free case: lockedPrice=0 -> machine
  hasCredit returns true (case-machine.ts:31) -> accept never blocked by credit.
- upgrade to paid via CreditQuantityModal: currentPackageId===FREE -> POST upgrade-package
  (CreditQuantityModal.tsx:36-40) -> upgradePackageUseCase (upgrade-package.usecase.ts) target
  pkg_tf_audit only (line 10), updates locked_price (line 46 via upgradeCasePackage).

### A5. Wallet confirm
credit purchase = walletService.withdraw(VND) (create-order.usecase.ts:123-126) + creditLedger
purchase (+quantity). deposit: wallet.service.ts:22-69 (sepay webhook auto-verify deposits,
sepay-webhook.usecase.ts:75-92). refund: wallet.service.ts:107-145 (veto only).

## MISSION B — Reject / Resubmit / Edit-intake

### B1. resubmitCase repo (case.repository.ts:284-304) — DEAD CODE
Verbatim core: update user_facing_stage="submitted", internal_status="triage_pending",
caseEvent 'case_resubmitted'. Zero callers (grep resubmitCase( -> 1 hit = definition).
Live resubmit path = resubmit-case.usecase.ts:6-36 -> executeTransition T3_RESUBMIT_AFTER_REJECT
(default, line 9) or T4_RESUBMIT_AFTER_VETO. No content/checkpoint/unit updates anywhere in
resubmit: machine T3 actions ['upsertDoc','resetStatus'] (case-machine.ts:200-204), but
upsertDoc (case-transition.service.ts:77-118) requires context.data.files — resubmit use case
passes NO data -> upsertDoc no-op; resetStatus no-op (case-transition.service.ts:164-169).
Transition only flips stage/status/version_no+1 (case-transition.service.ts:241-248) + caseEvent.

### B2. Bug #12 / F15 verdict
- Promise: phase-06-refund-resubmit-policy.md:48 ("upsertDoc (version moi — fix #12: content
  duoc upsert)") and :146 (resubmit-case SỬA — fix #12 upsert content).
- Reality: resubmit-case.usecase.ts has NO content handling. Content update is NOT in resubmit;
  it happens ONLY via POST /cases/:id/intake (submit-intake) which creates a NEW v00 unit
  (submit-intake.usecase.ts:51-61) + updates case fields (77-86) + sets stage submitted (91-98).
  Because createCaseWithCheckpointAndIntake already created v00 (case.repository.ts:195-205),
  every paid case ends with TWO v00 units -> bug #12 (doc count mismatch) root cause, still open.
- VERDICT: F15/phase-06 claim NOT implemented in resubmit. Content updates flow through a
  different endpoint (intake). New plan D5 (phase-02:72-86) addresses by upserting v00 + docs —
  not yet in code.

### B3. Reject -> Edit -> Resubmit TODAY (broken)
1. Admin reject: POST /api/admin/cases/:id/reject (admin.routes.ts:30) -> rejectCaseUseCase
   (T12, reject-case.usecase.ts:23-29) -> stage 'rejected', status 'cancelled'
   (TARGET_STAGE T12 -> 'rejected', case-transition.service.ts:27; machine T12
   triage_pending->cancelled, case-machine.ts:81-84). No refund on T12 (no action).
2. FE: case page.tsx:130 onOpenIntake when stage==="rejected" -> /dashboard/intake?caseId=id.
   StatusGuidanceCard.tsx:189-223 shows "Chỉnh sửa hồ sơ để nộp lại" button.
3. Intake page update mode -> POST /cases/:id/intake (useIntakeForm.ts:94-96) -> submitIntakeUseCase:
   requireCredits (:22), creates NEW v00 (:51-61), updates case fields (:77-86),
   isPreSubmitStage includes "rejected" (:91-93) -> sets user_facing_stage="submitted" (:95-98).
   internal_status UNCHANGED -> stays "cancelled". Event 'case_resubmitted' created (:100-101)
   even though status never left cancelled.
4. After edit: router.push back to case page (useIntakeForm.ts:108). NO call to
   /cases/:id/resubmit anywhere in FE (grep resubmitCase( in *.tsx = 0; mutation
   useCaseDetails.ts:72-81 defined but never consumed).
5. DEAD STATE: stage=submitted + status=cancelled. Machine: cancelled is FINAL — only
   T3/T4_RESUBMIT transitions available (case-machine.ts:197-211). T5_ACCEPT only from
   triage_pending (:72). Admin cannot accept; user cannot trigger resubmit (no button, no auto).
   Case stuck forever unless someone calls POST /cases/:id/resubmit manually.

### B4. Veto -> resubmit
- T13_VETO: veto-case.usecase.ts:15-21 -> machine assigned/supporter_working -> cancelled with
  refundCredit (case-machine.ts:112-116,141-145). Guard isWithin48h (case-machine.ts:35-36).
  refundCredit -> walletService.refund VND (case-transition.service.ts:146-153). Stage 'rejected'
  (TARGET_STAGE, case-transition.service.ts:28).
- Resubmit after veto: /cases/:id/resubmit -> resubmitCaseUseCase default T3_RESUBMIT_AFTER_REJECT
  (resubmit-case.usecase.ts:9). T4_RESUBMIT_AFTER_VETO exists in machine (case-machine.ts:189-193,
  205-209, guard isOwner only, no hasCredit) but is NOT selectable via API — route never passes
  transition param (cases.controller.ts:537-550). Policy Q1b (phase-06:16,52: T4 free no hasCredit)
  is therefore unreachable. In practice veto->resubmit runs T3 (hasCredit), which passes only if
  credit balance >=1 OR lockedPrice===0. For vetoed cases credit was never consumed (consumption
  only at T11 output), so balance typically still >=1 -> passes.

### B5. Checkpoint / lifecycleUnit / docs on resubmit
- Rejected case keeps its v00/checkpoint (nothing deleted on T12).
- Edit adds a SECOND v00 (submit-intake.usecase.ts:51-61) with version_no 1 again — not a new
  version. No version increment on intake edit or resubmit.
- Docs recreated via createDocumentRecordsForUnit (insert-only, submit-intake.usecase.ts:64-74)
  -> duplicate DocumentRecord rows per edit (bug #12 mechanism).
- T3 upsertDoc would attach docs to latest version unit (case-transition.service.ts:88-116) but
  no data passed -> nothing happens.

### B6. Bug statuses (tasks/bugs/)
- bug-12-doc-count-mismatch.md:22 Status = **Backlog** (not resolved).
- bug-15-rework-flow-missing-requirements.md:24 Status = **Backlog** (not resolved).
- bug-18-stuck-flow-request-more-info.md:20 Status = **Backlog**, Priority Critical, blocks #7/#15/#17.
None marked done/partial.

### B7. D3 ("rejected -> data-only") vs today
- Today: POST /intake on rejected sets stage 'submitted' directly (submit-intake.usecase.ts:91-98),
  leaves status cancelled -> dead state (B3.5).
- New plan D3 (plan.md:32; phase-02-be-wiring-transitions.md:59-63): when internal_status==='cancelled'
  -> intake is DATA-ONLY (upsert v00 + docs via updateIntakeDataOnly, phase-02:86), no stage change;
  state handled by /resubmit (T3/T4). Also dispatch by internal_status not stage (R3), reject
  waiting_user -> 409 REVISION_REQUIRED (phase-02:64-67), and REMOVE requireCredits from submit-intake
  (phase-02:87, Q5/R11). Net: D3 removes the dead-state root cause. Requires FE to call /resubmit
  after editing rejected case (phase-04-fe-student-workspace.md:69 keeps stage==="rejected" branch).

## Key file:line index
- create-order.usecase.ts:123-152 (withdraw + purchase); :104-121 (DUAL_WRITE_PAYMENT -> paid payment)
- payment.repository.ts:188-228 (legacy verify->purchase, gate USE_ORDER_DOMAIN)
- case.repository.ts:521-573 (supporter-output balance check + consumption); :284-304 (dead resubmitCase)
- case-machine.ts:30-33 (hasCredit), 72-75 (T5), 136-140 (T11 guard+actions), 197-211 (T3/T4)
- case-transition.service.ts:120-144 (subtractCredit action), 146-153 (refundCredit), 198-200
- case.types.ts:77-90 (requireCredits)
- submit-intake.usecase.ts:22,51-61,91-98 (check / new v00 / rejected->submitted)
- resubmit-case.usecase.ts:6-36 (default T3, no data)
- cases.routes.ts:46-50, admin.routes.ts:29-30 (intake/veto/resubmit, accept/reject)
- useCaseDetails.ts:72-81 (resubmit mutation, unused); useIntakeForm.ts:94-96 (intake POST)
- page.tsx:130 (onOpenIntake rejected)
- CreditQuantityModal.tsx:34-52 (buy flow), upgrade-package.usecase.ts:10 (audit only)
- ai-engine.routes.ts:90-118 (team-fit creates case), save-team-fit.usecase.ts:83,110-111
- wallet.service.ts:22-69 deposit, 71-105 withdraw, 107-145 refund
- useAdminPayments.ts:26 -> POST /payments/:id/verify (unmounted -> 404); useMyPayments GET /payments/my (unmounted -> 404)

## Unresolved questions
1. USE_ORDER_DOMAIN / DUAL_WRITE_PAYMENT env current values in prod? Determines whether legacy
   payment-purchase path can fire.
2. Product intent for veto refund: refund VND only (current) vs also decrement credit (policy text)?
3. Is there a manual/support step that calls /resubmit for stuck cases today (phase-06
   fix-stuck-cases SQL only SELECTs)?
