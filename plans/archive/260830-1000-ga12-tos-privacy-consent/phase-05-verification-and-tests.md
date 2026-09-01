# Phase 5: Kiểm thử, Type Checking & Verification

## 1. Mục tiêu
Thực hiện kiểm thử toàn diện từ tầng cơ sở dữ liệu, API backend đến giao diện frontend để đảm bảo tính năng hoạt động hoàn hảo, không có regression và tuân thủ các quy tắc chất lượng code của Nexus.

---

## 2. Các kịch bản Kiểm thử & Xác minh

### 2.1. Kiểm thử Tự động Backend (Automated Tests)
- Tạo file kiểm thử: `apps/api/src/shared/infrastructure/tests/ga-12-consent-tracking.test.ts` sử dụng Node built-in runner (`node:test` + `node:assert`).
- **Kịch bản 1:** Khi user mới đăng ký qua `authClient.signUp.email`, user trong DB phải có `consent_version: "2026-08-v1"` và `consented_at` không được null.
- **Kịch bản 2:** Kiểm tra tính toàn vẹn của user cũ: bản ghi user cũ có `consent_version` là `null` mà không gây lỗi khi truy vấn/đăng nhập.

### 2.2. Kiểm tra Type & Build (Monorepo Check)
- Chạy lệnh kiểm tra TypeScript toàn bộ monorepo:
  ```bash
  npm run check-types
  ```
  Yêu cầu: Pass 100% không có bất kỳ type error nào trên cả `apps/api`, `apps/web-1`, `packages/validation`.

### 2.3. Kiểm thử Giao diện (Frontend & Browser Verification)
1. **Kiểm tra Truy cập:**
   - Mở trực tiếp `/terms` -> Hiển thị đúng nội dung ToS, Table of Contents, Theme Dark/Light.
   - Mở trực tiếp `/privacy` -> Hiển thị đúng nội dung Privacy Policy, Table of Contents.
2. **Kiểm tra Form Đăng ký (`/auth?tab=register`):**
   - Click vào link "Điều khoản dịch vụ" -> Mở tab mới `/terms`.
   - Click vào link "Chính sách bảo mật" -> Mở tab mới `/privacy`.
   - Tích/bỏ tích checkbox -> Validation hoạt động đúng (chặn đăng ký nếu chưa tích).
3. **Kiểm tra Footer (`/`):**
   - Click link "Chính sách bảo mật" ở footer -> Điều hướng tới `/privacy`.
   - Click link "Điều khoản sử dụng" ở footer -> Điều hướng tới `/terms`.

### 2.4. Cập nhật Bảng Quản lý Nhiệm vụ (Task Tracker)
- Cập nhật trạng thái `GA-12` trong `tasks/gap-analysis-tasks.md` và `tasks/README.md` từ `Todo` sang `Done` (khi hoàn tất implementation).
- Cập nhật file Excel `tasks/gap-analysis-tasks.xlsx` bằng skill `ck:xlsx`.

---

## 3. Tiêu chí Hoàn thành (Definition of Done)
- [ ] Test suite `ga-12-consent-tracking.test.ts` pass 100%.
- [ ] `npm run check-types` pass 100% không lỗi.
- [ ] Toàn bộ đường dẫn `/terms` và `/privacy` hoạt động mượt mà trên browser.
- [ ] Bảng tracking task `tasks/gap-analysis-tasks.md` được cập nhật đầy đủ bằng chứng.
