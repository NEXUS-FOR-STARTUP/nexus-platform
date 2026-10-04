# GA-02 Intake Stuck Fix — Reviewer Report

**Reviewer:** Ga02Reviewer (Staff Engineer, production-readiness review)
**Date:** 2026-08-25
**Branch:** `feat/ga02-intake-flow-fix`
**Verdict:** APPROVED_WITH_NITS

The fix is correct, complete, and exactly matches the approved decision doc. All three invariants hold for the touched paths. The single test-quality gap (B2 regression defense is vacuous) is a non-blocking MINOR. No blocking findings.

---

## 1. Scope & Evidence

Reviewed exactly the 6 scoped files (5 modified via `git diff`, 1 new test read directly), against the canonical decision doc and phase-01..04 + implementer/tester reports.

- `git status` confirms: 5 modified files + 1 untracked test + 2 untracked change-record artifacts (decision doc, plans/). No other files touched. No staging/commit.
- No schema/migration/Prisma CLI mutation anywhere in the diff. DB-safety constraint satisfied.
- Tester already independently proved 7/7 scoped green, `check-types` clean (exit 0 across 3 turbo tasks), and the 28 full-suite failures are pre-existing baseline (identical with GA-02 stashed). I did not re-run (per read-only mandate and to avoid re-deriving what the tester reported).

## 2. Diff vs Plan — exact match (5/5 edit points)

| # | File | Plan | Actual | Match |
|---|---|---|---|---|
| 1 | `create-order.usecase.ts` | Drop `user_facing_stage` from select + drop spread; keep `payment_status: "paid"` | select now `{ owner_auth_user_id, internal_status }`; `data: { payment_status: "paid" }` only; 0 `user_facing_stage` refs remain | ✅ |
| 2 | `payment.repository.ts` `verifyPayment` | Remove stage-push block (176–186); keep `payment_status` + credit branch | Block removed; `if (status === "paid")` goes straight to credit branch; `payment_status` write (158–163) intact | ✅ |
| 3 | `submit-intake.usecase.ts` | Replace ternary with `const transition = "T2_SUBMIT_INTAKE"` | Unconditional literal + GA-02 comment; `fromStage: caseRecord.user_facing_stage` (207/240) preserved as read-only event payload | ✅ |
| 4 | `StatusGuidanceCard.tsx` | 5 copy strings, zero logic | title/body/button of `intake_ready` + title/body of `intake_pending` non-free changed exactly; `isFree` branch, "Thanh toán ngay" CTA, `canOpenIntake`, `onOpenIntake`, `onOpenPayment`, icons/colors/variants untouched | ✅ |
| 4c | `notification-templates.ts` | 2 `STAGE_LABELS` entries | `intake_pending` → "Chờ nộp hồ sơ"; `intake_ready` → "Đã cập nhật hồ sơ"; all other labels unchanged | ✅ |

## 3. Invariant Verification

### Invariant 1 — single writer of `user_facing_stage` in touched paths: HOLDS
- `grep user_facing_stage apps/api/src/modules/orders` → **0 matches**.
- `payment.repository.ts` → **0 matches**.
- `submit-intake.usecase.ts` → only reads at lines 207/240 (`fromStage` event payload, not a write).
- No `user_facing_stage` write remains in any of the 3 touched API files. Only `transitionInTx` (`case-transition.service.ts:267`) writes stage on these paths.

### Invariant 2 — payment never drives stage: HOLDS
- `createOrderUseCase`: `tx.case.update` data is exactly `{ payment_status: "paid" }`. The only transition it invokes is `T19_REOPEN` (guarded by `internal_status === "done"`, not payment).
- `verifyPayment`: paid branch writes `payment_status` + credit ledger only; stage push removed.

### Invariant 3 — submit always `T2_SUBMIT_INTAKE`: HOLDS
- `transition = "T2_SUBMIT_INTAKE"` unconditional. No dead ternary branches, no unused imports (the old `"T16_EDIT_INTAKE"` was a string literal, not an imported symbol).
- Grep confirms `"T16_EDIT_INTAKE"` now has **zero production callers**: only the machine definition (`case-machine.ts:77`), enum/`TARGET_STAGE` (`transition.types.ts`), and test files. The FE `page.tsx:89` / `StatusGuidanceCard.tsx:66` occurrences are read-only transition-availability checks for button visibility, not dispatchers.

## 4. Regression / Edge-Case Hunt

- **create-order downstream of removed field:** `caseRecord` is now `{ owner_auth_user_id, internal_status }`, consumed only by (a) NOT_FOUND guard, (b) owner check, (c) `done → T19_REOPEN`. Nothing downstream reads `user_facing_stage` from this usecase. Clean.
- **T16 non-payment callers:** none. FE "edit intake" (`canEditIntake` → `/dashboard/intake?caseId=`) and "nộp hồ sơ" (`onOpenIntake`) both route to the same intake form → same `submitIntakeUseCase` endpoint → now always T2 → `submitted`. No separate draft/edit endpoint exists. The `intake_ready` self-heal path is confirmed: `T2_SUBMIT_INTAKE` guard is `isOwner` only (`case-machine.ts:68-72`), no payment guard, so a stuck `intake_ready` case lands `submitted` on re-submit.
- **Vietnamese copy naturalness:** all 7 new strings are natural, grammatically correct, and semantically consistent with the "nộp trước, thanh toán sau" model. No machine-translation artifacts.
- **Auth/authz:** unchanged — submit still owner-only (`submit-intake.usecase.ts:162-165`), order still owner-checked (`create-order.usecase.ts:162-164`), verify still admin-gated at controller. No surface widened.

## 5. Findings

### MINOR

**M1 — B2 test (createOrder) does not actually defend the "no `user_facing_stage` in payload" contract.**
- **File:** `apps/api/src/shared/infrastructure/tests/phase-09-intake-stuck-fix.test.ts:129`
- **Problem:** The fakeTx `case.findUnique` returns `{ owner_auth_user_id, internal_status }` — no `user_facing_stage`. If someone re-introduced the old spread (`...(caseRecord.user_facing_stage === "intake_pending" ? { user_facing_stage: "intake_ready" } : {})`), `caseRecord.user_facing_stage` would be `undefined`, the ternary would yield `{}`, and the assertion `assert.deepEqual(caseUpdateCalls[0].data, { payment_status: 'paid' })` would **still pass**. The test passes vacuously and would not catch the exact regression it exists to catch.
- **Contrast:** B1 (`verifyPayment`) is genuinely defensive — re-introducing the old block would call the missing `fakeTx.case.findUnique` (→ throws) and would invoke `case.update` twice (→ `caseUpdateCalls.length === 1` fails).
- **Suggested fix:** Make B2's `fakeTx.case.findUnique` return `{ owner_auth_user_id: 'user-1', internal_status: 'triage_pending', user_facing_stage: 'intake_pending' }`. The fixed code ignores the extra field (select no longer reads it), so the assertion still passes today; but a re-introduced spread would then emit `{ payment_status: 'paid', user_facing_stage: 'intake_ready' }` and fail the assertion. One-line change that turns a vacuous check into a real regression guard.
- **Impact:** Non-blocking — the production fix is independently proven correct (grep shows 0 `user_facing_stage` refs in the orders module, and B1 + machine tests cover the other invariants). This is a test-robustness gap, not a code defect.

### NIT

**N1 — Env mutation not restored across tests.**
`phase-09-intake-stuck-fix.test.ts:79` (`process.env.USE_ORDER_DOMAIN = 'true'`) and `:116` (`delete process.env.DUAL_WRITE_PAYMENT`) are set/deleted but never restored. Harmless today (no later test in this file reads them; `node:test` runs each file in a separate process), but a latent hygiene issue if tests are reordered or merged. Consider restoring in `finally`.

**N2 — Direct-assignment mocking of the shared `prisma` singleton is global mutable state.**
Correct and well-documented (comment at lines 35–37 explains the Prisma 7 Proxy `t.mock.method` failure), and safe under `node:test`'s sequential-within-file / process-per-file model. Fragile only if subtests ever opt into `{ concurrency: true }`. Acceptable as-is; no change required, just noted.

**N3 — Decision doc invariant "single writer = only `transitionInTx`" overstates codebase reality.**
Grep shows pre-existing direct `user_facing_stage` writers outside GA-02 scope: `case.repository.ts` (admin `updateCaseStatusUseCase` path + creation + others at lines 181/245/273/296/318/343/690), `report.repository.ts:97` (publishReport → "report_ready"), `ai-engine.routes.ts:101` (case create), and `assign-supporter.usecase.ts:88-91` (unassign — explicitly commented "documented exception"). These are pre-existing, non-payment, and out of scope, so they do not block GA-02; but the doc's blanket "mọi code ngoài machine cấm viết stage" is aspirational, not literal. GA-02's actual claim — payment paths and submit no longer write stage — is fully true.

**N4 — Out-of-scope "nghĩa A" copy remains elsewhere (informational, no action).**
`UnpaidAlertBanner.tsx:23` ("Bạn cần mua credit để kích hoạt quy trình phản biện…") and payment-status labels `payment/page.tsx:116` / `credit-history.types.ts:88` ("Chờ thanh toán") still use payment-centric wording. These describe the *payment record's* status and the *review process* (which genuinely does start only after payment), not stage guidance, so they do not contradict the new copy and are correctly left untouched per the 6-file scope.

## 6. Test-Quality Judgment on Implementer Deviations

| Deviation | Judgment |
|---|---|
| Direct assignment vs `t.mock.method` | **Legitimate.** Prisma 7's Proxy client makes `t.mock.method` throw `ERR_INVALID_ARG_VALUE`; the fallback was pre-anticipated in phase-03 Risk Assessment. Restore is correctly wrapped in `try/finally` (assertions run *after* restore, so a throwing usecase still restores then fails). |
| Static imports vs `await import(...)` | **No weakening.** ESM singleton semantics mean both the test and the usecase share the same `prisma` object; mutation is visible either way. Matches the project's no-dynamic-import rule. |
| `unknown` casts (`as unknown as …`) | **No weakening.** Satisfies the `ts-no-any` rule; casts are confined to the Prisma/wallet mock boundary. |
| B2 fakeTx omits `user_facing_stage` | **Weakens B2** (see M1). This is the one deviation that materially reduces the test's regression-detection power. |

## 7. Positive Observations

- Edit is surgically minimal: 11 insertions / 25 deletions across 5 files, no incidental refactors.
- Comment on the new literal (`GA-02: submit luôn T2_SUBMIT_INTAKE…`) documents the invariant at the point of decision.
- `fromStage` read preserved correctly — removing it would have broken the `CASE_STAGE_CHANGED` event payload.
- Clean select cleanup in `create-order` (removing a now-dead read) rather than leaving a dangling field.
- Test file self-documents the mocking rationale and keeps no bare `any`.

## 8. Recommended Actions (prioritized)

1. **(M1)** Add `user_facing_stage: 'intake_pending'` to B2's `fakeTx.case.findUnique` return so the no-stage-write assertion is non-vacuous. (Non-blocking; can be a follow-up.)
2. **(N1, optional)** Restore `USE_ORDER_DOMAIN`/`DUAL_WRITE_PAYMENT` env vars in `finally`.

## 9. Metrics

- Files in scope: 6 (5 modified + 1 new) — all reviewed.
- Diff size: +11 / −25 across 5 modified files.
- `user_facing_stage` references in `apps/api/src/modules/orders`: 0. In `payment.repository.ts`: 0.
- Production callers of `T16_EDIT_INTAKE`: 0.
- New tests: 7 (all pass per implementer + tester).

## 10. Unresolved Questions

None blocking. The 28 pre-existing full-suite failures (DB-env, Windows path, error-code drift) are outside GA-02 scope and independently confirmed by the tester as baseline-identical.
