# GA-13: Xác thực hai yếu tố (2FA / TOTP) cho Admin và Supporter

- **ID:** GA-13
- **Priority:** P1
- **Category:** Security
- **Status:** Todo
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Tiêu chuẩn:** OWASP Multi-Factor Authentication Guidelines

---

## 1. Mô tả vấn đề
Hiện tại, tài khoản Admin và Supporter chỉ đăng nhập bằng Email và Mật khẩu. Mặc dù Prisma schema đã có bảng `TwoFactor` và trường `two_factor_enabled` (`auth.ts:69`), nhưng Better Auth chưa kích hoạt plugin `twoFactor()`.
Admin là vị trí nhạy cảm nắm quyền duyệt nạp tiền (`deposits`), sửa giá gói (`packages`), và xem toàn bộ hồ sơ; nếu bị lộ mật khẩu sẽ dẫn tới rủi ro tài chính trực tiếp cho hệ sinh thái.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Backend Configuration:**
   - Cài đặt plugin `twoFactor()` trong cấu hình Better Auth (`apps/api/src/auth.ts`).
   - Hỗ trợ phương thức TOTP Authenticator (Google Authenticator, Microsoft Authenticator) và Backup recovery codes.
   - Giao thức bắt buộc (Enforced 2FA) đối với tài khoản có `role: 'admin'` hoặc `role: 'supporter'`.
2. **Frontend UI:**
   - Thêm tab "Bảo mật & 2FA" trong trang cài đặt.
   - Luồng kích hoạt: Hiển thị QR Code + Secret Key $\rightarrow$ Nhập mã OTP 6 số để xác nhận $\rightarrow$ Hiển thị danh sách Backup Codes.
   - Cập nhật màn hình đăng nhập: Sau khi nhập mật khẩu đúng, nếu tài khoản bật 2FA $\rightarrow$ chuyển bước nhập mã TOTP.
