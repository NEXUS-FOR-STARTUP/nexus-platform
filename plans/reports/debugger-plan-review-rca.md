# Debugger RCA — Plan Review: `260814-1030-workflow-engine-wiring-completion`

Date: 2026-08-14 | READ-ONLY. Author: debugging subagent.
Scope: reject→edit→resubmit cycle + plan audit vs root cause. Every verdict cites file:line.

---

## 1. Symptoms (reject → edit → resubmit cycle)

1. Admin rejects case → student edits intake → case **stuck forever** (dead state `submitted` + `cancelled`).
2. Resubmitted content **never updated** — `resubmitCase` repo (case.repository.ts:284-304) is dead code; T3/T4 `upsertDoc` no-op.
3. Veto → resubmit: T4 (free, no hasCredit) **unreachable** — route always fires T3.
4. Bug #12 (doc count mismatch), #15, #18 all `Status: Backlog`.

---

## 2. Causal chain (5 Whys)

**Symptom:** rejected case, student edits intake, case stuck; content never updated.

**Why 1 — why stuck after edit?**
`submit-intake.usecase.ts:91-98` sets `user_facing_stage="submitted"` but **leaves `internal_status="cancelled"`**. `cancelled` is a terminal machine state (case-machine.ts:197-211) where only T3/T4 can fire.

**Why 2 — why does /intake write stage but not status, and why is T3/T4 never fired?**
Intake use case bypasses the machine (direct `tx.case.update`), and the resubmit use case (`resubmit-case.usecase.ts`) is a **separate endpoint with no data and no FE caller**.

**Why 3 — why does resubmit carry no data and have no FE caller?**
`resubmitCaseUseCase` calls `executeTransition({transition,...})` with **no `data`** (resubmit-case.usecase.ts:22-27) → T3/T4 `upsertDoc` reads `data.files` (case-transition.service.ts:78) → no-op. On FE, `resubmitMutation` (useCaseDetails.ts:72-81) is defined but **no component calls it**; rejected-case UI offers only "Chỉnh sửa hồ sơ" → `/intake` (StatusGuidanceCard.tsx:209-218), never a "nộp lại" action.

**Why 4 — why is the intake/resubmit split not seen as a product-flow problem?**
The XState engine was retrofitted over pre-existing direct-write use cases. The machine models *state* transitions; the *content* edit (intake) and the *state* advance (resubmit) were never unified into one coherent user journey. There is no concept of "edit intake + resubmit" as a single product action.

**Why 5 — ROOT CAUSE**
The reject→resubmit product flow was **never specified end-to-end**. It lives split across three disconnected surfaces: intake endpoint (content-only stage write, bypasses machine), resubmit endpoint (state-only transition, no data), FE (edit button, no resubmit button). The machine *defines* T3/T4 correctly, but **no user-visible action ties content-edit + state-transition together**, and no FE control triggers it.

---

## 3. Root cause statement

> **Root cause:** The reject→resubmit cycle is broken at the **product-flow level**, not the "wiring" level. The machine already defines T3/T4 (resubmit from `cancelled`/`done`), but: (1) no FE control triggers `/resubmit`; (2) the resubmit use case passes no data so content never updates; (3) the intake edit path writes `user_facing_stage` directly, creating the dead `submitted`+`cancelled` hybrid.
>
> **Impact:** Every rejected/vetoed case is permanently stuck; resubmission content is silently discarded.
>
> **Evidence:** case-machine.ts:197-211 (T3/T4 from cancelled), resubmit-case.usecase.ts:22-27 (no data), cases.controller.ts:546 (no transition param → T4 unreachable), useCaseDetails.ts:72-81 (unused mutation), StatusGuidanceCard.tsx:209-218 (edit button, no resubmit), submit-intake.usecase.ts:91-98 (stage-only write).

---

## 4. Plan audit — claim → verdict → evidence

### A. D3 (rejected → data-only /intake) — does it un-stick? (mission 2a)

| Claim | Verdict | Evidence |
|---|---|---|
| D3 makes `/intake` data-only for `cancelled`, state via `/resubmit` | ✅ Correct split | phase-02:59-63 |
| D3 **un-sticks** the rejected case | ❌ **FAILS** | No phase adds a FE resubmit button. Phase-04 StatusGuidanceCard button list (phase-04:75-78) = T2/T16, T9, T15 — **no T3/T4**. `resubmitMutation` (useCaseDetails.ts:72-81) stays unconsumed. phase-04:69 comment "resubmit flow qua /resubmit" **assumes a flow that does not exist**. |

**Net:** after D3, student edits intake (data saved) but case stays `stage=rejected` + `status=cancelled` with **no button to resubmit**. The card keeps showing "Chỉnh sửa hồ sơ để nộp lại" → re-opens intake (data-only) → **infinite edit loop, never progresses**. Stuckness is not removed; the only visible "progress" today (stage flips to `submitted`) is also removed.

### B. Resubmit content never updated (bug #12 F15) (mission 2b)

| Claim | Verdict | Evidence |
|---|---|---|
| Plan fixes "resubmit không cập nhật content" | ⚠️ **Partial / indirect** | Content now updates via `/intake` data-only (updateIntakeDataOnly, phase-02:72-86). State via `/resubmit` T3/T4. This *does* fix #12's "content upsert" **IF** both endpoints are called in sequence — but no FE sequence exists (see A). |
| Any phase makes T3/T4 carry intake data into upsertDoc | ❌ **No** | `resubmit-case.usecase.ts` is **not touched** by any phase (absent from phase-02 Related Files + Todo). T3/T4 still pass no `data` → upsertDoc still no-op (case-transition.service.ts:78,87). |
| **Latent bug:** T2/T16 pass `files` into upsertDoc | ❌ **New defect** | phase-02:81 passes `data:{files:body.documents}` to T2/T16. But `upsertDoc` executor hardcodes `doc_type:'revision_document'`, `direction:'outbound'` (case-transition.service.ts:113-114). Combined with `updateIntakeDataOnly` (correct `intake_document`/`inbound`), this **double-writes intake files as revision_document/outbound** on the v00 unit. Researcher already flagged (researcher-be-wiring-gaps.md §1) — plan ignored. |

### C. triage_waiting solves #18 end-to-end? (mission 2c)

| Claim | Verdict | Evidence |
|---|---|---|
| Machine models admin triage request-info | ✅ Correct | phase-01:19-22 adds `triage_pending → triage_waiting` via T8. Machine currently only has T8 from `supporter_working` (case-machine.ts:126-130) — this IS bug #18's state root. |
| User T2 → triage_pending, admin sees case back in triage bucket | ✅ State part OK | phase-01:20 T2 from triage_waiting → triage_pending; phase-06:34 adds `triage_waiting` to triage bucket. |
| End-to-end: student can actually respond | ❌ **Hole** | (1) **`openRequestsForMoreInfo={null}` hardcoded** at page.tsx:127 — useCaseDetails exposes it (:94) but page never destructures it → the "here's what admin asked" alert (StatusGuidanceCard.tsx:44-63) is **dead**. Student sees stage `need_more_information` passive alert with **no request text**. (2) **Stage ambiguity:** admin triage T8 and supporter T8 both target stage `need_more_information` (TARGET_STAGE, case-transition.service.ts:23). Students get no `internal_status` (VERIFY-001, get-case-detail.usecase.ts:143-145), so distinguishing triage_waiting (respond via T2 intake) from waiting_user (respond via T9 revision) relies **solely** on allowed_transitions. Phase-04 says "giữ switch copy theo stage" + "render nút từ transitions" but never specifies how the `need_more_information` case (currently early-returns, StatusGuidanceCard.tsx:82-96, no button) will render a T2 button. Risk: student answers admin request via wrong path (T9 revision upload, still gated by submit-revision validStages :165-168) or sees no button. |

### D. Plan vs machine design contradictions (mission 2d)

| Claim | Verdict | Evidence |
|---|---|---|
| T2 from triage_waiting defined in that state | ✅ No contradiction | phase-01:20 defines T2 (guard isOwnerOrMember) in triage_waiting. |
| T2 guard vs isBeforeSubmission | ✅ OK | T2 has guard `isOwnerOrMember`, not `isBeforeSubmission` (case-machine.ts:67-71). |
| **T16 target stage regression** | ⚠️ **Semantic bug** | D3 dispatches `intake_ready → T16` (phase-02:77). But TARGET_STAGE[T16]='intake_pending' (case-transition.service.ts:31). Editing a READY draft **demotes stage to intake_pending**, losing the "ready" state. Unaddressed. |
| Transition count bookkeeping | ❌ Wrong | phase-01:57 "tổng transitions tăng 16 → 20"; actual = 23 edges (phase-07 test :312 asserts 23) → +5 edges = 28. Minor but sloppy. |

### E. Veto → resubmit (T4) (mission 2e)

| Claim | Verdict | Evidence |
|---|---|---|
| Plan handles T4 FE + route selection | ❌ **Not handled** | `resubmitCaseHandler` (cases.controller.ts:546) calls `resubmitCaseUseCase(userId, caseId)` with **no transition param** → always T3. No phase touches this handler. T4 (free, no hasCredit) is unreachable — verified veto after T11 credit-consume → balance 0 → T3 hasCredit fails (case-machine.ts:202, test :217-222) → **vetoed case stuck**. |

### F. Credit: requireCredits removal + T5 hasCredit (mission 2f)

| Claim | Verdict | Evidence |
|---|---|---|
| T5 hasCredit wired | ✅ Yes | accept-case.usecase.ts:18-23 → executeTransition T5; creditBalance computed for T5 (case-transition.service.ts:198-200); guard hasCredit (case-machine.ts:30-33). |
| Removing requireCredits breaks free-package flow | ❌ **Opposite** | requireCredits (case.types.ts:77-90) has **no lockedPrice=0 bypass** → today free cases 402 on intake. Removing it + T5 hasCredit (lockedPrice=0 → true) actually **fixes** free flow. Plan rationale is correct; its comment "credit đã mua lúc tạo case" (phase-02:87) is false (credit bought AFTER creation, researcher A2) — cosmetic. |
| Double-subtract risk after phase-02 | ✅ Resolved | phase-02 drops repo consume (case.repository.ts:563-573) + stage write (:542-548) + credit check (:521-528); machine `subtractCredit` becomes single source. Idempotency key `consume-{unitCode}-{caseId}` matches via buildVersionUnitCode (R7). P2002→409 (R8) closes double-submit. |

---

## 5. Verdict

**The plan's problem statement is PARTIALLY WRONG.**

The real problem is **not "finish wiring T2/T16/T11/T8 + FE render from allowed_transitions."** Those are real sub-problems, but they are *secondary*. The **primary** product failure is:

> **The reject→edit→resubmit cycle is product-broken — there is no user-visible "nộp lại" (resubmit) action that ties content-edit + state-transition together.** The machine already defines T3/T4, but no FE control triggers them, and no endpoint carries the data.

The plan treats the resubmit loop as a "documented exception" (plan.md:80, D3) and **assumes** a resubmit flow exists — it does not. This is the exact class of error `core-problem-identification` warns against: the plan converges on "wiring" (the first plausible frame) without verifying the product loop is closed.

### What the plan gets RIGHT (real sub-problems solved)

1. **D5** — upsert v00 + `upsertDocumentRecordsForUnit` genuinely reduces bug #12's duplicate-v00 root (case.repository.ts:195-205 vs submit-intake.usecase.ts:51-61).
2. **D3 dispatch by internal_status not stage** — correct; fixes the stage-based dispatch INVALID_TRANSITION contradiction.
3. **R2 transitionInTx** — correct (Prisma TransactionClient has no `$transaction`).
4. **R8 P2002→409** — correct, closes bug #2.
5. **R4 wire T9 on `/revisions/upload`** — correct; that path (submit-revision.usecase.ts:129-213) genuinely bypasses the machine today.
6. **R9 actor-aware filterTransitions** — correct; raw `getAvailableTransitions` includes role-restricted transitions.
7. **triage_waiting state** — correctly models admin triage request-info (bug #18's *state* root).
8. **T11 wiring + credit single-source** — correct, matches intended design; no double-subtract.
9. **requireCredits removal** — correct and actually fixes the free-package 402.

### What the plan gets WRONG or MISSES (evidence above)

1. ❌ **No FE resubmit button (T3/T4)** anywhere — D3 un-sticks nothing; rejected case stays stuck (A).
2. ❌ **T4 (veto resubmit) unreachable** — route/use case untouched (E).
3. ❌ **T2/T16 upsertDoc writes wrong doc_type** (`revision_document`/`outbound`) → double-write intake files (B).
4. ❌ **`openRequestsForMoreInfo={null}` hardcoded** — student never sees the actual request (bug #18 FE half) (C).
5. ❌ **triage_waiting vs waiting_user stage ambiguity** unresolved in FE card logic (C).
6. ⚠️ **T16 demotes intake_ready → intake_pending** (D).

---

## 6. Corrected scope suggestions (scope-level only — no code)

1. **Design the resubmit action as a product artifact (P0).** One user-visible "Nộp lại hồ sơ" action on the rejected card that: (a) persists intake content, (b) fires the correct transition (T3 vs T4 based on rejection origin: T12-reject vs T13-veto). Decide whether this is one combined endpoint or a FE sequence (edit-intake → resubmit). The split is the root cause — it must be closed.
2. **Wire the FE resubmit control.** Consume `resubmitMutation` (useCaseDetails.ts:72-81) in StatusGuidanceCard rejected branch; add a "Nộp lại" button distinct from "Chỉnh sửa hồ sơ". Add T4 selection (route param or separate veto-resubmit path) so vetoed-with-zero-credit cases can resubmit free.
3. **Make T2/T16 upsertDoc intake-aware** (or drop `files` from T2/T16 data and let `updateIntakeDataOnly` own doc writing). Resolve the double-write + wrong-doc_type before phase-02 ships.
4. **Thread `openRequestsForMoreInfo`** into page.tsx (currently `null` hardcoded) so the request text actually renders — required for #18 to be "done", not just the state half.
5. **Resolve the `need_more_information` dual-meaning** in FE: key the T2 (intake edit) vs T9 (revision upload) buttons off `allowed_transitions` (triage_waiting → T2; waiting_user → T9), not off stage.
6. **Fix T16 target stage** or dispatch: editing a ready draft must not demote it to `intake_pending`.
7. Reconcile transition-count bookkeeping (23 edges today, +5 = 28) in phase-01.

---

## 7. Unresolved questions

1. Product intent: is "edit intake + resubmit" one atomic action or a two-step journey? This decides whether the fix is a combined endpoint or a FE sequence.
2. Veto refund: refund VND only (current, case-transition.service.ts:146-153) — should credit balance also decrement? Determines whether vetoed cases can resubmit free (T4) or need re-buy.
3. Is there a manual/support step that calls `/resubmit` for stuck cases today (phase-06 fix-stuck-cases SQL only SELECTs)? If so, the "dead state" has a hidden recovery path that changes severity.
4. `done` state (T14 target) also carries T3/T4 resubmit — is "resubmit after completed" a real product flow, or accidental (machine `done` should be truly terminal)?
