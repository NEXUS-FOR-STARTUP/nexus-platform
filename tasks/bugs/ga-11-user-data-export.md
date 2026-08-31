# GA-11: Người dùng tự tải bản sao dữ liệu cá nhân (User-Facing Data Export)

- **ID:** GA-11
- **Priority:** P1
- **Category:** Legal / Compliance
- **Status:** Dropped (Đã bỏ theo quyết định quản trị MVP)
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Căn cứ pháp lý:** Nghị định số 13/2023/NĐ-CP (Điều 9 — Quyền được biết, truy cập và yêu cầu cung cấp dữ liệu cá nhân)

---

## 1. Mô tả vấn đề
Hệ thống hiện tại chưa có tính năng "Tải dữ liệu của tôi (Download My Data)". Người dùng không có cách nào tự trích xuất toàn bộ hồ sơ cá nhân, lịch sử case, tin nhắn chat và lịch sử giao dịch ví của chính mình dưới dạng cấu trúc máy có thể đọc được (JSON/ZIP). Điều này chưa đáp ứng trọn vẹn quyền tiếp cận dữ liệu cá nhân theo NĐ 13/2023.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Backend API:**
   - Endpoint: `GET /api/profile/export` (có rate limit 1 lần/ngày/user).
   - Tổng hợp dữ liệu thành file JSON / ZIP gồm:
     - Thông tin cá nhân (`user`, `profile`).
     - Danh sách các dự án/case đã tạo và tài liệu đã upload.
     - Lịch sử tin nhắn chat trong các case.
     - Lịch sử biến động số dư ví (`wallet`, `transactions`, `deposits`, `orders`).
2. **Frontend UI:**
   - Thêm nút "Tải dữ liệu của tôi" trong trang `apps/web-1/app/dashboard/settings/profile/`.
   - Hiển thị cảnh báo bảo mật trước khi tải xuống file chứa thông tin nhạy cảm.
