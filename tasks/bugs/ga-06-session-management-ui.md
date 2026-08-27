# GA-06: Giao diện quản lý phiên đăng nhập & thiết bị (Session Management UI)

- **ID:** GA-06
- **Priority:** P1
- **Category:** Security
- **Status:** Todo
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Tiêu chuẩn:** OWASP Session Management Cheat Sheet

---

## 1. Mô tả vấn đề
Bảng `sessions` trong cơ sở dữ liệu đã lưu trữ đầy đủ `ip_address`, `user_agent`, `created_at`, `expires_at` (`auth.ts:108-109`). Tuy nhiên, trên giao diện người dùng (`apps/web-1/app/dashboard/settings/`):
- Thanh điều hướng cài đặt (`settings-nav.ts:9-12`) chỉ có 2 mục: "Thông tin cơ bản" và "Đổi mật khẩu".
- Người dùng không có màn hình danh sách thiết bị đang đăng nhập, không thể nhận biết các phiên bất thường, và chỉ có một hàm `revokeOtherSessions` bị ẩn.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **API Endpoints (Better Auth client/server):**
   - Danh sách phiên: `authClient.listSessions()` hoặc endpoint `GET /api/auth/sessions`.
   - Thu hồi phiên cụ thể: `authClient.revokeSession({ token })` hoặc `DELETE /api/auth/sessions/:id`.
   - Thu hồi tất cả phiên khác: `authClient.revokeOtherSessions()`.
2. **Giao diện người dùng (Frontend):**
   - Thêm tab "Thiết bị & Phiên đăng nhập" vào `settings-nav.ts`.
   - Trang `/dashboard/settings/sessions`: Hiển thị danh sách thiết bị kèm icon (Browser, OS, IP address, thời gian hoạt động cuối, gắn badge "Phiên hiện tại").
   - Nút "Đăng xuất thiết bị này" cho từng phiên và nút "Đăng xuất khỏi tất cả thiết bị khác".
