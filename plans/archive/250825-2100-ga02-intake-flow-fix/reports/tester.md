# GA-02 Intake Flow Fix — QA Tester Report

**Agent:** Ga02Tester (QA Lead)
**Date:** 2026-08-25
**Branch:** `feat/ga02-intake-flow-fix`
**Repo:** /mnt/e/fpt/semester_7/exe101/product-workspace/nexus-platform

## Verdict: BLOCKED (full suite) — but GA-02 change itself is GREEN (no regressions)

The 28 full-suite failures are **pre-existing on this branch** (identical failure set reproduced with the GA-02 changes stashed out) and are **not caused by the GA-02 fix**. The new GA-02 suite `phase-09-intake-stuck-fix.test.ts` passes 7/7, and the GA-02 touched code introduces **zero new failures, zero new type errors**. Success bar ("100% tests pass, check-types clean") is NOT met because of pre-existing environment/regression failures unrelated to this change.

---

## 1. Commands Run

| # | Command | Dir | Exit | Duration |
|---|---------|-----|------|----------|
| 1 | `npm test` (full API suite) | apps/api | 1 | 20.33s |
| 2 | `npm test > /tmp/ga02-full-test.log` (captured, run A) | apps/api | 1 | 20.62s |
| 3 | `git stash push` GA-02 5 files → `npm test` (baseline, no GA-02) | apps/api | 1 | 22.05s |
| 4 | `git stash pop` + restore test file → `npm test > /tmp/ga02-full-test-2.log` (run B) | apps/api | 1 | 20.18s |
| 5 | `npx tsx --test src/shared/infrastructure/tests/phase-09-intake-stuck-fix.test.ts` | apps/api | **0** | 4.61s |
| 6 | `npm run check-types` (turbo: 5 pkgs in scope, 3 tasks executed) | repo root | **0** | 2m14.145s |

No staging, no commits, no `prisma migrate`/`db push`/`db reset`/DDL/DML executed. No schema change. DB untouched (failures that hit 127.0.0.1:5432 were connection-refused, no data written).

---

## 2. Results

### Full API suite (`cd apps/api && npm test`)

| Run | Tests | Pass | Fail | Cancelled | Skipped |
|-----|-------|------|------|-----------|---------|
| A (with GA-02) | 323 | 295 | 28 | 0 | 0 |
| B (with GA-02, re-run) | 323 | 295 | 28 | 0 | 0 |
| Baseline (GA-02 stashed out) | 316 | 288 | 28 | 0 | 0 |

- Full suite is **deterministic**: identical 28 failures in runs A and B (names + error codes match).
- **GA-02 new suite contributes exactly +7 tests, +7 passes, +0 fails** (323−316 = 7, 295−288 = 7, 28−28 = 0).
- Failure set **identical with and without the GA-02 change** → all 28 failures are pre-existing; none introduced or aggravated by this fix.

### Phase-09 intake fix suite (isolated)

```
✔ GA-02 path A/B — submit luôn hạ cánh "submitted" (0.837392ms)
✔ GA-02 path A/B — T2 khả dụng từ triage_pending (cả intake_pending lẫn intake_ready) (2.993993ms)
✔ GA-02 — cả intake_pending lẫn intake_ready là pre-submission stage (0.133364ms)
✔ GA-02 — T16 không thể là submit path (guard isBeforeSubmission chặn sau nộp) (0.477408ms)
✔ GA-02 — paid stamp giữ nguyên (T5 gate dựa vào nó) (0.149694ms)
✔ GA-02 verifyPayment — paid KHÔNG ghi user_facing_stage (1.139687ms)
✔ GA-02 createOrder — mua credit KHÔNG ghi user_facing_stage (14.817925ms)
ℹ tests 7 | pass 7 | fail 0
```
Matches implementer's claimed 7/7. Exit code 0.

### Type checks (`npm run check-types` from root)

```
Tasks: 3 successful, 3 total
Time: 2m14.145s
```
- `@repo/validation:check-types` → `tsc --noEmit` ✅
- `nexus-platform-web-1:check-types` → `next typegen && tsc --noEmit` ✅ (route types generated successfully)
- `nexus-platform-api:check-types` → `prisma generate` (v7.8.0, 583ms) + `tsc --noEmit` ✅
- **Clean. Exit 0. No type errors anywhere, including the 5 modified API/web files.**

---

## 3. The 28 Failures (all pre-existing, NOT GA-02)

### Category A — Real DB required, DB unreachable (`Can't reach database server at 127.0.0.1:5432`) — 7 tests
These tests exercise the real Prisma client against a live DB; no Postgres running in this environment. Per the assignment's DB-safety note, these are environment-dependent and were **not** mutated/fixed.

- `package list seeds defaults on empty db`
- `revision submit keeps attachment refs metadata-only` (api.test.ts:52)
- `revision submit - picks current checkpoint or latest version` (phase-01-boundaries.test.ts:214)
- `admin accept - idempotent no-op` (phase-02-lifecycle.test.ts:29)
- `uploads proof file through injected storage deps` (phase-05-cloudinary.test.ts:47)
- `listCasesUseCase - returns array` (phase-06-core-usecases.test.ts:601)
- `listDocumentTypesUseCase - filters by flow` (phase-06-core-usecases.test.ts:613)

Representative output:
```
PrismaClientKnownRequestError: Can't reach database server at 127.0.0.1:5432
    at jt.#transformRequestError (.../@prisma/client/src/runtime/core/engines/client/ClientEngine.ts:305:14)
    at async executeTransition (.../apps/api/src/services/case-transition.service.ts:304:7)
```

### Category B — Windows path embedded in test (`ERR_MODULE_NOT_FOUND`) — 1 test
```
✖ backfill script helpers produce deterministic ids and quarantine empty urls
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
'/mnt/.../apps/api/E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/api/src/modules/documents/infrastructure/persistence/document.repository.ts'
```
Hardcoded Windows drive path (`E:/FPT/...`) inside the test breaks module resolution on WSL. Test-file bug, pre-existing.

### Category C — Assertion mismatches on error codes / error types — 14 tests
Drift between what usecases now throw and what legacy tests expect:

- `submitRevisionUseCase - pkg_tf_audit throws FEATURE_DEPRECATED` — `assert.ok(err instanceof AppError)` falsy (test expects AppError, got non-AppError)
- `submitRevisionUseCase - old package passes guard (triggers next check)` — same
- `submitRevisionUseCase - empty string package_id passes guard` — same
- `submitRevisionUploadUseCase - pkg_tf_audit throws FEATURE_DEPRECATED` — `'VALIDATION_ERROR'` vs expected `'FEATURE_DEPRECATED'`
- `revision submit - final stage guard` (phase-04-packages.test.ts:161) — `'VALIDATION_ERROR'` vs expected `'INVALID_CASE_STAGE'`
- `rejects proof file over limit` (phase-05-cloudinary.test.ts:39) — `'INVALID_FILE_TYPE'` vs expected `'FILE_TOO_LARGE'`
- `deleteCaseUseCase - not found` / `updateCaseSettingsUseCase - not found` / `updateCaseStatusUseCase - not found` / `sendMessageUseCase - case not found` / `approveReportUseCase - not found` / `getCaseDocumentWorkspaceUseCase - not found` (phase-06-core-usecases.test.ts) — `assert.ok(err instanceof AppError)` falsy
- `payment proof upload cleans up on db failure` — actual `''` vs expected `'nexus-platform/payment-proofs/proof.pdf'` (repo-root path resolution under WSL)
- `cleans up Cloudinary asset when DB write fails` — actual `''` vs expected `'nexus-platform/payment-proofs/proof-2'`

### Category D — Parent suite groups (contain the above)
- `Phase 01 - Backend boundaries & contracts`, `Phase 02 - Case lifecycle & admin triage`, `Phase 04 - Packages & attachments`, `Phase 05 - Cloudinary uploads`, `Phase 06 - Core usecases`, `backend demo regression coverage` (node test runner marks a parent failed when any subtest fails).

**GA-02 relevance check:** none of the 22 unique failing tests import or exercise the 5 modified files (`submit-intake.usecase.ts`, `create-order.usecase.ts`, `payment.repository.ts`, `notification-templates.ts`, `StatusGuidanceCard.tsx`). The one exception to check — `backend demo regression coverage` (api.test.ts) — failed identically in the stashed baseline. Not caused by this change.

---

## 4. Performance Notes

- Full suite ≈ 20s (dominated by 2×6s fake-timer waits and 4–6s per DB-timeout test — each unreachable-DB test burns the Prisma connect timeout).
- Slowest single tests (run B): `admin accept - idempotent no-op` 6.13s, `Phase 04` group 18.3s, `Phase 06` group 19.5s, `submitRevisionUseCase - pkg_tf_audit` 4.6s. All DB-timeout-bound.
- No memory/resource issues observed. No flakiness: run A ≡ run B (same 28, same codes).

---

## 5. Working-Tree Integrity

`git status` after validation: exactly the 5 modified files + 3 untracked artifacts listed by the implementer. Stash restored via `git stash pop`; no leftover stash from this session (the visible `filter-branch` stash is a pre-existing repo artifact, untouched). No commits, no staging, no DB mutations.

---

## 6. Critical Issues & Recommendations

1. **[BLOCKING for success bar, NOT for this change]** 28 pre-existing failures. Success criterion "100% tests pass" cannot be met on this branch regardless of GA-02. Need a separate ticket to:
   - Start a local Postgres (or point `DATABASE_URL` at a running dev DB) for the 7 DB-dependent tests — note these are integration-level tests inside the unit suite; either mock Prisma in them or move them behind a DB-backed runner.
   - Fix the Windows path hardcoded in `api.test.ts` (`E:/FPT/...`) so `backfill script helpers` resolves on WSL.
   - Reconcile error-code drift: `FEATURE_DEPRECATED` vs `VALIDATION_ERROR` (deprecate-revision), `INVALID_CASE_STAGE` vs `VALIDATION_ERROR` (phase-04), `FILE_TOO_LARGE` vs `INVALID_FILE_TYPE` (phase-05) — either code or tests are stale.
   - Re-baseline the `instanceof AppError` "not found" assertions in phase-06 to whatever the usecases now throw.
2. **No GA-02 action items.** The fix is behaviorally sound: submit always lands `submitted` (T2), payment paths no longer write `user_facing_stage`, T16 remains edit-only, copy changes are text-only, and everything type-checks.

## 7. Next Steps

1. Ship GA-02 as-is (its suite 7/7 + check-types clean + zero regression deltas) OR gate on pre-existing failures being fixed first — decision for lead.
2. Create follow-up ticket for the 28 pre-existing failures (DB env, Windows path, error-code drift, phase-06 assertions).
3. Optional: tag DB-dependent tests so `npm test` can skip them in DB-less CI.

---

## Unresolved Questions

- Was `npm test` ever 100% green on `main`/`feat/verify-email`? If yes, which commit introduced the error-code drift (Categories B/C)? [Out of scope for GA-02; baseline on this branch already red.]
- Does the project's CI start a Postgres for `npm test`, or is the suite expected to run DB-less? Determines whether Category A is env misconfig or test-design debt.
- Full test log artifacts: `/tmp/ga02-full-test.log` (run A), `/tmp/ga02-full-test-2.log` (run B), `/tmp/ga02-baseline-test.log` (stashed baseline), `/tmp/ga02-phase09.log`, `/tmp/ga02-check-types.log`.
