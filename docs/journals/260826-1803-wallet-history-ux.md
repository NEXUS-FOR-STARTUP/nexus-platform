---
title: Wallet history UX decision
created: 2026-08-26
scope: UX/product
status: completed
plan: plans/archive/260826-1803-wallet-history-ux/
---

# Wallet history UX decision

## Context

Reviewed `/dashboard/wallet` as a user. The page stacks deposit requests and wallet ledger entries. Verified deposits appear in both, while pending deposits appear only in the request list.

## Decision

Use one primary `Hoạt động ví` list. Keep deposit requests as a conditional actionable area for pending/rejected/mismatch states. Do not use default tabs. Do not delete deposit history data.

## Rationale

Preserves bank-transfer proof and verification workflow without presenting a second competing ledger. Makes pending state visible and explains that balance has not changed. Reduces cognitive load for the balanced goal: quick top-up plus complete balance audit.

## Risk

`amount_mismatch` exists in backend workflow but has incomplete frontend recovery semantics. Resolve this product/state contract before implementation.

## Implementation & Verification

- **Status:** Completed (PR #23 / branch `feat/wallet-history-ux`, commit `41f2fc9`).
- **Key files updated:**
  - `apps/web-1/lib/deposit-display.ts`: Centralized `WALLET_COPY` and `getDepositDisplay` mapping.
  - `apps/web-1/app/dashboard/wallet/page.tsx`: Single primary `WalletTransactionList` ledger with `DepositStuckBanner`.
  - `apps/web-1/app/dashboard/wallet/_components/WalletRowDetailAction.tsx`: Action button to `/dashboard/payment?pid=` from ledger.
  - `apps/web-1/app/dashboard/wallet/_components/WalletTransactionTable.tsx` & `WalletTransactionCardList.tsx`: Desktop table + mobile card list with 44px min touch targets.
  - `apps/web-1/app/dashboard/payment/page.tsx` & `_components/ProofPreview.tsx`: Full-screen proof preview modal and proof upload flow.
  - `apps/web-1/components/layout/_components/UserMenu.tsx`: Updated route label to "Ví của tôi".
