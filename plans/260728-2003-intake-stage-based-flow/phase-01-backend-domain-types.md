---
title: "Phase 01: Backend — Add new stages to domain types"
phase: 1
risk: low
effort: 1h
dependencies: none
status: pending
---

## Goal

Add `intake_pending` and `intake_ready` to `VALID_CASE_STAGES`, update helper functions, and ensure all type checks recognize the new pre-submission stages.

## Changes

### 1. `apps/api/src/modules/cases/domain/case.types.ts`

**Add stages to `VALID_CASE_STAGES`:**
```typescript
export const VALID_CASE_STAGES = [
  "intake_pending",      // NEW — team-fit saved, unpaid
  "intake_ready",        // NEW — payment verified, intake form needed
  "submitted",
  "need_more_information",
  "under_review",
  "report_ready",
  "waiting_for_revision",
  "revision_submitted",
  "completed",
  "rejected",
  "closed",
] as const;
```

**Add `isPreSubmissionStage()` helper:**
```typescript
export function isPreSubmissionStage(stage?: string | null): boolean {
  return stage === "intake_pending" || stage === "intake_ready";
}
```

**Update `isFinalCaseStage()` — no change needed** (final stages unchanged).

**No change to `isValidStageTransition()`** — the new stages are not part of the existing symflow transition table. They are handled externally (payment webhook, intake submit).

### 2. `apps/api/src/modules/cases/domain/case-workflow.ts`

Add new places for workflow state machine (symflow). This enables `applyTransition` to work with the new stages.

New `internal_status` values (the symflow "places") map to existing draft/submitted flow:
```
intake_pending → draft (internal)
intake_ready   → draft (internal)
```

The external `user_facing_stage` drives UI; internal workflow stays at `draft` until intake submit.

**No changes needed** to case-workflow.ts. The new stages only affect `user_facing_stage`, not the symflow `internal_status`. The `submit_intake` transition already maps `draft → submitted` internally.

## Success Criteria

- [ ] `isValidCaseStage("intake_pending")` returns `true`
- [ ] `isValidCaseStage("intake_ready")` returns `true`
- [ ] `isPreSubmissionStage("intake_pending")` returns `true`
- [ ] `isPreSubmissionStage("intake_ready")` returns `true`
- [ ] `isPreSubmissionStage("submitted")` returns `false`
- [ ] TypeScript compiles without errors (`npm run check-types --workspace=apps/api`)
