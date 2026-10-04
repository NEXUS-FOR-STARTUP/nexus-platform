# Phase 4 — Responsive consistency and validation

## Context links

- `apps/web-1/app/dashboard/wallet/_components/WalletTransactionTable.tsx`
- `apps/web-1/app/dashboard/wallet/_components/WalletTransactionCardList.tsx`
- `apps/web-1/app/dashboard/wallet/_components/WalletTransactionFilters.tsx`
- `apps/web-1/app/dashboard/payment/page.tsx`

## Overview

Responsive web only. Desktop and mobile use different visual primitives where appropriate, but identical information priority, wording, state semantics and proof journey.

## Requirements

- Validate at 320px, 375px, 390px, tablet portrait and desktop.
- Desktop may use a four-column table: time, activity, amount, balance after.
- Mobile uses cards with status, time, description, signed amount and balance after.
- Filters must fit without horizontal overflow; remove fixed-width nowrap behavior where necessary.
- Negative amounts have the same semantic text/icon/color treatment in table and cards.
- Interactive targets are at least 44px; keyboard focus remains visible.
- Empty, loading and error states preserve layout and recovery action.
- Proof image preview works at narrow widths and large text settings.

## Implementation steps

1. Define shared row content so table/card cannot drift semantically.
2. Remove duplicated signed amount from description rendering.
3. Make filter controls full-width or wrap safely on narrow screens.
4. Align spacing, status badges and action labels across breakpoints.
5. Verify no critical status, amount or proof action is clipped.
6. Check reduced-motion behavior and focus order.
7. Run browser smoke scenarios on authenticated wallet surface.

## Validation scenarios

1. No requests and no ledger entries.
2. Pending without proof.
3. Pending with proof.
4. Verified deposit.
5. Rejected deposit.
6. Amount mismatch.
7. Multiple requests.
8. Long descriptions and large amounts.
9. Payment detail opened from both request history and activity.
10. Mobile viewport with filter and full-size proof preview.

## Success criteria

- User finds “Xem chi tiết” and proof consistently on desktop/mobile.
- No horizontal scroll at 320–375px.
- Same conceptual steps from wallet to proof on all layouts.
- Visual review confirms one primary activity list and persistent history access.
