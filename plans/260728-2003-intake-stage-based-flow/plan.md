---
title: "Intake Stage-Based Flow (Option B)"
description: "Redesign intake/team-fit/paid relationship using explicit stage-based rendering via user_facing_stage"
status: completed
priority: P1
effort: 16h
branch: main
tags: [backend, frontend, intake, stage-based, payment-gate, bugfix]
created: 2026-07-28
---

# Intake Stage-Based Flow (Option B)

## Summary

Replace flag-based intake gating with explicit `user_facing_stage` values. Team-fit save creates cases at `intake_pending`. Payment transitions to `intake_ready`. Intake submission transitions to `submitted`. Fix 5 known bugs discovered during prior investigation.

## Stage Model

| Stage | When | Tabs Visible | Key UX |
|-------|------|-------------|--------|
| `intake_pending` | Team-fit saved, unpaid | overview + settings | Show team-fit report. "Mua kiểm tra chuyên sâu" CTA. UnpaidAlertBanner. |
| `intake_ready` | Payment verified, intake needed | overview + documents + settings | Intake form prompt. Documents tab shows placeholder until intake done. |
| `submitted` | Intake submitted | All 6 tabs | Full workspace (existing behavior). |

## Known Bugs Fixed

1. `canIntake` uses `"intake"` → `"submit_intake"` mismatch
2. IntakeFormModal + useIntakeForm call `apiClient.patch()` but no PATCH route exists
3. Team-fit save creates case with `current_checkpoint: null`, no intake lifecycle unit
4. `submitIntakeUseCase` creates `unit_code: "intake"` but `findFirstIntakeUnit` searches `"v00"`
5. `CaseOverviewPanel` reads `caseData.intake_snapshot` instead of `intakeSnapshot` prop

## Architecture

```mermaid
flowchart LR
  TF[Team-Fit Save] --> IP[intake_pending]
  IP -->|Payment Verified| IR[intake_ready]
  IR -->|Intake Submitted| SUB[submitted]
  SUB -->|Existing Stages| REST[...]

  style IP fill:#f9f,stroke:#333
  style IR fill:#bbf,stroke:#333
  style SUB fill:#bfb,stroke:#333
```

## File Map

### Backend (7 files)
| File | Change |
|------|--------|
| `apps/api/src/modules/cases/domain/case.types.ts` | Add `intake_pending`, `intake_ready` to VALID_CASE_STAGES + helpers |
| `apps/api/src/modules/ai-engine/http/ai-engine.routes.ts` | Change `user_facing_stage` from `'submitted'` to `'intake_pending'` |
| `apps/api/src/modules/cases/application/submit-intake.usecase.ts` | Fix `unit_code: "intake"` → `"v00"`, transition `intake_ready` → `submitted` |
| `apps/api/src/modules/payments/infrastructure/persistence/payment.repository.ts` | On verify pay → transition `intake_pending` → `intake_ready` |
| `apps/api/src/modules/cases/domain/case-workflow.ts` | Add `intake_pending`, `intake_ready` places + transitions |
| `apps/api/src/modules/admin/application/get-admin-stats.usecase.ts` | Extend filter to exclude new stages |
| `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts` | Review write locations |

### Frontend (9 files)
| File | Change |
|------|--------|
| `apps/web-1/types/case.ts` | Add stages to type union + statusThemeMap |
| `apps/web-1/app/dashboard/case/[id]/page.tsx` | Replace `canIntake` flag with stage switch. Gate tabs. Pass `intakeSnapshot` to CaseOverviewPanel. |
| `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceSidebar.tsx` | Accept `stage` prop, hide tabs per stage |
| `apps/web-1/app/dashboard/case/[id]/_components/CaseStatusHeader.tsx` | Add ping-dot logic for new stages |
| `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx` | Add `intake_pending` + `intake_ready` guidance |
| `apps/web-1/app/dashboard/case/[id]/_components/IntakeFormModal.tsx` | Fix `patch` → `post('/cases/${caseId}/intake')` |
| `apps/web-1/app/dashboard/case/[id]/_components/CaseOverviewPanel.tsx` | Use `intakeSnapshot` prop instead of `caseData.intake_snapshot` |
| `apps/web-1/app/dashboard/intake/hooks/useIntakeForm.ts` | Fix UPDATE mode `patch` → `post('/cases/${caseId}/intake')` |
| `apps/web-1/app/dashboard/team-fit/page.tsx` | After save → redirect to `/dashboard/case/${caseId}` |

## Phase Order

| # | Phase | Risk | Est. | Depends On |
|---|-------|------|------|------------|
| 01 | Backend: Add new stages to domain types | Low | 1h | None |
| 02 | Backend: Fix team-fit save stage | Low | 1h | Phase 01 |
| 03 | Backend: Fix intake unit_code + submit | Med | 2h | Phase 01 |
| 04 | Frontend: Add stage types + theme map | Low | 0.5h | Phase 01 |
| 05 | Frontend: Stage-based case detail page | Med | 3h | Phase 03, 04 |
| 06 | Frontend: Stage guidance + intake flow | Low | 1.5h | Phase 05 |
| 07 | Backend: Admin awareness | Low | 1h | Phase 01 |

## Rollback Plan

1. Revert all changes via `git revert`
2. Existing cases with `intake_pending`/`intake_ready` stages get fallback rendering via default case in statusThemeMap/switch

## Unresolved Questions

- Should auto-verify (SePay webhook) also trigger `intake_pending` → `intake_ready` transition? Yes — payment.repository.ts handles both manual and auto paths.
- What about existing cases already at `submitted` with no intake data? They remain at `submitted` — backward compatible. The overview panel falls back to case root fields.
