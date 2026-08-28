# GA-08: Tùy chỉnh nhận thông báo (Notification Preferences)

- **ID:** GA-08
- **Priority:** P1
- **Category:** Notification / UX
- **Status:** Done
- **Completion Date:** 2026-08-28
- **Báo cáo kế hoạch:** `plans/260828-1900-ga08-notification-preferences/plan.md`
- **Báo cáo hoàn thành:** `docs/journals/journal-2026-08-28-ga08-notification-preferences.md`
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`

---

## 1. Mô tả vấn đề
Hệ thống thông báo của Nexus Platform đã hỗ trợ 3 kênh (`in_app`, `email`, `telegram` được định nghĩa trong `notification.types.ts:5`). Tuy nhiên, hiện tại:
- Hệ thống gửi mặc định tất cả các kênh mà không cho phép người dùng tùy chỉnh.
- Chưa có bảng cơ sở dữ liệu để lưu cài đặt ưu tiên nhận thông báo theo từng loại sự kiện (thanh toán, đổi trạng thái case, tin nhắn chat mới, phân công supporter).
- Người dùng dễ gặp tình trạng quá tải thông báo (notification fatigue).

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Database Schema:**
   - Tạo model `NotificationPreference` liên kết với `User` (hoặc trường `preferences_json` trong `User`):
     - Bật/tắt theo kênh: `email_enabled`, `telegram_enabled`, `in_app_enabled`.
     - Bật/tắt theo nhóm sự kiện: `case_status_updates`, `chat_messages`, `payment_alerts`, `marketing_news`.
2. **Backend API:**
   - `GET /api/notifications/preferences`: Lấy danh sách cài đặt hiện tại của người dùng.
   - `PUT /api/notifications/preferences`: Cập nhật cài đặt.
   - Cập nhật UseCase gửi thông báo (`NotificationDispatcher` / `EmailService` / `TelegramService`) kiểm tra cài đặt của người dùng trước khi gửi.
3. **Frontend UI:**
   - Thêm tab "Cài đặt thông báo" tại `/dashboard/settings/notifications`.
   - Giao diện dạng Switch toggles cho từng kênh và từng nhóm loại thông báo.
