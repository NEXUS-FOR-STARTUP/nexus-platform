# Phase 1 — Content and state contract

## Context links

- `reports/brainstorm-wallet-history.md`
- `apps/api/src/modules/deposits/domain/deposit.types.ts`
- `apps/api/src/modules/payments/application/sepay-webhook.usecase.ts`
- `apps/web-1/app/dashboard/wallet/_components/DepositHistory.tsx`

## Overview

Define user-facing meaning for deposit request states before changing layout. Avoid the ambiguous phrase `Yêu cầu nạp tiền cần kiểm tra`.

## Requirements

- Section name: `Lịch sử nạp tiền`.
- Description: `Xem trạng thái, mã chuyển khoản và ảnh chứng minh`.
- Ledger section: `Hoạt động ví`.
- CTA: `Nạp tiền qua chuyển khoản`.
- Menu route label: `Ví của tôi`.
- State text must include status and next action.
- `amount_mismatch` must have a confirmed recovery path; never render an action that cannot work.

## State map

| Backend state | User label | Required action |
|---|---|---|
| pending + no proof | Cần bổ sung chứng minh | Thêm ảnh chứng minh |
| pending + proof | Đang chờ xác minh | Xem ảnh; wait |
| amount_mismatch | Số tiền chưa khớp | Xem hướng xử lý |
| rejected | Cần xử lý lại | Xem lý do; gửi lại if permitted |
| verified | Đã cộng vào ví | Xem proof; xem hoạt động ví |

## Implementation steps

1. Inventory all existing status labels/actions in wallet and payment surfaces.
2. Define one shared display mapping; do not duplicate ad-hoc maps per component.
3. Define timestamp labels: request created, verified/credited time, bank credited time when available.
4. Define empty, loading and error copy for both request history and activity list.
5. Confirm whether mismatch accepts proof re-upload or requires support/admin resolution.
6. Record final copy in component-level constants/types.

## Success criteria

- User can distinguish request status from balance status without backend terms.
- Every non-final state has a valid next action or explicit waiting explanation.
- Copy is identical across desktop, mobile and payment detail.

## Risks

The current TypeScript status union and payment UI may not cover `amount_mismatch`. Do not hide the state; align contract or expose a safe detail/support path first.
