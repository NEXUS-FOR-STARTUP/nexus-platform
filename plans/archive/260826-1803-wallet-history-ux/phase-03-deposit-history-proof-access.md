# Phase 3 — Deposit history and proof access

## Context links

- `apps/web-1/app/dashboard/wallet/_components/DepositHistory.tsx`
- `apps/web-1/app/dashboard/payment/page.tsx`
- `apps/web-1/app/dashboard/payment/hooks/usePayment.ts`
- `apps/api/src/modules/payments/http/payments.controller.ts`

## Overview

Make “check my proof” a direct, understandable task from every deposit-history state.

## Requirements

- Each request row has one obvious `Xem chi tiết` action.
- Detail shows amount, request time, transfer content, status, proof preview, rejection reason and next action where data exists.
- Proof image can be opened full-size and remains keyboard accessible.
- Pending with proof says user can wait; pending without proof offers upload.
- Verified detail must not auto-redirect before user can inspect proof; review existing five-second redirect behavior and replace with explicit back/action if needed.
- Rejected/mismatch must not dead-end.

## Implementation steps

1. Normalize request-row actions so labels describe the actual next step.
2. Add proof presence indicator: `Đã gửi ảnh chứng minh` or `Chưa có ảnh chứng minh`.
3. Ensure full-size proof preview has accessible label, close action and focus return.
4. Show status explanation beside proof, not only as a colored badge.
5. Preserve owner authorization and existing upload restrictions.
6. Handle missing/expired proof URL with an explanatory recovery message.
7. Ensure activity ledger detail links back to the request detail without duplicate credit language.

## Success criteria

- User reaches an old proof image in one list selection plus one detail action.
- User knows whether proof was submitted and whether the balance changed.
- All state actions either work or explain why they are unavailable.

## Security considerations

- Keep deposit ownership enforcement on detail and proof endpoints.
- Do not expose bank/proof URLs or source IDs to another user through client-side joins.
- Do not weaken upload validation or authorization while changing presentation.
