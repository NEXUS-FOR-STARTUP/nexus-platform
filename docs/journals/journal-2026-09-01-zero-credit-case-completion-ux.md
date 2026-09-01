# Zero-Credit Case Completion Blocked by UI Early Return

**Date**: 2026-09-01 11:00  
**Severity**: High  
**Component**: `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`  
**Status**: Resolved  

## What Happened

In the case workspace, a student who purchased 1 credit to have their graduation project reviewed had their credit deducted when the supporter submitted the evaluation report via `T11_SUBMIT_OUTPUT`. This dropped their `creditBalance` to 0 while the case transitioned to `user_facing_stage: "report_ready"`.

Inside `StatusGuidanceCard.tsx`, the logic for `report_ready` checked `if (!hasCredits)` and executed an early return. It rendered an aggressive red "Hết credit đánh giá" alert with a "Mua credit" button. This early return completely unmounted the success alert ("Báo cáo phản biện đã sẵn sàng") and hid the "Xác nhận hoàn thành" button (`T17_USER_CONFIRM_COMPLETE`). Students with zero credits were trapped: they could not close their case without buying another credit or waiting 7 days for the backend `auto-done-sweep.ts` cron.

## The Brutal Truth

This was an embarrassing, anti-user defect that felt like an extortionate paywall. A student pays for an evaluation, waits patiently, gets their finished feedback, and when they go to accept it and mark the project complete, the interface screams at them in red that they are out of credits and blocks the door.

Closing a completed case (`T17_USER_CONFIRM_COMPLETE`) costs zero credits. The backend state machine explicitly returned `T17` in `allowed_transitions`. Yet our frontend took it upon itself to hijack the entire screen state and hold the primary action hostage behind a payment prompt. It's infuriating because this bug was born out of sloppy "helpful warning" logic during an earlier card refactor, tested only with dev accounts seeded with dozens of dummy credits.

## Technical Details

- **Faulty Code**: `StatusGuidanceCard.tsx:304-328`
  ```tsx
  if (stage === "report_ready") {
    const isFree = isCaseFree(caseData);
    const hasCredits = isFree || (creditBalance ?? 0) > 0;
    const canConfirmComplete = hasTransition("T17_USER_CONFIRM_COMPLETE");

    if (!hasCredits) {
      return (
        <Alert variant="light" color="red" title="Hết credit đánh giá">
          ...
          <Button onClick={onOpenPayment}>Mua credit</Button>
        </Alert>
      );
    }
    // "Báo cáo phản biện đã sẵn sàng" and "Xác nhận hoàn thành" never rendered!
  ```
- **Backend Reality**: `case-machine.ts` allows `T17_USER_CONFIRM_COMPLETE` from `review_completed` to `completed` without ledger interaction. The API told the frontend the transition was valid.
- **Resolution**: Removed the early return in `StatusGuidanceCard.tsx`. Unified into a single green success `Alert` with `CheckCircle2`. "Xác nhận hoàn thành" is permanently accessible as the primary CTA (`canConfirmComplete && onConfirmComplete`). The zero-credit warning is demoted to a non-blocking secondary banner (`bg-danger-soft dark:bg-red-950/30 border border-danger/10 dark:border-red-800/40`) with an auxiliary "Mua credit" button explaining credits are only needed if submitting a subsequent revision round.
- **Verification**: Clean typecheck across workspace, 128 tests passing (`phase-09-intake-stuck-fix.test.ts`, workspace suites), clean Next.js production build, clean ESLint.

## What We Tried

1. **Stripping credit checks entirely from `report_ready`**: Rejected. Students who intend to request another review round need visibility into their balance before making revision plans.
2. **Stacking multiple alert cards**: Rejected. Renders two clashing full-width cards (green success vs. red warning), creating visual clutter and confusing visual hierarchy.
3. **Unified Alert with embedded inline warning (Implemented)**: Kept the primary card green and optimistic. The completion CTA remains dominant; the credit warning is an inline, contextual note that does not disrupt the primary flow.

## Root Cause Analysis

Conflating state machine transition gating with speculative future actions. The backend state machine (`XState v5`) is the authority on valid transitions. UI code must never short-circuit an entire view based on a resource counter unless *every* valid transition in that stage requires that resource. Here, future revisions cost credit, but case completion is free. Gating the whole stage blinded the UI to the primary exit path.

## Lessons Learned

1. **State machine transitions must dictate action affordances, not UI presumptions**: If `allowed_transitions` includes a transition, the user must be able to trigger it.
2. **Decouple primary completion from optional follow-ups**: Never let a warning about step $N+1$ (optional revision) block step $N$ (completing the current review).
3. **Test with exact unit balances**: Dev seed data with 50 credits masks edge cases. Always test the 1-credit purchase-to-completion golden path where balance reaches exactly zero upon delivery.

## Next Steps

- [x] Fix deployed in `StatusGuidanceCard.tsx` (Commit `2a773a0`).
- [ ] Audit `intake_pending` and `waiting_for_revision` stages in `StatusGuidanceCard.tsx` for similar premature early returns (Frontend team, Sprint 14).
- [ ] Add an automated E2E test verifying a student with 0 credits can execute `T17_USER_CONFIRM_COMPLETE` (QA team, by 2026-09-05).
