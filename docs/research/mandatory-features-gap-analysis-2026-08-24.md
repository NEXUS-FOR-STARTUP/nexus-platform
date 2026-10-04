# Chức năng bắt buộc tối thiểu còn thiếu — Gap Analysis

- **Ngày:** 2026-08-24
- **Loại:** research / gap analysis
- **Nhánh phân tích:** `feat/verify-email`
- **Trạng thái:** Đã review bởi code-reviewer agent (2026-08-24) — mọi claim đã xác minh bằng source code, đã áp dụng chỉnh sửa từ review
- **Phương pháp:** 3 scout agent (API / Web / Data+Docs) kiểm kê hiện trạng + 1 researcher agent đối chiếu hệ thống thực tế; orchestrator xác minh trực tiếp các claim nghiêm trọng; code-reviewer agent review độc lập từng claim đối chiếu code.

## 1. Tóm tắt

Nexus đã trên mức MVP ở luồng nghiệp vụ chính (intake → triage → supporter → report → revision, ví VND + deposit + SePay). 8/8 file `docs/requirements/` đã implement, 18/18 bug đóng.

Gap thật nằm ở **boilerplate tài khoản/bảo mật/pháp lý/UX chuẩn** — loại chức năng "mọi hệ thống đều phải có":

- **P0 (4):** luồng quên mật khẩu hỏng hoàn toàn; kẹt intake khi thanh toán trước khi nộp; không rate limit/lockout đăng nhập; không có xóa tài khoản (NĐ 13/2023).
- **P1 (9):** avatar upload, quản lý session, chính sách session timeout, notification preferences, pagination/search case list, export CSV admin, user data export, ToS/Privacy + consent, 2FA admin/supporter.
- **P2:** rút tiền ví, policy credit mở, CSRF/rate-limit hạ tầng, cleanup deprecated (gồm dead code deposit), chat unread (nice-to-have), backup tự động.

## 2. Phạm vi và phương pháp

### Bối cảnh business

Nexus Platform — sinh viên gửi "case" (hồ sơ phản biện ý tưởng) qua structured intake → lập team (team-fit) → mua gói dịch vụ bằng ví VND → nạp tiền qua chuyển khoản + proof ảnh → admin xác minh (Deposit) → Order + WalletTransaction → admin triage/gán supporter → supporter review/viết Report → revision rounds → hoàn tất. Role: user / supporter / admin. Chat realtime Centrifugo, notification in-app + email + Telegram.

### Nguồn đối chiếu (hệ thống thực tế gần nhất)

- Nền tảng nộp ý tưởng/hackathon: **Devpost, IdeaScale, Unstop** (submission steps, triage, gán giám khảo, team invite).
- Nền tảng mentorship (gần mô hình supporter): **MentorCruise, Mentorloop, ADPList**.
- Ví/thanh toán: **PayPal, Wise** (lịch sử giao dịch, filter, chi tiết, refund) + **NĐ 52/2024** (ví điện tử) + **payOS** (đối soát chuyển khoản thủ công VN).
- Bảo mật: **OWASP Cheat Sheets** (Authentication, Session Management, Forgot Password, Email Validation).
- Pháp lý: **NĐ 13/2023/NĐ-CP** (bảo vệ dữ liệu cá nhân — quyền xóa/cung cấp dữ liệu trong 72h, căn cứ pháp lý xử lý).
- Chi tiết checklist đầy đủ + URL nguồn: xem §9.

### Tiêu chí lọc

- Giữ: chức năng boilerplate "theo lẽ thường" mà thiếu là hỏng vận hành, mất tiền, mất tài khoản, mất niềm tin, hoặc vi phạm pháp luật.
- Bỏ (out-of-scope): invoicing/thuế, multi-tenant org, CRM/affiliate, Stripe/recurring billing, public gallery + public voting.

## 3. Quyết định sản phẩm

| Quyết định | Nội dung | Hệ quả |
|---|---|---|
| **Email là định danh bất biến** | Email unique, **không hỗ trợ đổi email**. Email khác = tạo tài khoản khác. (Quyết định người dùng, 2026-08-24) | "Đổi email" **loại khỏi** danh sách gap. Server hiện có sẵn OTP type `change-email` (`apps/api/src/auth.ts:34`) nhưng sản phẩm quyết định không expose flow này; không cần làm UI, không cần endpoint đổi email tầng app. |

## 4. Hiện trạng — đã đạt chuẩn (không cần làm)

| Chức năng | Bằng chứng |
|---|---|
| Ví: số dư + lịch sử giao dịch (pagination/filter type/sort) | `apps/api/src/modules/wallet/infrastructure/http/wallet.routes.ts:11-40`; UI `app/dashboard/wallet/_components/WalletTransactionList.tsx` (responsive table/card) |
| Nạp tiền: tạo deposit, QR SePay, upload/paste proof, trạng thái từng bước | `app/dashboard/wallet/_components/WalletTopupModal.tsx`; `app/dashboard/payment/page.tsx` |
| Notification: bell + unread badge (99+ cap) + mark read + mark all | `components/layout/NotificationBell.tsx`; API `notifications.routes.ts:12-15` + SSE stream |
| Auth: đăng ký + xác thực email OTP bắt buộc, Google OAuth, đổi mật khẩu (revoke session khác) | `apps/api/src/auth.ts:117-127,160-176`; `app/dashboard/settings/password/_components/ChangePasswordForm.tsx` |
| Admin: search/filter/sort/pagination trên **users** (server-side qua Better Auth admin.listUsers) và **deposits** (client-side); ban/unban + lý do; quản lý giá package | `app/admin/_components/AdminUsersTable.tsx`, `AdminDepositVerificationTable.tsx`, `AdminPackagesSettings.tsx` |
| RBAC case-level (owner/member/supporter/admin) | `apps/api/src/shared/infrastructure/authorization.ts:52-142` |
| Idempotency global (POST/PATCH), correlation ID, error handler không lộ stack | `apps/api/src/index.ts:47-96,166-176` |
| 404, 500 (error.tsx), 401 redirect /auth, empty/loading/error states | `app/not-found.tsx`, `app/error.tsx`, `lib/api-client.ts:21-31` |
| Audit trail: `CaseEvent` (DB) + `AuditLogger` (Pino) | `apps/api/src/shared/infrastructure/audit-logger.ts` |
| Refund credit tự động FIFO, idempotent, chống double-spend | `apps/api/src/services/credit-refund.ts:20-113`; `case-transition.service.ts` (credit gate 402, payment gate 402, optimistic lock 409) |

> Lưu ý: **admin cases** chưa đạt chuẩn search/pagination server-side — chỉ filter enum + limit (`list-admin-cases.usecase.ts:13-39`), search/pagination đang client-side. Xem P1#5.

## 5. P0 — Hỏng vận hành / rủi ro nghiêm trọng

### 5.1 Luồng quên mật khẩu hỏng hoàn toàn

**Bằng chứng (xác minh trực tiếp + reviewer xác nhận):**
- `apps/api/src/auth.ts:117-121` cấu hình `emailAndPassword` **không có** `sendResetPassword` → Better Auth throw `APIError("Reset password isn't enabled", code RESET_PASSWORD_DISABLED)` cho mọi request `/request-password-reset` (`node_modules/better-auth/dist/api/routes/password.mjs:42-46`).
- UI gọi đúng endpoint đó: `authClient.requestPasswordReset({ email, redirectTo: "/auth/reset-password" })` (`apps/web-1/app/auth/forgot-password/page.tsx:35-38`).
- Trang `/auth/reset-password` **không tồn tại** (glob toàn `apps/web-1` = 0 file).

**Hệ quả:** user quên mật khẩu = mất tài khoản vĩnh viễn.

**Hướng sửa (cơ sở hạ tầng đã có sẵn):** server đã cấu hình OTP flow reset qua emailOTP plugin (`/email-otp/request-password-reset` + `/email-otp/reset-password`, subject email "Mã đặt lại mật khẩu của bạn" tại `apps/api/src/auth.ts:30-35`). UI chỉ cần chuyển sang `authClient.emailOtp.requestPasswordReset` + tạo trang nhập OTP + mật khẩu mới. Không đụng DB.

### 5.2 Kẹt intake: thanh toán trước khi nộp → case kẹt `intake_ready`

**Bằng chứng:** team đã tự nhận biết, chưa chốt — `docs/flows/intake-flow.md` (⚠ điểm đã biết) + `docs/research/brainstorm-2026-08-21-flow-confusion-intake-payment-credit.md` (Q1–Q5 mở, PR #19 chưa merge).

> ⚠ **Trạng thái xác minh:** bằng chứng hiện ở tầng tài liệu (team tự ghi nhận), **chưa xác minh bằng source code** trên nhánh `feat/verify-email`. Trước khi chốt cần bước xác minh trạng thái `intake_ready` trong `case-transition.service.ts` / intake flow code.

**Hệ quả:** case đã trả tiền không lên `submitted`, nằm ngoài hàng đợi duyệt — sinh viên mất tiền + mất niềm tin.

### 5.3 Không có rate limit / lockout đăng nhập

**Bằng chứng:** `apps/api/src/index.ts` không có rate limiter global; `auth.ts` chỉ có rate limit OTP (window 60s / max 3, `apps/api/src/auth.ts:164-165`). Không có khóa tài khoản sau N lần sai mật khẩu (`ban_expires` chỉ do admin set thủ công).

**Hệ quả:** brute-force/credential stuffing vào tài khoản có ví tiền. OWASP Authentication Cheat Sheet xếp lockout 3–5 lần sai (đếm theo tài khoản) là yêu cầu core.

### 5.4 Không có xóa tài khoản / xóa dữ liệu cá nhân

**Bằng chứng:** `apps/api/src/modules/admin/http/admin.routes.ts:48-50` chỉ có POST /users, ban, unban — không có delete user. Grep toàn `apps/api/src` không thấy endpoint delete user tầng app; chỉ Better Auth auto-mount `/api/auth/delete-user` (không xử lý cascade case/wallet/deposit ở app layer).

**Hệ quả:** vi phạm Nghị định 13/2023/NĐ-CP — quyền xóa dữ liệu phải thực hiện trong 72h; nền tảng thu thập dữ liệu sinh viên bắt buộc phải có cơ chế (xóa hoặc tối thiểu yêu cầu xóa + quy trình xử lý thủ công).

## 6. P1 — Chuẩn tối thiểu thiếu

| # | Gap | Bằng chứng | Ghi chú |
|---|---|---|---|
| 1 | **Avatar upload chưa triển khai** | `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx:45-51` — nút "Đổi ảnh" chỉ hiện toast "đang phát triển"; không có API update image tầng app | Chuẩn profile: xem + sửa ảnh đại diện |
| 2 | **Quản lý session/thiết bị: không có UI** | Settings chỉ 2 mục (`settings-nav.ts:9-12`); chỉ `revokeOtherSessions` ẩn khi đổi mật khẩu (`useProfileMutations.ts:36`). Session model đã có `ip_address`/`user_agent` (`auth.ts:86-87`) → làm UI khả thi | OWASP Session Management; quan trọng khi ví bị nghi ngờ lộ |
| 3 | **Chính sách session timeout (absolute/idle) chưa cấu hình** | `auth.ts:79-90` session config chỉ map fields, không có `expiresIn`/inactivity policy — phụ thuộc hoàn toàn default Better Auth | OWASP Session Management: absolute timeout + idle timeout |
| 4 | **Notification preferences: không có** | Không trang/endpoint bật/tắt theo loại/kênh; settings-nav chỉ 2 mục. Hệ thống đã có đa kênh (in-app + email + Telegram) | Tránh notification fatigue |
| 5 | **Pagination/search server-side cho case list + admin cases** | `list-cases.usecase.ts:3-5` → `findManyCasesByRole` không pagination/search; `list-admin-cases.usecase.ts:13-39` chỉ stage/internal_status/limit (không offset, không text search, không sort — search/pagination đang client-side) | Sẽ vỡ khi số case tăng |
| 6 | **Không có export CSV/Excel cho admin** | Cả API và Web đều không có endpoint export, không có thư viện csv/xlsx | PayPal/Wise cho tải lịch sử; phục vụ đối soát |
| 7 | **User-facing data export (quyền truy cập dữ liệu của chính chủ thể)** | Không có endpoint "download my data" cho người dùng; chỉ có wallet history và các GET list nội bộ | NĐ 13/2023 Điều 9 — quyền truy cập/cung cấp dữ liệu trong 72h |
| 8 | **ToS/Privacy Policy thật + ghi nhận consent** | Checkbox "Tôi đồng ý với điều khoản dịch vụ" (`AuthPanel.tsx:417-424`) bắt buộc khi đăng ký nhưng **không link tới văn bản thực tế**; không có trang terms/privacy trong app; không lưu phiên bản consent đã đồng ý | NĐ 13/2023 yêu cầu thông báo + căn cứ pháp lý rõ ràng khi xử lý dữ liệu sinh viên |
| 9 | **2FA cho admin/supporter** | Field `two_factor_enabled` được map (`apps/api/src/auth.ts:69`) nhưng plugin `twoFactor` không cài (`auth.ts:157-177` chỉ admin/openAPI/emailOTP) | Admin duyệt deposit là điểm chẹn tiền → cần MFA |

## 7. P2 — Củng cố + policy chưa chốt

| Gap | Bằng chứng |
|---|---|
| Rút tiền thủ công khỏi ví | Chỉ có hoàn tự động khi case kết thúc không trọn vẹn — `docs/flows/payment-verification-flow.md`; `wallet.service.ts` withdraw chỉ gọi nội bộ bởi order/purchase, không có route user-initiated |
| Policy credit mở: hết hạn? refund policy? chuyển credit giữa user? | `docs/backlog/credit-du-tru-account-level.md` §7 (open questions) |
| Taxonomy chưa khóa: lý do đóng case, rule auto-priority, giới hạn gói free team-fit | `docs/flows/case-lifecycle-flow.md`, `admin-triage-and-assignment-flow.md`, `team-fit-flow.md` |
| CSRF tầng app + hạ tầng rate limit | Không có CSRF middleware (cookie SameSite default Lax của Better Auth giảm thiểu nhưng cần xác nhận); SePay webhook không rate limit (`sepay.routes.ts:7`); idempotency memoryStore + chat rate limit in-memory (`index.ts:78`, `message-send-rate-limit.ts:2`) mất khi restart, không multi-instance |
| Cleanup: `WalletTopup` + `Payment` deprecated chưa archive; `RESEND_API_KEY` fail-fast cứng; **dead code deposit** (`useMyPayments` + `PaymentHistoryList` không import ở đâu; `/dashboard/payments` chỉ redirect) | `prisma/schema.prisma` (`@deprecated`); `apps/api/src/auth.ts:55`; `payments/page.tsx:9-11` |
| Chat unread-per-user (nice-to-have) | `case/[id]/page.tsx:113` truyền `messages?.length` = tổng số tin của case đang mở, không phải unread theo user — không phải chuẩn bắt buộc |
| Backup tự động | Có guide thủ công (`docs/db-backup-guide.md`) nhưng chưa scheduled/RPO — hệ thống giữ dữ liệu tài chính |

## 8. Đề xuất thứ tự triển khai

1. **P0#5.1** — fix quên mật khẩu (impact lớn nhất, fix nhỏ nhất, không đụng DB).
2. **P0#5.2** — xác minh code trạng thái `intake_ready` → chốt intake flow (brainstorm sẵn, cần quyết định Q1–Q5).
3. **P0#5.3** — rate limit + lockout đăng nhập.
4. **P0#5.4** — xóa tài khoản (hoặc quy trình xử lý yêu cầu xóa) + **P1#9** — 2FA admin/supporter + **P1#3** — chính sách session timeout (nhóm bảo mật tài khoản).
5. **P1#8** — ToS/Privacy Policy + consent + **P1#7** — user data export (nhóm tuân thủ NĐ 13/2023).
6. P1 còn lại: avatar → session UI → pagination/search case list → export CSV admin → notification preferences.

## 9. Nguồn tham khảo

1. OWASP Authentication Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
2. OWASP Forgot Password Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
3. OWASP Session Management Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
4. OWASP Email Validation and Verification — https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html
5. Devpost Help — submission steps, team invite, file upload, T&C — https://help.devpost.com/article/126-know-your-submission-steps
6. IdeaScale Help — workflow stages — https://help.ideascale.com/overview-stages
7. PayPal transaction history / reports — https://www.paypal.com/us/cshelp/article/how-do-i-find-my-paypal-debit-card-transaction-history-help139
8. Wise — filter + download transfers — https://wise.com/help/articles/2489458/how-do-i-download-a-list-of-my-transfers
9. Wise transaction details (timeline UI) — https://www.saasframe.io/examples/wise-transaction-details
10. Nghị định 52/2024/NĐ-CP (thanh toán không dùng tiền mặt) — https://luatvietnam.vn/tai-chinh/nghi-dinh-52-2024-nd-cp-cua-chinh-phu-quy-dinh-ve-thanh-toan-khong-dung-tien-mat-336447-d1.html
11. Nghị định 13/2023/NĐ-CP (bảo vệ dữ liệu cá nhân) — https://luatvietnam.vn/dan-su/nghi-dinh-13-2023-nd-cp-bao-ve-du-lieu-ca-nhan-249791-d1.html
12. payOS — đối soát chuyển khoản thủ công VN — https://payos.vn/cong-thanh-toan-cho-nganh-game/
13. SuprSend Notification Center — https://www.suprsend.com/post/in-app-notification-center
14. SaaS user management + audit log — https://www.hbs.net/blog/saas-user-management-best-practices ; https://agnitestudio.com/blog/audit-logging-saas/
15. 3-2-1 backup strategy — https://www.backblaze.com/blog/the-3-2-1-backup-strategy/
