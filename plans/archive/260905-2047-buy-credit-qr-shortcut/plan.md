---
title: "Rút click mua credit → QR; không auto-credit lúc rời phiên"
description: "Thiếu tiền từ hồ sơ nhảy thẳng QR. Tự mua lượt chỉ khi còn trang QR + sessionStorage. Rời QR/vào ví chỉ cộng VND. BE production không đổi."
status: completed
priority: P1
effort: 4h
branch: feat/buy-credit-qr-shortcut
tags: [feature, frontend, backend, api]
blockedBy: []
blocks: []
created: 2026-09-05
---

# Rút click mua credit → QR

## Overview

Học viên bấm Mua credit từ hồ sơ, thiếu ví: bỏ trang ví + nút Tạo mã nạp, mở QR luôn. Còn trang QR và intent `sessionStorage` thì SePay/admin `verified` → FE gọi `POST /orders` cũ → về hồ sơ. Rời QR / vào Ví của tôi: xóa intent, chỉ cộng VND. Nạp từ ví không bao giờ tự mua lượt.

BE production (`sepay-webhook`, `verifyDeposit`, `createDeposit`, `createOrder`, Prisma) **không đổi hành vi**. Phase 3 khóa invariant bằng test: verified deposit không đụng `CreditLedger`.

## Cross-Plan Dependencies

Không. `260901-2254-remove-deposit-stuck-banner` đã `completed`. Không chồng file production.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Nghiệp vụ + blast radius](./phase-01-nghiep-vu-blast-radius.md) | Completed |
| 2 | [FE intent, QR, fulfill](./phase-02-fe-intent-qr.md) | Completed |
| 3 | [BE test invariant + flow doc](./phase-03-be-tests-flow-doc.md) | Completed |

## Dependencies

- `useCreateDeposit` (`apps/web-1/app/dashboard/wallet/hooks/useWallet.ts`)
- `POST /orders` → `createOrderUseCase`
- `useDepositDetail` poll 5s
- File < 200 dòng; không `apiClient` trong component mới — hook
- Cấm `prisma migrate` / `db push` / `migrate reset`

Cook: `/ck:cook D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/plans/260905-2047-buy-credit-qr-shortcut/plan.md`
