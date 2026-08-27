# GA-12: Điều khoản dịch vụ / Chính sách bảo mật thật + Ghi nhận Consent

- **ID:** GA-12
- **Priority:** P1
- **Category:** Policy (Pháp lý)
- **Type:** Policy / Non-technical (Soạn thảo văn bản điều khoản pháp lý)
- **Status:** Todo
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Căn cứ pháp lý:** Nghị định số 13/2023/NĐ-CP (Điều 11 — Sự đồng ý của chủ thể dữ liệu)

---

## 1. Mô tả vấn đề
Tại form đăng ký tài khoản (`AuthPanel.tsx:417-424`), ô checkbox "Tôi đồng ý với điều khoản dịch vụ" hiện là text tĩnh, không có liên kết (hyperlink) tới văn bản Điều khoản sử dụng (ToS) và Chính sách bảo mật (Privacy Policy) thực tế. Đồng thời, hệ thống không lưu phiên bản điều khoản (`consent_version`, `consented_at`) khi người dùng tạo tài khoản, thiếu căn cứ pháp lý chứng minh sự đồng ý xử lý dữ liệu.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Văn bản pháp lý:**
   - Soạn thảo và tạo 2 trang nội dung công khai: `/terms` (Điều khoản sử dụng) và `/privacy` (Chính sách bảo mật dữ liệu theo chuẩn NĐ 13/2023).
2. **Database & Schema:**
   - Thêm trường `consent_version: String?` và `consented_at: DateTime?` vào bảng `users` (hoặc lưu trong bảng `consent_logs`).
3. **Frontend & Auth Integration:**
   - Cập nhật checkbox tại `AuthPanel.tsx` với link mở trang `/terms` và `/privacy` trong tab mới.
   - Khi gọi `authClient.signUp.email`, truyền `consent_version: "2026-08-v1"` lên server để ghi nhận.
