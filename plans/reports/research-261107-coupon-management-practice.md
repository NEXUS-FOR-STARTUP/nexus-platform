# Research: coupon management — có triển khai không?

Ngày: 2026-11-07. Nguồn: 1 truy vấn tổng hợp (coupontools, opia, voucherify, passkit, geeksforgeeks system-design).

## Kết luận
Có. Hệ thống coupon thực tế luôn có 2 mặt quản lý:

| Mặt | Thực hành phổ biến | Nexus hiện có |
|---|---|---|
| Khách ("My coupons" / ví mã) | liệt kê mã còn hạn, trạng thái, nút dùng | **Mới thêm** `MyDiscountCodes` + `GET /orders/my-discount-codes` |
| Admin | tạo/tắt mã, giới hạn lượt, hạn dùng, số lượt đã dùng | Có sẵn (`/admin` discount codes), chỉ mã chung |
| Theo dõi | redemption count, mã duy nhất chống rò rỉ, audit log | `redeemed_count`, `DiscountRedemption`; chưa có dashboard |
| Hết hạn | ngày bắt đầu/kết thúc, tự gỡ khỏi ví, nhắc trước hạn | mã tự phát không hạn dùng (đã chọn); chưa nhắc |

## Chưa làm (YAGNI, chờ user chốt)
- Admin xem mã cá nhân (đang ẩn bằng `owner_user_id: null`): cần bộ lọc "mã tự phát" + thu hồi mã.
- Thống kê tỉ lệ dùng mã (mã phát / mã dùng) — số này cần cho KPI 20 đơn.
- Hạn dùng + nhắc hết hạn cho mã tự phát.
