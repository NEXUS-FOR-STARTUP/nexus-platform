---
title: Wallet history UX implementation plan
description: Simplify wallet history while preserving deposit proof access and responsive consistency
status: pending
priority: P1
effort: 2-3 days
scope: frontend UX, state mapping, responsive web
blockedBy: []
blocks: []
created: 2026-08-26
tags: [wallet, deposits, responsive, ux, proof]
---

# Wallet history UX implementation plan

## Overview

Refactor `/dashboard/wallet` so users have one primary balance-movement list while retaining an always-reachable `Lịch sử nạp tiền` entry point for deposit status, transfer content and proof images. This is responsive web work, not a native mobile app.

Do not delete deposit records, proof files, deposit detail route or verification workflow. Do not introduce default tabs. Verified deposits must not look like two credits; pending/rejected/mismatch requests must remain discoverable and actionable.

## Cross-Plan Dependencies

None detected. Existing UX brainstorm is scoped under this plan in `reports/brainstorm-wallet-history.md`.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | Content and state contract | Pending |
| 2 | Wallet information architecture | Pending |
| 3 | Deposit history and proof access | Pending |
| 4 | Responsive consistency and validation | Pending |

## Dependencies

- Existing APIs: `GET /wallet/balance`, `GET /wallet/history`, `GET /deposits`, `GET /deposits/:id`, `POST /payments/proof`.
- Existing routes: `/dashboard/wallet` and `/dashboard/payment?pid=`.
- Product decision required for recovery behavior of `amount_mismatch` before implementation.
- No database migration expected for the UX-only architecture; API changes require separate approval if current DTOs cannot express required state.

## Non-goals

- Native iOS/Android application.
- Replacing bank transfer with online checkout.
- Deleting or merging `deposits` and `wallet_transactions` tables.
- Changing admin verification policy.
- Rebuilding the entire dashboard navigation.

## Definition of done

- `Lịch sử nạp tiền` remains permanently reachable and clearly advertises proof/status access.
- `Hoạt động ví` is the only primary ledger list.
- A verified deposit appears once as a balance movement, with detail access back to its deposit/proof record.
- Pending, rejected and mismatch states show exact next action or explicit waiting state.
- Same labels, status semantics and proof journey at 320px, 375px, tablet and desktop.
- No horizontal overflow, duplicate amount text, inaccessible controls or color-only status.
- Existing wallet/deposit behavior remains intact outside the intended hierarchy/content changes.

## References

- `reports/brainstorm-wallet-history.md`
- `apps/web-1/app/dashboard/wallet/page.tsx`
- `apps/web-1/app/dashboard/wallet/_components/DepositHistory.tsx`
- `apps/web-1/app/dashboard/wallet/_components/WalletTransactionList.tsx`
- `apps/web-1/app/dashboard/payment/page.tsx`
