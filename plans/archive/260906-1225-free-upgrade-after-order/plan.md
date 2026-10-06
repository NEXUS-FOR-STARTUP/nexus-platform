---
title: "FREE upgrade chỉ sau khi mua credit thành công"
description: "Case FREE thiếu ví không đổi package/banner. Upgrade pkg_tf_audit chỉ khi POST /orders trừ ví thành công. Sửa luôn toast đỏ thừa trên nhánh INSUFFICIENT_BALANCE."
status: completed
priority: P1
effort: 2h
branch: feat/buy-credit-qr-shortcut
tags: [bugfix, frontend, backend, api]
blockedBy: []
blocks: []
created: 2026-09-06
---

# FREE upgrade chỉ sau khi mua credit thành công

## Overview

Gói FREE: FE gọi `upgrade-package` **trước** `POST /orders`. Thiếu ví → order fail, package đã `pkg_tf_audit` + `payment_status: unpaid` → banner xanh dương “Mua credit đánh giá ngay” thành vàng “Hồ sơ chưa hoàn tất thanh toán”.

Sửa: BE resolve giá từ `pkg_tf_audit` khi case FREE; upgrade package **sau** `walletService.withdraw` trong `createOrder`. FE xóa pre-upgrade. Thiếu ví: case giữ FREE, banner giữ nguyên.

Plan QR `260905-2047-buy-credit-qr-shortcut` phase 01 ghi “pre-existing, không nới” = **đã biết bug, cố ý không sửa lúc làm QR**. Plan này sửa đúng bug đó.

## Cross-Plan Dependencies

QR shortcut `completed`. Chồng `CreditQuantityModal.tsx` (sửa tiếp) và lần đầu đụng `createOrderUseCase` (QR cấm sửa; plan này được phép).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [BE giá audit + upgrade sau trừ ví](./phase-01-be-upgrade-after-paid.md) | Completed |
| 2 | [FE bỏ pre-upgrade + return thiếu ví](./phase-02-fe-drop-pre-upgrade.md) | Completed |

## Dependencies

- `createOrderUseCase` / `resolveCreditAuditPrice`
- `CreditQuantityModal` + `useShortageDepositRedirect` (QR)
- `isCaseFree` — `pkg_tf_free` **hoặc** `locked_price === 0`
- File < 200 dòng; cấm `prisma migrate` / `db push` / `migrate reset`
- Không xóa `POST /cases/:id/upgrade-package`. Không đổi SePay / verifyDeposit.

Cook: `/ck:cook D:/AShiroru/ProgramCode/Project/Team/Nexus/nexus-platform/plans/260906-1225-free-upgrade-after-order/plan.md`
