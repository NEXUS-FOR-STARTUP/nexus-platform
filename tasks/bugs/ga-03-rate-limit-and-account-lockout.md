# GA-03: Rate limit + lockout đăng nhập (Account-Level Defense)

- **ID:** GA-03
- **Priority:** P0 (Khẩn cấp / Bảo mật)
- **Category:** Security
- **Status:** Done
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Tiêu chuẩn:** OWASP Authentication Cheat Sheet

---

## 1. Mô tả vấn đề
Trước đây hệ thống chỉ có rate limiting cơ bản theo IP (`/sign-in/email: 10 req/phút`) trong Better Auth, hoàn toàn không có cơ chế khóa tài khoản tạm thời theo email mục tiêu (Account Lockout). Kẻ tấn công có thể dùng kỹ thuật Distributed Brute-force hoặc xoay IP để dò mật khẩu mà không bị chặn.

## 2. Giải pháp thực hiện
- Xây dựng module `AccountLockoutService` (`apps/api/src/modules/auth/infrastructure/account-lockout.service.ts`):
  - Giới hạn tối đa: 5 lần nhập sai liên tiếp trong cửa sổ 15 phút.
  - Khóa tài khoản tạm thời trong 15 phút (`900s`) nếu vượt quá 5 lần thất bại.
  - Tự động mở khóa sau khi hết thời gian chờ hoặc reset bộ đếm ngay khi đăng nhập thành công.
  - Hỗ trợ chuẩn hóa email (lowercase, trim).
- Tích hợp hook Better Auth trong `apps/api/src/auth.ts`:
  - `hooks.before`: Chặn ngay tại endpoint `/sign-in/email` nếu tài khoản đang bị khóa, trả về mã lỗi `TOO_MANY_REQUESTS` kèm thời gian chờ.

## 3. Bằng chứng mã nguồn & Kiểm thử (Evidence)
- Code: 
  - `apps/api/src/modules/auth/infrastructure/account-lockout.service.ts`
  - `apps/api/src/auth.ts:163-170`
- Unit Test: `apps/api/src/shared/infrastructure/tests/account-lockout.test.ts` (6/6 test pass).
