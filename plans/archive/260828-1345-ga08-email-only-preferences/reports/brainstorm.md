---
title: "GA-08 v2 brainstorm: đập cột, email-only"
status: agreed
date: 2026-08-28
ticket: tasks/bugs/ga-08-notification-preferences.md
plan: plans/260828-1345-ga08-email-only-preferences/plan.md
---

# Brainstorm: GA-08 email-only

## Problem

GA-08 v1 over-build. Screenshot 7 cột. User tắt được in-app. Group case/payment giả lập cùng visual với kênh. `telegram_enabled` / `chat_messages` / `marketing_news` lưu nhưng không lọc send. Telegram thật = shared env (`TELEGRAM_ADMIN_CHAT_ID` / `TELEGRAM_SUPPORTER_CHAT_ID`), không per-user.

## Requirements (chốt)

- In-app luôn gửi. Không switch. Không cột.
- Không tắt theo loại sự kiện.
- Student: 1 switch "Nhận email".
- Bảng giữ. Xóa cột thừa. Còn `user_id` (id/PK), `email_enabled`, `created_at`, `updated_at`.
- Telegram ngoài scope GA-08. Bot + group env vẫn gửi. Không UI, không cột, không cúp kênh.

## Approaches

| | Ý | Kết |
|---|---|---|
| A | DROP TABLE, cột `users.email_notifications_enabled` | User từ chối: giữ bảng |
| B | Giữ bảng, DROP 6 cột, API `{ email_enabled }` | **Chọn** |
| C | Giữ 7 cột, chỉ giấu UI | Cột chết. Screenshot vẫn rác |
| D | Telegram switch shared / role | Ngoài scope GA-08 |

## Final

`notification_preferences`: 1–1 User. `user_id` PK (không uuid riêng). `email_enabled` default true.

Policy: `in_app` always true. `email` đọc flag. `telegram` giữ `return true`. Missing row = email on.

API giữ path. Bỏ `active_fields` / `reserved_fields`. PUT `{ email_enabled: true }` hợp lệ (v1 reject vì thiếu 6 field).

UI: student 1 switch + Lưu. Supporter xóa `/supporter/settings/notifications` + nav item. Admin không đụng.

## Risks

- `ALTER TABLE DROP COLUMN` = destructive. Chỉ local. Cook classify `DATABASE_URL` trước. Supabase → dừng.
- Migration cũ `20260828190000` có thể đã apply local (screenshot 2 row). Không sửa file cũ. Migration mới DROP 6 cột.
- Prod nếu chưa apply v1: deploy tạo 7 cột rồi DROP 6. Chấp nhận.
- PUT contract breaking: client cũ gửi 7 field → reject `.strict()`. Web-1 cùng PR.

## Success

- Prisma model 4 field.
- Student tắt email → không outbox email. In-app vẫn insert.
- Không còn switch in-app / group.
- Telegram listener/relay không đổi.

## Next

Plan `plans/260828-1345-ga08-email-only-preferences/`. Cook khi user gọi.
