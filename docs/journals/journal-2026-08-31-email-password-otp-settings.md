# Journal: Email + password + OTP (đặt pass trong Settings)

**Date:** 2026-08-31  
**Branch:** `feat/login-page-ui` (`bf75923`)  
**Nguồn:** working tree unstaged + untracked (chưa commit)  
**Thay:** `journal-2026-08-31-login-otp-no-phone.md` ghi “bỏ password login” — **không còn đúng**.

---

## 1. Tóm tắt

Login Nexus: **Google**, **email + mật khẩu**, **email OTP**.

- Có hash trên `accounts.password` → login password được.
- Chưa có hash (OTP/Google lần đầu) → **không** login password; phải OTP (hoặc Google). Vào Settings **tự đặt** mật khẩu. Đặt xong mới login được cả pass lẫn OTP.
- Server **không** bịa pass, **không** mail pass, **không** cột `password_reveal`, **không** hiện hash ra chữ.

Hash Better Auth một chiều. Không giải ngược.

---

## 2. Quyết định đã bỏ (không còn trong working tree)

Thử rồi dẹp, **không** nằm unstaged:

| Ý | Lý do bỏ |
|---|---|
| `users.password_reveal` AES + `PASSWORD_REVEAL_KEY` | User cấm lưu bản giải mã được |
| `GET/POST /profile/password-sample`, `PasswordReveal`, unlock | Phụ thuộc cột trên |
| `ensureRandomPassword` (OTP/Google bịa 8 ký tự) | Pass ma, user không gõ |
| Mail acc+pass sau OTP | Thay bằng “vào Settings đặt” |

Journal/plan cũ nói reveal / random pass = **lịch sử sai**, không phải code hiện tại.

---

## 3. Flow người dùng

### 3.1. `/auth`

1. Idle: Google, hoặc nhập email + checkbox điều khoản → **Tiếp tục**.
2. Email choice: **Đăng nhập mật khẩu** hoặc **Đăng nhập OTP**.
3. Password: gõ pass ≥ 8.
   - Acc không tồn tại → modal đăng ký → OTP.
   - Acc tồn tại, `hasPassword: false` → chặn, bảo dùng OTP.
   - Acc có pass → `signIn.email` (Better Auth).
4. OTP: PinInput 6 số. `signIn.emailOtp`. **Không** gọi đặt pass sau verify.

Đăng ký trực tiếp `POST /api/auth/sign-up/email` vẫn **chặn** (`PASSWORD_AUTH_DISABLED`). Acc mới chỉ qua OTP hoặc Google.

### 3.2. Settings mật khẩu

`/dashboard/settings/password` và `/supporter/settings/password`.

- `GET /api/profile/password-status` → `{ hasPassword }`.
- `false`: 2 ô (mật khẩu + xác nhận) → **Đặt mật khẩu** → `POST /api/profile/password`.
- `true`: thêm ô mật khẩu hiện tại → **Xác nhận đổi mật khẩu** → `POST /api/profile/password/change` (đá session khác).

Nav: lại hiện **Đổi mật khẩu** (`KeyRound`).

---

## 4. Phân lớp: Better Auth vs Hono tự viết

**Better Auth (sống)**

- Core `emailAndPassword` — `sign-in/email`, `changePassword`.
- Plugin `emailOTP` — gửi/verify OTP.
- Plugin `admin`, `openAPI`.
- Google `socialProviders`.
- Hash: `accounts.password`.

**Hono `apps/api/src/modules/profile/` (tự viết, Better Auth không có)**

| Method | Path | Auth | Việc |
|---|---|---|---|
| POST | `/api/profile/password-status` | public | `{ exists, hasPassword }` theo email. Rate limit 10/min/IP |
| GET | `/api/profile/password-status` | session | `{ hasPassword }` cho form Settings |
| POST | `/api/profile/password` | session | Đặt pass lần đầu, min 8, 409 nếu đã có |
| POST | `/api/profile/password/change` | session | Đổi pass qua `auth.api.changePassword` + revoke session khác |

Không còn: password-sample, password-reveal, unlock, ensure-random.

---

## 5. File working tree

### 5.1. Modified

- `apps/api/src/auth.ts` — mở `/sign-in/email`; vẫn chặn `/sign-up/email`. Gỡ block password login. OTP mail tách `auth-verification-email.ts`.
- `apps/api/src/modules/profile/http/profile.routes.ts` — 4 route password trên.
- `apps/web-1/app/auth/_components/AuthPanel.tsx` — step idle → email → password | otp.
- `apps/web-1/app/auth/hooks/use-email-otp-login.ts` — OTP only; không POST `/profile/password` sau verify.
- `apps/web-1/app/dashboard/settings/_components/settings-nav.ts` — item Đổi mật khẩu.
- `apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts` — `setPassword`, `changePassword`, `useHasPasswordQuery`.
- `apps/web-1/lib/auth-errors.ts` — pass quá ngắn / đã đặt / chưa verify / sign-up disabled.
- `docs/requirements/settings-sidebar-and-profile.md`
- `docs/technical-notes/frontend-route-and-component-map.md`
- `docs/tech-doc-urls.txt`

### 5.2. Untracked (feature)

**API**

- `auth-verification-email.ts`
- `password-status.usecase.ts` + test
- `set-password.usecase.ts` + test
- `change-password.usecase.ts`
- `password-rate-limit.ts`
- `password.controller.ts`

**Web**

- `AuthIdleStep.tsx`, `EmailChoiceStep.tsx`, `PasswordStep.tsx`, `RegisterConfirmModal.tsx`
- `use-email-password-login.ts`
- `settings/password/page.tsx` + `ChangePasswordForm.tsx` (dashboard + supporter)

**Khác (không phải flow login)**

- `plans/260831-1830-email-password-settings/` — plan cũ (có phase crypto/reveal, **lệch** so với code cuối).
- `scripts/delete-user-data.ts` — script riêng, không thuộc login.

---

## 6. Chức năng theo persona

| Ai | Làm được |
|---|---|
| User mới OTP | Vào app, chưa có pass |
| User mới Google | Vào app, chưa có pass |
| User chưa đặt pass, bấm login password | Chặn, bảo OTP |
| User đã đặt pass | Login password hoặc OTP |
| Student/Supporter Settings | Đặt pass lần đầu hoặc đổi pass |
| Attacker đọc DB | Chỉ thấy hash, không ra chữ |

---

## 7. Test

`apps/api` `tsx --test`:

- `password-status.usecase.test.ts` — exists/hasPassword + `getMyPasswordStatus`
- `set-password.usecase.test.ts` — hash lần đầu, 409 nếu đã có, reject ngắn/rỗng (không generate)

Không còn test reveal/crypto/ensure-random.

---

## 8. Việc còn lại ngoài working tree này

- Commit.
- Nếu DB local/prod từng `ADD password_reveal`: chạy migration drop **thủ công** (`20260831260000_drop_user_password_reveal` nếu file còn). Agent không `DROP` lên prod.
- Acc cũ từng bị bịa pass 8 ký tự: `hasPassword: true` — login password bằng pass đã mail (nếu từng nhận) hoặc OTP rồi đổi trong Settings.
- `plans/260831-1830-email-password-settings/` mô tả reveal — đừng implement theo plan đó.
