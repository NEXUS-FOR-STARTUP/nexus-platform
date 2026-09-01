# Journal: GA-04 Xóa tài khoản cá nhân (Soft-Delete & Danger Zone UI)

- **Ngày thực hiện:** 2026-08-27
- **Nhiệm vụ:** GA-04 (User Account Deletion)
- **Tác giả:** Phung Luu Hoang Long / AI Assistant
- **Trạng thái:** Hoàn thành 100%

---

## 1. Bối cảnh & Vấn đề Kỹ thuật

Trước khi triển khai GA-04, hệ thống chưa cung cấp cơ chế để người dùng tự xóa tài khoản cá nhân trong trang Cài đặt (`/dashboard/settings`).

Khảo sát giải pháp mặc định của Better Auth:
- Better Auth cung cấp sẵn API `user.deleteUser` và `authClient.deleteUser()`.
- Tuy nhiên, phương thức này thực hiện **Hard Delete** (`DELETE FROM users WHERE id = ...`).
- Trong cơ sở dữ liệu Nexus Platform, bảng `users` có quan hệ khóa ngoại (foreign key không cascade) với hàng loạt bảng trọng yếu: `cases`, `deposits`, `orders`, `user_wallets`, `notifications`, `document_records`, `reports`.
- Hard delete sẽ dẫn đến lỗi vi phạm khóa ngoại PostgreSQL (`P2003: Foreign key constraint failed`) và vi phạm trực tiếp nguyên tắc bất biến bảo toàn dữ liệu tài chính/kế toán (Zero Data Loss) quy định tại `.agents/rules/prisma-migration-safety.md`.

---

## 2. Quyết định Kỹ thuật & Kiến trúc Giải pháp

### A. Backend: Soft-Delete + Anonymization + Session Revocation
Thay vì xóa dòng vật lý trong DB, triển khai endpoint `DELETE /api/profile/account` trong module `profile` với quy trình Prisma Transaction nghiêm ngặt:
1. **Khóa tài khoản:** Cập nhật `banned = true`, `ban_reason = "USER_DELETED_ACCOUNT"`. Better Auth Admin plugin sẽ tự động từ chối mọi yêu cầu đăng nhập tiếp theo với mã `BANNED_USER`.
2. **Giải phóng định danh email (Email Scrambling):**
   - Đổi `email = deleted_${Date.now()}_${user.email}`.
   - Giữ nguyên tính toàn vẹn của ràng buộc `@@unique([email])`, đồng thời cho phép người dùng dùng lại email cũ để đăng ký tài khoản mới trong tương lai nếu muốn.
3. **Ẩn danh hóa thông tin PII (GDPR / Nghị định 13/2023):**
   - Đặt `name = "Người dùng đã xóa"`, `image = null`.
4. **Hủy toàn bộ phiên đăng nhập & thông tin xác thực:**
   - Xóa toàn bộ bản ghi `Session` của user (`user_id = userId`), vô hiệu hóa ngay lập tức mọi token đang hoạt động trên các thiết bị.
   - Xóa các bản ghi `Account` (credential / OAuth tokens) và `TwoFactor` để ngăn chặn tái xác thực qua mật khẩu cũ hoặc tài khoản Google/GitHub.
5. **Ghi vết kiểm toán (Audit Trail):**
   - Ghi nhận `auditLogger.log` với thao tác `USER_DELETE_ACCOUNT`, IP, user agent và metadata phục vụ đối soát.

### B. Frontend: Danger Zone & Modal Xác nhận 2 bước
- **Vị trí tích hợp:** Đặt ở cuối cùng trang "Thông tin cơ bản" (`/dashboard/settings/profile`) bên trong `ProfileInfoForm.tsx`. Khối Danger Zone được bao bọc bởi styling cảnh báo (`border-danger/20`, `bg-danger-soft/20`) phân tách trực quan với các thao tác cập nhật thường nhật.
- **Cơ chế chống bấm nhầm (Accidental Prevention):**
  - Mở `DeleteAccountModal.tsx` giải thích rõ hậu quả không thể đảo ngược.
  - Bắt buộc người dùng gõ chính xác chữ `"XOA"` vào ô xác nhận mới mở khóa nút "Xác nhận xóa tài khoản".
- **Dọn dẹp trạng thái Client-side:**
  - Khi API trả về thành công: gọi `authClient.signOut()`, dọn sạch cache với `queryClient.clear()`, hiển thị Toast thông báo và chuyển hướng an toàn về `/auth`.

---

## 3. Kiểm thử & Nghiệm thu

1. **Automated Unit Tests:**
   - File kiểm thử: `apps/api/src/shared/infrastructure/tests/delete-account.test.ts`.
   - Sử dụng test runner chuẩn của dự án (`node:test` + `node:assert/strict`).
   - Bao phủ đầy đủ các kịch bản: soft-delete thành công, scramble email, thu hồi session, xóa account/2FA, xử lý user không tồn tại (`404 NOT_FOUND`), và đảm bảo không gây ảnh hưởng đến dữ liệu `cases`/`orders`/`deposits`.
2. **Type Safety & Lint:**
   - `npm run check-types` pass 100% trên toàn bộ workspaces (`apps/api`, `apps/web-1`, `packages/validation`).
   - Giao diện tuân thủ tuyệt đối quy chuẩn Mantine UI v9, không dùng class Tailwind override layout của Mantine Modal.
