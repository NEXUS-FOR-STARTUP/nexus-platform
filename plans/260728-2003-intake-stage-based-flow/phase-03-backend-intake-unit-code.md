---
title: "Phase 03: Backend — Fix intake unit_code + submit logic"
phase: 3
risk: medium
effort: 2h
dependencies: Phase 01
status: completed
---

## Goal

Fix `submitIntakeUseCase` bugs: wrong `unit_code` value, missing stage transition for `intake_ready → submitted`, and add payment verification trigger for `intake_pending → intake_ready`.

## Bug Fixes

### Bug #4: `unit_code` mismatch

**File:** `apps/api/src/modules/cases/application/submit-intake.usecase.ts`

**Line 56:** Change `unit_code: "intake"` to `unit_code: "v00"`:
```typescript
// Before:
unit_code: "intake",

// After:
unit_code: "v00",
```

This matches `findFirstIntakeUnit()` in `case.repository.ts` (line 338) which searches `unit_code: "v00"`.

### Backend: Add `intake_pending → intake_ready` transition on payment verify

**File:** `apps/api/src/modules/payments/infrastructure/persistence/payment.repository.ts`

**In `verifyPayment()` function (line 153-158):** After setting `payment_status`, check if current `user_facing_stage` is `intake_pending` and transition to `intake_ready`:

```typescript
// After line 158 (payment_status update)
if (status === "paid") {
  // Fetch current user_facing_stage
  const caseRecord = await tx.case.findUnique({
    where: { id: caseId },
    select: { user_facing_stage: true },
  });

  if (caseRecord?.user_facing_stage === "intake_pending") {
    await tx.case.update({
      where: { id: caseId },
      data: { user_facing_stage: "intake_ready" },
    });
  }
}
```

### Backend: Update `submitIntakeUseCase` to handle `intake_ready → submitted`

**File:** `apps/api/src/modules/cases/application/submit-intake.usecase.ts`

**In the transaction (line 78-86):** The case update already sets `user_facing_stage: 'submitted'`. This is correct for transitioning from `intake_ready`. Ensure the symflow `applyTransition` call works:

```typescript
// Line 78 — already correct, applies submit_intake transition
applyTransition(caseRecord, 'submit_intake');

// Line 83 — this sets the user_facing_stage
user_facing_stage: 'submitted',
```

No change needed here for the stage transition logic — it already works. The key fix is:
1. `unit_code` mismatch (Bug #4)
2. Payment verification triggers `intake_pending → intake_ready`

### Additional: Handle case when submitting from `intake_ready` (first intake submit)

The `findOrCreateCheckpoint` logic (lines 30-49) handles this: if `caseRecord.current_checkpoint` is null (because team-fit save set it to null), it creates CP1 checkpoint. This is correct.

## Success Criteria

- [ ] Intake submit creates lifecycle unit with `unit_code: "v00"`
- [ ] `findFirstIntakeUnit("v00")` finds the submitted intake data
- [ ] Payment verified on an `intake_pending` case transitions it to `intake_ready`
- [ ] Payment verified on a `submitted` case (existing) does NOT change stage
- [ ] Intake submit on `intake_ready` transitions to `submitted`
- [ ] TypeScript compiles without errors
