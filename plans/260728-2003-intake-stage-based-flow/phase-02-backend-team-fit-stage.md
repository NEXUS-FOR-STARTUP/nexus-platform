---
title: "Phase 02: Backend — Fix team-fit save to use correct stage"
phase: 2
risk: low
effort: 1h
dependencies: Phase 01
status: completed
---

## Goal

Change team-fit save to set `user_facing_stage: 'intake_pending'` instead of `'submitted'`. This is the core of the new flow: team-fit creates a pending case, not a submitted one.

## Changes

### 1. `apps/api/src/modules/ai-engine/http/ai-engine.routes.ts`

**Location:** Inline `createCaseAndReport` function, line 101.

**Change 1:** Set stage to `intake_pending`:
```typescript
// Before:
user_facing_stage: 'submitted',

// After:
user_facing_stage: 'intake_pending',
```

**Change 2:** Set `internal_status` to `'draft'` (already correct at line 102):
```typescript
internal_status: 'draft',   // already correct
```

**Change 3:** Keep `current_checkpoint: null` (no intake lifecycle unit yet — by design):
```typescript
current_checkpoint: null,    // stays null — intake not yet submitted
```

### 2. `apps/api/src/shared/infrastructure/tests/team-fit-save.test.ts` (if exists)

Update any assertion that checks `user_facing_stage === "submitted"` to expect `"intake_pending"`.

## Rationale

Team-fit is a free basic assessment. It should not jump to `submitted` — that stage means "intake complete, awaiting admin review." The new `intake_pending` correctly communicates "assessment done, upgrade to unlock intake."

## Success Criteria

- [ ] Team-fit save creates case with `user_facing_stage: "intake_pending"`
- [ ] `payment_status` is `"unpaid"` for paid packages
- [ ] `payment_status` is `"not_required"` for free packages (already correct)
- [ ] After save, user sees the case at `intake_pending` with payment CTA
- [ ] Existing team-fit-save test passes
