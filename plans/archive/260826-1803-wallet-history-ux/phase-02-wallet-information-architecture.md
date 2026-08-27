# Phase 2 — Wallet information architecture

## Context links

- `apps/web-1/app/dashboard/wallet/page.tsx`
- `apps/web-1/app/dashboard/wallet/_components/DepositHistory.tsx`
- `apps/web-1/app/dashboard/wallet/_components/WalletTransactionList.tsx`
- `apps/web-1/components/layout/_components/UserMenu.tsx`

## Overview

Replace two full competing history blocks with one primary ledger and one compact, persistent deposit-history entry.

## Target hierarchy

```text
Ví của tôi
├── Số dư ví
├── Nạp tiền qua chuyển khoản
├── Lịch sử nạp tiền
│   ├── attention item when pending/rejected/mismatch exists
│   ├── latest request summary
│   └── Xem tất cả lịch sử nạp tiền (always)
└── Hoạt động ví
```

## Requirements

- `Lịch sử nạp tiền` is never deleted or completely hidden.
- Default request area is compact; only actionable states receive emphasis.
- `Hoạt động ví` owns the primary paginated history list.
- Verified deposits appear once in the ledger; request detail remains reachable.
- No default tabs.
- No technical source IDs in primary rows.

## Implementation steps

1. Update page composition to pass request summary and activity list into separate visual regions.
2. Keep request detail navigation to `/dashboard/payment?pid=` or a shared detail path.
3. Add `Xem tất cả lịch sử nạp tiền` behavior using existing deposit query, with explicit loading/empty/error states.
4. Add a clear visual link from a verified activity row to its deposit detail when source metadata allows it.
5. Ensure creation invalidates both balance/activity and deposit-history queries.
6. Align UserMenu label with page title.

## Success criteria

- First viewport answers balance and pending-status questions.
- User can reach old proof records without relying on a pending badge.
- No verified deposit is presented as two balance changes.

## Risks

The current deposit query has a fixed limit while wallet history is paginated. If “all history” cannot be safely paginated with the current contract, label the control as a bounded recent history or add a separately approved API contract task; do not silently imply completeness.
