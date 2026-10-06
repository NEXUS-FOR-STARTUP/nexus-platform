---
title: "Phase 3 — Student proof table tab"
status: completed
plan: 260901-2254-remove-deposit-stuck-banner
---

# Phase 3 — Student proof table tab

## Context Links

- [Plan overview](./plan.md)
- Phase 1: banner chết, `useMyDeposits` còn
- Mẫu table: `WalletTransactionTable.tsx`
- Không `proof_uploaded_at`. Ngày = `created_at`

## Overview

- Priority: P1
- Effort: 1.5h
- Tab 2 = bảng lần đã gửi ảnh. Không grid. Không query param mới. Không pagination.

## Nghiệp vụ

| Cột | Trả lời | Data |
|-----|---------|------|
| Ngày tạo | Lần nạp này khi nào | `created_at` |
| Số tiền | 50k hay 60k | `amount` |
| Ảnh minh chứng | Tấm nào | `Anchor` “Xem ảnh” → `proof_file_url` |
| Trạng thái | Giờ sao | pending Đã gửi ảnh; verified Đã vào ví; rejected Từ chối; amount_mismatch Sai số tiền |
| ⋮ | Một việc | **Xem chi tiết** → `/dashboard/payment?pid=` |

Menu **không** có “Xem ảnh” (trùng cột). Không Duyệt / Nạp lại. QR chưa ảnh = không hàng.

## Cắt so với bản cũ

- Không `?has_proof=1`. Student `GET /deposits` **luôn** `proof_file_url != null`. Banner chết → endpoint này chỉ phục vụ tab.
- Không `total` / Pagination. 20 dòng mới nhất.
- Không card mobile. Một `Table`.
- Không `WalletProofAlbum`.

## API

`DepositHistoryItem` + `proof_file_url`.

`findDepositsByUser` / `countDepositsByUser` (count có thể bỏ luôn nếu không trả total): `where: { user_id, proof_file_url: { not: null } }`.

Controller không thêm query. `useMyDeposits()` không thêm param.

## Files

Modify: dto, list-deposits, repository, `useWallet.ts` (`proof_file_url` trên type), `wallet/page.tsx` Tabs, proof-upload invalidate `["deposits"]`.

Create: `WalletProofTable.tsx`

Test: một case list — row URL null không ra. Gắn vào test deposits có sẵn nếu được; **không** bắt buộc file test thứ hai nếu list use case khó inject. Visual 50k+60k là đủ cho FE.

## Steps

1. Repo where not null. DTO URL.
2. Hook type thêm URL. Vẫn `GET /deposits`.
3. `WalletProofTable` 5 cột, ⋮ một item.
4. Tabs trên page. Default ledger.
5. Invalidate sau upload.
6. Visual.

## Todo

- [x] List chỉ có ảnh + `proof_file_url`
- [x] `WalletProofTable`
- [x] Tabs
- [x] Invalidate upload
- [x] Visual

## Success

Bảng hai hàng 50k/60k. QR trống không vào. ⋮ chỉ chi tiết. Không migrate.

## Risk

Đổi `GET /deposits` thành proof-only. Caller duy nhất sau phase 1 = tab này. Nếu sau cần list mọi QR → query param lúc đó, không làm sẵn.
