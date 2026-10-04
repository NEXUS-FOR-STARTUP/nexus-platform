# GA-01: Fix luồng quên mật khẩu (chuyển sang emailOTP flow + tạo trang reset)

- **ID:** GA-01
- **Priority:** P0 (Khẩn cấp)
- **Category:** Account
- **Status:** Done
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Báo cáo hoàn thành:** `docs/journals/journal-2026-08-24-ga01-ga07-auth.md`

---

## 1. Mô tả vấn đề
Người dùng quên mật khẩu trước đây không thể tự lấy lại tài khoản. Giao diện Frontend gọi `authClient.sendResetPassword`, nhưng Better Auth server không kích hoạt endpoint đó do `RESET_PASSWORD_DISABLED`. Người dùng bị kẹt và buộc phải nhờ Supporter/Admin can thiệp thủ công.

## 2. Giải pháp thực hiện
- Sử dụng plugin `emailOTP` có sẵn của Better Auth (`auth.ts:133-146`) để tạo mã OTP 6 số qua email.
- UI phía Frontend chuyển đổi sang flow 3 bước:
  1. Trang `/auth/forgot-password`: Nhập email $\rightarrow$ gọi `authClient.emailOtp.requestPasswordReset`.
  2. Trang `/auth/reset-password`: 
     - Bước 1: Nhập mã OTP 6 số (`OtpStepSection.tsx`) $\rightarrow$ xác minh bằng `authClient.emailOtp.checkVerificationOtp`.
     - Bước 2: Nhập mật khẩu mới (`NewPasswordStep.tsx`) $\rightarrow$ gọi `authClient.emailOtp.resetPassword`.
- Tự động thu hồi phiên đăng nhập cũ (`revokeSessionsOnPasswordReset: true`).

## 3. Bằng chứng mã nguồn (Evidence)
- Backend: `apps/api/src/auth.ts` cấu hình `emailOTP` với `type: 'forget-password'`.
- Frontend: 
  - `apps/web-1/app/auth/forgot-password/page.tsx`
  - `apps/web-1/app/auth/reset-password/page.tsx`
  - `apps/web-1/app/auth/reset-password/_components/OtpStepSection.tsx`
  - `apps/web-1/app/auth/reset-password/_components/NewPasswordStep.tsx`
