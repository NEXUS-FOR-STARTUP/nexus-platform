# Phase 6: Email, cấu hình, loại thông báo

## Context Links
- [plan.md](./plan.md)
- `apps/api/src/modules/notifications/infrastructure/email.service.ts:16,58,78`
- `packages/validation/src/index.ts:652-662` (`NOTIFICATION_TYPES`)
- `.env.example`

## Overview
- Priority: P2
- Status: Pending
- Email dùng host cứng `https://nexusforstartup.site`; test local mở trang prod nơi mã không tồn tại.
- `.env` local có `RESEND_API_KEY` thật: mua thử sẽ gửi mail thật.

## Key Insights
- Không có `APP_URL` env ở đâu trong API (theo scout).
- Không có RESEND key thì `emailService` tự tắt và đánh dấu sent (không crash).
- `NOTIFICATION_TYPES` thiếu `discount.granted`, cũng thiếu `order.paid`, `order.refunded`, `wallet.balance_changed`; ép kiểu bằng `as` nên chạy được nhưng sai kiểu.
- Quy tắc repo: một `.env` gốc, giá trị cấu hình có mặc định và có tài liệu.

## Requirements
- Base URL link email đọc từ env, mặc định giữ giá trị prod hiện tại.
- Thêm `discount.granted` vào `NOTIFICATION_TYPES`.
- `.env.example` ghi `APP_BASE_URL` và `FIRST_PURCHASE_DISCOUNT_PERCENT` (1–99, mặc định 40).

## Architecture
`env.ts` thêm `APP_BASE_URL` (url, default prod). `email.service.ts` dùng nó ở 2 chỗ.

## Related Code Files
Modify: `apps/api/src/env.ts`, `email.service.ts`, `packages/validation/src/index.ts`, `.env.example`, `docs/` (hướng dẫn env/deploy nếu có mục tương ứng).

## Implementation Steps
1. Thêm `APP_BASE_URL` vào `env.ts` kèm validate.
2. Thay hardcode ở `email.service.ts`.
3. Thêm type vào `NOTIFICATION_TYPES`; build validation.
4. Cập nhật `.env.example` và tài liệu.
5. Test nhỏ: link email dùng base URL từ env (nếu có test hạ tầng sẵn).
6. Typecheck api.

## Todo List
- [ ] env + email.service
- [ ] NOTIFICATION_TYPES
- [ ] .env.example + docs
- [ ] Typecheck

## Success Criteria
Đặt `APP_BASE_URL=http://localhost:3001` → link email trỏ localhost. Không đặt → như cũ.

## Risk Assessment
Thấp. Mặc định giữ nguyên hành vi prod.

## Security Considerations
Base URL phải là URL hợp lệ (validate); không lấy từ input người dùng. Không in Resend key vào log.

## Next Steps
Phase 7 gửi mail thử tới địa chỉ test.
