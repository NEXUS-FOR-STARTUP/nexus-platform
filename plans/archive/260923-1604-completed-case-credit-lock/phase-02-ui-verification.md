# Phase 2 — UI surface verification

## Context

- Parent: [plan.md](./plan.md)
- No frontend component-test framework exists. Verify changed behavior in existing Next.js workspace.

## Overview

Prove completion warning and completed-case CTA removal. API behavior is intentionally unchanged.

## Verification Steps

1. Start existing web runtime. With an owned `report_ready` case:
   - click `Xác nhận hoàn thành`; warning modal appears;
   - press Escape/cancel; observe no status change;
   - confirm; observe `completed` after refetch and modal closes.
2. Open Lượt đánh giá on completed case: balance/history remains; no buy button can open `CreditQuantityModal`.
3. Regression check owned non-completed case: buy CTA and existing modal still work.
4. Review keyboard flow: Enter/Space opens modal, Escape closes it, focus returns to trigger. Mantine owns focus trap.
5. Run `bun run check-types`.

## Acceptance Matrix

| Scenario | Expected |
|---|---|
| User clicks completion CTA | Warning modal, no request yet. |
| User cancels modal | Case stays `report_ready`; purchase UI unchanged. |
| User confirms completion | One complete request; modal closes; refreshed stage `completed`. |
| Completed credits tab | History visible; no buy CTA/modal path. |
| Non-completed case | Existing purchase UI unchanged. |

## Cleanup

- No API, database, or documentation updates.
- Create no temporary scripts.

## Todo

- [x] Verify warning modal behavior.
- [x] Verify completed credit panel.
- [x] Run type check.