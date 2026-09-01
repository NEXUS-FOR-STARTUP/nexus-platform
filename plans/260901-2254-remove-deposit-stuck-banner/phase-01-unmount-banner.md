---
title: "Phase 1 — Unmount banner"
status: completed
plan: 260901-2254-remove-deposit-stuck-banner
---

# Phase 1 — Unmount banner

## Context Links

- [Plan overview — nghiệp vụ + kiến trúc](./plan.md)
- Archived origin banner: `plans/archive/260826-1803-wallet-history-ux/plan.md`
- `apps/web-1/app/dashboard/wallet/page.tsx` dòng 8, 36
- `apps/web-1/app/dashboard/wallet/_components/DepositHistory.tsx` — `DepositStuckBanner`
- Phase 3 cần `useMyDeposits` — **cấm xóa hook**

## Overview

- Priority: P1
- Effort: 30m
- Gỡ UI coi “mới mở QR” = “chờ xác minh”. Không đụng API.

## Nghiệp vụ phase này

Banner copy “Khoản nạp chưa vào ví / Đang chờ xác minh / Số dư chưa thay đổi” gán cho `newest` deposit `pending|rejected|amount_mismatch`.

Học viên vừa `POST /deposits` → redirect QR → back ví = banner. Họ chưa chuyển. Câu đúng: “tôi đã chuyển gì đâu mà xác minh?”

Hai đơn 50k rồi 60k: sort `created_at` desc lấy `[0]` → 60k che 50k.

Gỡ banner. Lối vào QR còn: vừa tạo thì đang ở payment page; nút Nạp tiền. Album ảnh = phase 3.

## Requirements

- Không `DepositStuckBanner`, không skeleton 96px, không error “Không tải được yêu cầu nạp đang chờ.”
- Header Nạp tiền + `WalletTopupModal` + heading “Lịch sử giao dịch” giữ (Tabs = phase 3).
- `useMyDeposits` / `WalletDeposit` / invalidate `["deposits"]` **giữ**.

## Architecture (trước → sau)

```
Trước: BalanceCard + Banner(GET /deposits) + Ledger(GET /wallet/history) + Modal
Sau:   BalanceCard + Ledger + Modal
```

`GET /deposits` tạm không gọi từ ví cho đến phase 3. Hook chết ngắn — chấp nhận, đừng xóa.

## Related Code Files

Modify: `apps/web-1/app/dashboard/wallet/page.tsx` — bỏ import `DepositStuckBanner`, bỏ dòng 36. `openTopup` giữ cho header.

Delete: `apps/web-1/app/dashboard/wallet/_components/DepositHistory.tsx`

Do not touch: `useWallet.ts`, `deposit-display.ts`, payment/**, API, admin.

## Implementation Steps

1. `page.tsx`: xóa import + JSX banner.
2. Xóa `DepositHistory.tsx` (export duy nhất `DepositStuckBanner`).
3. Grep `DepositStuckBanner` và `Khoản nạp chưa vào ví` trong `apps/web-1` = 0 (trừ journal/plan).
4. Visual: ví không vàng. Modal nạp mở. Ledger còn.

## Todo List

- [x] Unmount banner
- [x] Delete `DepositHistory.tsx`
- [x] Visual wallet + topup
- [x] Không đụng `useMyDeposits`

## Success Criteria

Vùng vàng giữa balance và “Lịch sử giao dịch” mất. `useWallet.ts` vẫn export `useMyDeposits`.

## Risk

Học viên pending không ảnh mất reminder. Đúng nghiệp vụ. Tạo nạp mới vẫn land payment page.

## Next Steps

Phase 3 Tabs cùng `page.tsx`. Phase 2 admin song song.
