# Journal: GA-01 OTP reset + GA-07 rolling session

**Date:** 2026-08-24

**Plan:** `local://ga01-ga07-auth-plan.md`

**Status:** Implemented + smoke verified. Tracker GA-01/GA-07 = Done.

## Việc đã làm

1. **GA-01** — `forgot-password` gọi `authClient.emailOtp.requestPasswordReset`. Success ghi `nexus.password-reset.email` rồi `/auth/reset-password`.
2. **Reset page** — email (editable) + PinInput OTP + password + confirm. Submit `emailOtp.resetPassword`. Không auto-sign-in. `revokeSessionsOnPasswordReset: true`.
3. **GA-07** — `session.expiresIn = 7d`, `updateAge = 1d` trước `modelName`. Rolling native, không idle/absolute cứng.

## Verify

- API smoke GA-01: 19/19 (local Postgres). Unknown email generic success; OTP persist; wrong/reused OTP fail; password đổi; session cũ 401.
- UI: OTP copy, sessionStorage prefill, validate 8 ký tự + confirm mismatch.
- GA-07: `/session.expiresAt` +168.00h; cookie 200; no cookie 401.
- `npm run check-types`: pass.
- `apps/api` `npm test`: 96 pass / 24 fail — fail pre-existing (Prisma user `user` P1000, Centrifugo, deprecate-revision). Không đụng auth reset/session.
- OTP đọc từ `verifications` local, không xác minh hộp thư Resend thật.

## Quyết định

- Không khôi phục link-based `sendResetPassword`.
- Không claim absolute+idle. Cần cứng thì task mới.
- File reset tách `page` / `ResetPasswordForm` / `ResetPasswordFields` để giữ ≤200 dòng.

## Nợ

- Suite API test sẵn đỏ — không sửa trong task này.
- Live inbox delivery chưa confirm.
