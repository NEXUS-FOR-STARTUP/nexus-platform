---
title: Wallet history UX brainstorm
status: agreed
created: 2026-08-26
scope: UX/product only
---

# Wallet history UX brainstorm

## Summary

Trang `/dashboard/wallet` đang hiển thị hai danh sách ngang hàng: `Lịch sử nạp tiền` và `Lịch sử giao dịch`. Đây không phải dữ liệu trùng hoàn toàn:

- Deposit request: ý định chuyển khoản, proof, transfer content, trạng thái xác minh.
- Wallet transaction: ledger bất biến ghi biến động số dư thực tế.

Khoản deposit đã xác minh xuất hiện ở cả hai nơi. Đây là nguồn gây nhầm lẫn chính, không phải lý do để xóa `Lịch sử nạp tiền`.

## User findings

- User muốn biết nhanh: số dư hiện tại, có khoản nạp nào cần xử lý, tiền gần đây thay đổi vì lý do gì.
- Pending deposit chưa tạo wallet transaction; nếu không giải thích, user có thể nghĩ tiền bị mất.
- Verified deposit có thời điểm tạo request và thời điểm cộng tiền khác nhau; hai list có thể hiển thị hai thời điểm.
- User cần deposit history khi phải tiếp tục chuyển khoản, upload proof, xem lý do từ chối hoặc đối soát ngân hàng.
- User cần wallet history để xem thanh toán dịch vụ, hoàn tiền, điều chỉnh và toàn bộ biến động số dư.

## Current UX risks

- Hai section cùng trọng lượng và cùng khái niệm “lịch sử”.
- “Ví của tôi”, “Thanh toán”, “Nạp tiền” không thống nhất.
- Nút “Nạp tiền” thực tế tạo yêu cầu chuyển khoản rồi chuyển sang QR/payment; không cộng tiền ngay.
- Pending không xuất hiện trong wallet ledger nhưng UI chưa nói rõ nguyên nhân.
- Bảng giao dịch nặng với user thông thường; số tiền có thể bị lặp giữa description và amount.
- Mobile có khác biệt màu số âm; filter fixed width/nowrap có nguy cơ tràn ở màn hình nhỏ.
- `amount_mismatch` là trạng thái nghiệp vụ thật nhưng frontend/admin/payment UI chưa thống nhất.

## Options

### A — Giữ hai section

Ít thay đổi nhưng giữ nguyên duplicate mental model và chiều dài trang. Không khuyến nghị.

### B — Timeline hợp nhất hoàn toàn

UX thống nhất nhất, nhưng cần mapping hai nguồn dữ liệu, status, timestamps và action recovery. Có rủi ro làm pending trông như balance movement. Có thể là hướng dài hạn, không phải bước đầu.

### C — Hoạt động ví chính + yêu cầu cần xử lý thu gọn

Chọn phương án này. Chỉ có một danh sách chính `Hoạt động ví`. Deposit pending/rejected nổi bật ở khu vực workflow khi user cần hành động. Verified deposit chỉ xuất hiện một lần trong activity ledger; detail vẫn mở được deposit request.

## Decision

Chọn C.

```text
Ví của tôi
├── Số dư ví
├── Nạp tiền qua chuyển khoản
├── Yêu cầu nạp tiền cần xử lý (chỉ hiện khi cần)
└── Hoạt động ví (danh sách chính duy nhất)
```

Không dùng tab ở màn hình mặc định. Tab che sự mơ hồ và khiến pending dễ bị bỏ sót; không giải quyết việc verified deposit xuất hiện theo hai mô hình.

## Language direction

- UserMenu: `Ví của tôi` thay cho `Thanh toán`.
- CTA: `Nạp tiền qua chuyển khoản`.
- Request section: `Yêu cầu nạp tiền`.
- Ledger section: `Hoạt động ví`.
- Pending: `Đang xác minh` + giải thích `Số dư chưa thay đổi`.
- Verified: `Đã cộng vào ví`.
- Rejected: `Chưa thể xác minh` + lý do + action recovery.

## Unresolved product constraint

Cần product/operations xác nhận quy trình xử lý `amount_mismatch`: trạng thái này tồn tại trong DB/webhook nhưng hiện proof upload, admin filter và payment status chưa thống nhất. UX plan phải coi đây là blocker cho flow recovery, không được hiển thị như một badge phụ rồi bỏ user ở dead end.
