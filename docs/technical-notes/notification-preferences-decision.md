# Architectural Decision: Notification Preferences (GA-08)

**Date:** 2026-08-28

## Context
Trong quá trình triển khai tính năng Quản lý cài đặt thông báo (GA-08), chúng ta cần giải quyết bài toán: Người dùng (Student, Supporter, Admin) được phép tuỳ chỉnh (bật/tắt) việc nhận thông báo qua những kênh nào (In-app, Email, Telegram) để vừa đảm bảo luồng thông tin công việc không bị đứt gãy, vừa không gây phiền nhiễu (spam).

## Decision
Thiết kế hệ thống áp dụng chiến lược phân quyền bật/tắt khác nhau cho từng kênh cụ thể:

1. **Kênh In-app (Thông báo trong ứng dụng): BẮT BUỘC (MANDATORY)**
   * Dưới backend: Fix cứng `return true`.
   * Trên UI: Không hiển thị công tắc tắt/mở.

2. **Kênh Email: TÙY CHỌN (OPTIONAL)**
   * Dưới backend: Phụ thuộc vào giá trị cột `email_enabled` trong Database.
   * Trên UI: Là công tắc duy nhất được hiển thị tại trang `/settings/notifications`.

3. **Kênh Telegram: LUÔN BẬT TỪ BACKEND (ALWAYS ON)**
   * Dưới backend: Fix cứng `return true`.
   * Trên UI: Không hiển thị công tắc.

## Rationale (Lý do ra quyết định)

* **Đối với In-app:** Quả chuông thông báo trong app là kênh giao tiếp cốt lõi (Core channel) để duy trì quy trình làm việc (duyệt hồ sơ, trạng thái thanh toán...). Nếu cho phép user tắt, họ có thể bỏ lỡ các cập nhật hệ trọng và làm gián đoạn luồng vận hành. Do đó, In-app phải là kênh không thể tắt.
* **Đối với Email:** Đây là kênh có nguy cơ gây "Notification Fatigue" (quá tải thông báo) và dễ bị đánh dấu spam. Do đó, hệ thống trao quyền cho user được phép tắt để giữ hòm thư sạch sẽ.
* **Đối với Telegram:**
  1. **Đặc thù đối tượng:** Kênh này chỉ được cấp cho Admin và Supporter để theo dõi vận hành nhanh (Student không có Telegram chat ID).
  2. **Tận dụng Native App:** Ứng dụng Telegram vốn dĩ đã có sẵn tính năng "Mute" (tắt thông báo) rất triệt để ở cấp độ ứng dụng / nhóm chat. Việc tốn công sức code thêm một nút Mute thừa thãi bên trong Web App là đi ngược lại nguyên tắc **KISS** (Keep It Simple, Stupid).
  3. **Hành vi người dùng:** Khi một Admin/Supporter muốn ngừng nhận tin nhắn Telegram, hành vi tự nhiên nhất của họ là mở app Telegram lên bấm Mute đoạn chat hoặc out khỏi nhóm. Nexus Platform không cần và không nên cố gắng lưu trữ hay quản lý trạng thái này trong Database.

## Consequences (Hệ quả kiến trúc)
Bản sửa lỗi v2 (Email-only) đã được áp dụng để phản ánh chính xác quyết định này:
* **Database & Validation:** Lược bỏ toàn bộ các cột dư thừa (`telegram_enabled`, `chat_messages`, `marketing_news`, `case_status_updates`...). Bảng `notification_preferences` trở nên cực kỳ tinh gọn với duy nhất cột `email_enabled`.
* **Business Logic (`preference-policy.ts`):** 
  ```typescript
  if (channel === "telegram") return true;
  if (channel === "in_app") return true;
  if (channel === "email") return preference.email_enabled;
  ```
* UI/UX được tối ưu với chế độ Auto-save cho công tắc Email duy nhất. Kỹ thuật này giúp hệ thống vừa đáp ứng đúng yêu cầu nghiệp vụ, vừa giảm triệt để technical debt ở phần Notifications.
