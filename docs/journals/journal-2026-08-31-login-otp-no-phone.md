# Journal: Login Google + Email OTP (bỏ SĐT, bỏ password login)

**Date:** 2026-08-31  
**Scope:** Better Auth (API), Resend OTP, `/auth` Mantine UI, settings password  
**Branch:** `feat/login-page-ui`  
**Plan phone 30/08:** cancelled — không implement SĐT

---

## 1. Tóm tắt

Login Nexus còn **Google** và **email OTP**. OTP `type: "sign-in"` vừa đăng nhập vừa **tạo tài khoản mới**. Không còn form mật khẩu, quên mật khẩu, SĐT.

## 2. Backend (`apps/api`)

### 2.1. `auth.ts`

- `hooks.before`: `path === '/sign-in/email' || path === '/sign-up/email'` → `400 PASSWORD_AUTH_DISABLED`. Không match `/sign-in/email-otp`.
- `emailOTP({ disableSignUp: false, otpLength: 6, expiresIn: 300, allowedAttempts: 3, rateLimit: { window: 60, max: 3 } })`.
- `sendVerificationOTP` **await** gửi mail (trước fire-and-forget → UI báo thành công khi Resend chưa xong / fail).
- Gỡ `accountLockoutService` khỏi password sign-in.

`emailAndPassword.enabled: true` **còn** (plugin Better Auth). Chỉ chặn 2 HTTP path login/signup password.

### 2.2. `email.service.ts`

`resend.emails.send` nếu `error` thì **throw**. Fail SMTP không nuốt.

### 2.3. Prisma / SĐT

Schema không `users.phone_number`. Migration phone **chưa apply**, chỉ xóa file — không `migrate reset` / `db push` / `DROP`. Client cũ còn field `phone_number` → 500 rỗng; vá `npx prisma generate` + restart tsx.

## 3. Frontend (`apps/web-1`)

### 3.1. `/auth`

Hai bước:

1. Idle — Google, hoặc email + **Đăng nhập**.
2. OTP — PinInput 6 số, **Gửi lại mã** (phải, giữa PIN và CTA), **Tiếp tục**.

File mới:

- `app/auth/_components/EmailOtpStep.tsx`
- `app/auth/hooks/use-email-otp-login.ts` — send `type: "sign-in"`, verify `signIn.emailOtp`
- `app/auth/hooks/use-google-sign-in.ts`
- `app/auth/_components/GoogleButton.tsx`
- `app/auth/get-auth-redirect.ts`

Xóa: password fields, `/auth/forgot-password`, `/auth/reset-password`. OTP login **không** dùng flow quên mật khẩu.

`auth-errors.ts`: message rỗng → `"Đã có lỗi xảy ra. Vui lòng thử lại."`

Tên user mới (OTP): local-part email, max 32. Google: tên profile Google.

### 3.2. Settings

Xóa **Đổi mật khẩu**:

- `/dashboard/settings/password`
- `/supporter/settings/password`
- `ChangePasswordForm`
- nav item
- `changePassword` mutation + export `auth-client`

Còn: hồ sơ, phiên, thông báo.

## 4. Verify

- `POST /sign-in/email` + `/sign-up/email` → `PASSWORD_AUTH_DISABLED`
- OTP send `type: "sign-in"` → `200 {"success":true}`
- OTP sai → `INVALID_OTP` (path email-otp không bị hook chặn)
- UI live `:3001/auth`: PIN + Gửi lại + Tiếp tục
- Vá thiếu `</Center>` trên `EmailOtpStep` (React vỡ lúc vào OTP)

OTP inbox máy thật / cookie session prod chưa đóng trong journal này.

## 5. Quyết định

- OTP = login + auto-create. Password không còn cửa đăng nhập.
- Google giữ, không gate SĐT.
- Không DROP cột phone.
- Không copy forgot-password thành màn OTP.
- Không Đổi email trên bước OTP (F5 / nhập lại).

## 6. Chưa làm

- Tắt hẳn plugin `emailAndPassword`
- Xóa `/auth/verify-email` (mồ côi sau khi chặn signup email)
- Xóa `account-lockout.service.ts` (không còn caller)
- Confirm OTP trên inbox thật
