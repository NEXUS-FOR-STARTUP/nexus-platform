# Phase 3 — Discount codes

## Context
- Research §Mã giảm giá: `../reports/research-2026-10-10-unified-service-payment.md`
- Order flow: `apps/api/src/modules/orders/application/create-order.usecase.ts`
- Admin: `apps/api/src/modules/admin/http/admin.routes.ts:53-62`; web `app/admin/page.tsx`, `_components/AdminPackagesSettings.tsx`, `hooks/useAdminPackages.ts`
- Web mua: `app/dashboard/payment/hooks/useCreateCreditOrder.ts:18-33`, `CreditQuantityModal.tsx`

## Overview
Priority P1 (cần cho chiến dịch tặng lượt). Phụ thuộc phase 2.

## Requirements
- Model `DiscountCode`: `id`, `code` unique (lưu in hoa, trim), `percent_off Int` (1-100, CHECK), `service_type_id` FK, `max_redemptions Int?` (null = không giới hạn), `redeemed_count Int @default(0)`, `expires_at DateTime?`, `is_active Boolean`, `created_by` FK User, timestamps.
- Model `DiscountRedemption`: `code_id`, `user_id`, `order_id` unique, `@@unique([code_id, user_id])`.
- `POST /orders` nhận `discount_code?: string`. Server: chuẩn hóa, tìm, kiểm active/hết hạn/đúng ServiceType của gói; tính `unit_price` sau giảm; `OrderItem.unit_price/amount` = giá sau giảm; `Order.metadata_json` = `{ list_price, discount_code, percent_off }`.
- Đổi mã trong cùng transaction:
  - `max_redemptions` null -> `update` tăng đếm vô điều kiện.
  - Có giới hạn -> `updateMany({ where: { id, redeemed_count: { lt: prisma.discountCode.fields.max_redemptions } }, data: { redeemed_count: { increment: 1 } } })`; 0 dòng -> 409 `DISCOUNT_EXHAUSTED`.
  - Insert `DiscountRedemption`; vi phạm unique -> 409 `DISCOUNT_ALREADY_USED`.
- Tổng 0đ: không gọi `walletService.withdraw`; order vẫn `paid`, vẫn grant lượt, vẫn phát `ORDER_PAID`.
- Lỗi mã trả 4xx rõ ràng, tiếng Việt; không lộ mã khác tồn tại hay không ngoài "mã không hợp lệ".
- Rate limit endpoint kiểm tra mã (chống dò mã) theo pattern rate limit sẵn có.
- Admin: `GET/POST /admin/discount-codes`, `PATCH /admin/discount-codes/:id` (bật/tắt, đổi max/hạn). Không xóa (giữ lịch sử).
- Web admin (desktop-only): bảng mã + form tạo. Web user: ô nhập mã trong `CreditQuantityModal`, hiện giá trước/sau.
- Zod schema dùng chung trong `packages/validation`.

## Steps
1. Schema + `migrate dev --create-only` (+ CHECK percent 1-100 trong SQL).
2. Repository + usecase áp mã trong `create-order`.
3. Admin routes + controller + zod.
4. Web admin + web user input (hook, không gọi `apiClient` trong component).
5. Tests: mã 100% -> order 0đ, ví không đổi, lượt +4; đóng case -> hoàn 0đ; max=1 dùng 2 lần (2 user) -> lần 2 409; max null dùng nhiều lần -> ok; cùng user 2 lần -> 409; hết hạn/inactive/sai ServiceType -> 4xx; 2 request song song max=1 -> đúng 1 thành công.

## Todo
- [ ] Schema
- [ ] Order integration
- [ ] Admin API
- [ ] Web admin + user
- [ ] Tests

## Success criteria
Tests trên pass. Smoke local: tạo mã 100% ở admin, user nhập mã, nhận 4 lượt CP2, ví không đổi.

## Risks
- Một người nhiều tài khoản: giới hạn bằng `max_redemptions` từng đợt phát.
- Hoàn tiền thật cho lượt tặng: chặn bởi phase 2 (giá 0) + test.

## Security
Admin-only (role check có sẵn). Mã không phân biệt hoa thường. Audit log tạo/sửa mã.
