# Journal: Intake Stage-Based Flow (Option B)

**Date:** 2026-07-28

**Plan:** `plans/260728-2003-intake-stage-based-flow`

**Status:** Completed — all 7 phases shipped.

## What Changed

Replaced broken flag-based intake gating with explicit `user_facing_stage` values:

| Stage | Purpose |
|-------|---------|
| `intake_pending` | Team-fit saved, unpaid. Show report + payment CTA. |
| `intake_ready` | Payment verified, intake needed. Show form prompt. |
| `submitted` | Intake submitted. Full workspace unlocked. |

## Bugs Fixed (5)

1. `canIntake` used `"intake"` but route needed `"submit_intake"` — mismatch broke gate
2. IntakeFormModal + useIntakeForm called `apiClient.patch()` — no PATCH route existed
3. Team-fit save created case with `current_checkpoint: null`, no intake lifecycle unit
4. `submitIntakeUseCase` created `unit_code: "intake"` but lookup searched `"v00"`
5. `CaseOverviewPanel` read `caseData.intake_snapshot` instead of `intakeSnapshot` prop

## Impact

- 16 files touched (7 backend, 9 frontend)
- Team-fit → payment → intake → submission flow now works end-to-end
- Backward compatible: existing `submitted` cases unaffected
- Admin stats exclude pre-submission stages

## Files Changed

**Backend:** case.types.ts, ai-engine.routes.ts, submit-intake.usecase.ts, payment.repository.ts, case-workflow.ts, get-admin-stats.usecase.ts, case.repository.ts

**Frontend:** case.ts (types), case/[id]/page.tsx, WorkspaceSidebar.tsx, CaseStatusHeader.tsx, StatusGuidanceCard.tsx, IntakeFormModal.tsx, CaseOverviewPanel.tsx, useIntakeForm.ts, team-fit/page.tsx

## Unresolved

- None. Both auto-verify (SePay webhook) and manual verify paths handled in `payment.repository.ts`.
