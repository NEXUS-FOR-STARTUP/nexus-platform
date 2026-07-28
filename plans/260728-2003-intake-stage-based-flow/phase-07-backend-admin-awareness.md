---
title: "Phase 07: Backend — Admin awareness for new stages"
phase: 7
risk: low
effort: 1h
dependencies: Phase 01
status: pending
---

## Goal

Update admin stats and case list to be aware of the new pre-submission stages. The `intake_pending` and `intake_ready` stages represent cases that haven't entered the review pipeline yet, so they should be excluded from certain stats.

## Changes

### 1. `apps/api/src/modules/admin/application/get-admin-stats.usecase.ts`

**Update the conversion rate filter (line 166-168):**

The current code:
```typescript
const nonIntakeCount = await prisma.case.count({
  where: { user_facing_stage: { not: "intake" } },
});
```

This filter was trying to exclude cases at `"intake"` stage (which doesn't exist). Now we have `intake_pending` and `intake_ready`. Fix to:
```typescript
const nonIntakeCount = await prisma.case.count({
  where: {
    user_facing_stage: {
      notIn: ["intake_pending", "intake_ready"],
    },
  },
});
```

**Better approach — exclude pre-submission stages from stats:**
```typescript
const submittedStages = await prisma.case.count({
  where: {
    user_facing_stage: {
      notIn: ["intake_pending", "intake_ready"],
    },
  },
});
```

**Update `casesByStage` in the response** — the new stages will automatically appear in the `groupBy` result (line 185-192). No change needed:
```typescript
// Stage groups automatically include intake_pending and intake_ready
const stageGroups = await prisma.case.groupBy({
  by: ["user_facing_stage"],
  _count: true,
});
```

This is actually desirable — admin can see how many cases are at each pre-submission stage.

### 2. `apps/api/src/modules/admin/application/list-cases.admin.usecase.ts` (if exists)

Review whether the admin case list filter needs updating. The new stages should show up in admin views naturally since they're valid `user_facing_stage` values. No change needed unless admin explicitly filters them out.

### 3. `apps/api/src/modules/cases/domain/case.types.ts` — Already handled in Phase 01

The `isPreSubmissionStage()` helper from Phase 01 can be used by admin logic if needed:
```typescript
// Example usage in admin filters:
where: {
  user_facing_stage: { notIn: ["intake_pending", "intake_ready"] },
}
```

## Success Criteria

- [ ] Admin stats conversion rate excludes pre-submission stages correctly
- [ ] `casesByStage` in admin stats includes `intake_pending` and `intake_ready` counts
- [ ] Admin case list renders correctly for cases at new stages
- [ ] No TypeScript errors
- [ ] No regression in existing admin functionality
