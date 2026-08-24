# Gap Analysis Tasks — Nexus Platform

> Nguồn: [`docs/research/mandatory-features-gap-analysis-2026-08-24.md`](../docs/research/mandatory-features-gap-analysis-2026-08-24.md) (đã review bởi code-reviewer agent, mọi claim xác minh bằng source)
> Import: 2026-08-24 · 20 task (P0 × 4, P1 × 9, P2 × 7) · Sẽ đồng bộ sang Google Sheet task management sau khi authorize Google MCP

## Overview

| Nhóm | Tổng | Todo | In Progress | Review | Done | Blocked |
|------|------|------|-------------|--------|------|---------|
| P0 | 4 | 4 | 0 | 0 | 0 | 0 |
| P1 | 9 | 9 | 0 | 0 | 0 | 0 |
| P2 | 7 | 7 | 0 | 0 | 0 | 0 |
| **Tổng** | **20** | **20** | 0 | 0 | 0 | 0 |

## Master Tracking Table

| ID | Tên task | Priority | Category | Status | Assignee | Hạn dự kiến | Evidence / Tham chiếu | Acceptance / Phạm vi | Ghi chú |
|----|----------|----------|----------|--------|----------|-------------|----------------------|----------------------|---------|
| GA-01 | Fix luồng quên mật khẩu (chuyển sang emailOTP flow + tạo trang reset) | P0 | Account | Todo | | | `auth.ts:117-121` (thiếu sendResetPassword → RESET_PASSWORD_DISABLED); `forgot-password/page.tsx:35-38`; `password.mjs:42-46` | UI gọi `emailOtp.requestPasswordReset` + trang nhập OTP + mật khẩu mới; không đụng DB | Server đã có sẵn OTP reset flow (`auth.ts:30-35`) |
| GA-02 | Xác minh code + chốt intake flow (case kẹt `intake_ready` khi thanh toán trước khi nộp) | P0 | UX | Todo | | | `docs/flows/intake-flow.md` ⚠; `docs/research/brainstorm-2026-08-21-flow-confusion-intake-payment-credit.md` | Verify `intake_ready` trong `case-transition.service.ts` → chốt Q1–Q5 → case đã trả tiền phải lên được `submitted` | Cần quyết định Q1–Q5; PR #19 chưa merge; bằng chứng ở tầng tài liệu — phải xác minh code trước |
| GA-03 | Rate limit + lockout đăng nhập | P0 | Security | Todo | | | `index.ts` (không có rate limiter); `auth.ts:164-165` (chỉ rate limit OTP) | Rate limit global/IP cho sign-in + lockout 3–5 lần sai đếm theo tài khoản | OWASP Authentication Cheat Sheet |
| GA-04 | Xóa tài khoản / yêu cầu xóa dữ liệu cá nhân | P0 | Legal | Todo | | | `admin.routes.ts:48-50` (chỉ ban/unban); không có endpoint delete user tầng app | Endpoint xóa tài khoản xử lý cascade (case/wallet/deposit) HOẶC quy trình yêu cầu xóa thủ công trong 72h | NĐ 13/2023/NĐ-CP — quyền xóa trong 72h |
| GA-05 | Avatar upload | P1 | Account | Todo | | | `ProfileInfoForm.tsx:45-51` (nút "Đổi ảnh" chỉ toast "đang phát triển") | UI upload ảnh + endpoint update image tầng app | Không có API update image hiện tại |
| GA-06 | UI quản lý session/thiết bị | P1 | Security | Todo | | | `settings-nav.ts:9-12` (chỉ 2 mục); `useProfileMutations.ts:36` (chỉ revokeOtherSessions ẩn) | Trang liệt kê session (ip/user_agent) + revoke từng session | Session model đã có ip_address/user_agent (`auth.ts:86-87`) |
| GA-07 | Chính sách session timeout (absolute/idle) | P1 | Security | Todo | | | `auth.ts:79-90` (session config chỉ map fields) | Cấu hình expiresIn/inactivity policy cho Better Auth | OWASP Session Management |
| GA-08 | Notification preferences | P1 | Notification | Todo | | | Không có trang/endpoint preference; settings-nav chỉ 2 mục | Bật/tắt thông báo theo loại + kênh (in-app/email/Telegram) | Tránh notification fatigue |
| GA-09 | Pagination/search server-side cho case list + admin cases | P1 | Admin | Todo | | | `list-cases.usecase.ts:3-5` (findManyCasesByRole không pagination/search); `list-admin-cases.usecase.ts:13-39` (chỉ stage/internal_status/limit) | Offset/page + text search (case_code, tên) + sort server-side | Sẽ vỡ khi số case tăng |
| GA-10 | Export CSV/Excel cho admin | P1 | Admin | Todo | | | Không có endpoint export, không có thư viện csv/xlsx | Export danh sách case/deposit/transactions theo filter | Phục vụ đối soát |
| GA-11 | User-facing data export | P1 | Legal | Todo | | | Không có endpoint "download my data" | Người dùng tự tải dữ liệu cá nhân của mình | NĐ 13/2023 Điều 9 — quyền truy cập/cung cấp dữ liệu |
| GA-12 | ToS/Privacy Policy thật + ghi nhận consent | P1 | Legal | Todo | | | `AuthPanel.tsx:417-424` (checkbox terms không link văn bản) | Trang ToS/Privacy thật + link từ checkbox + lưu phiên bản consent | NĐ 13/2023 — căn cứ pháp lý xử lý dữ liệu |
| GA-13 | 2FA cho admin/supporter | P1 | Security | Todo | | | `auth.ts:69` (map field) + `auth.ts:157-177` (không cài twoFactor plugin) | Cài twoFactor plugin + UI setup TOTP; bắt buộc cho admin/supporter | Admin duyệt deposit là điểm chẹn tiền |
| GA-14 | Rút tiền thủ công khỏi ví | P2 | Wallet | Todo | | | `wallet.routes.ts` (chỉ balance/history/purchase-credits/topups-410) | Route user-initiated withdrawal + quy trình duyệt | Liên quan pháp lý thanh toán — chốt policy trước |
| GA-15 | Policy credit mở: hết hạn / refund / chuyển credit | P2 | Wallet | Todo | | | `docs/backlog/credit-du-tru-account-level.md` §7 | Chốt: credit hết hạn không? refund policy? chuyển credit giữa user? | Open questions — cần quyết định |
| GA-16 | Taxonomy chưa khóa: lý do đóng case, auto-priority, giới hạn gói free team-fit | P2 | Admin | Todo | | | `docs/flows/case-lifecycle-flow.md`, `admin-triage-and-assignment-flow.md`, `team-fit-flow.md` | Chốt danh sách lý do đóng case + rule auto-priority + số lần tối đa gói free | |
| GA-17 | CSRF tầng app + hạ tầng rate limit bền vững | P2 | Security | Todo | | | `sepay.routes.ts:7` (webhook không rate limit); `index.ts:78` (idempotency memoryStore); `message-send-rate-limit.ts:2` (in-memory) | CSRF middleware/xác nhận SameSite; rate limit SePay webhook; idempotency + rate limit không mất khi restart (multi-instance) | |
| GA-18 | Cleanup deprecated + dead code | P2 | Infra | Todo | | | `schema.prisma` (@deprecated WalletTopup/Payment); `payments/page.tsx:9-11` (redirect); useMyPayments/PaymentHistoryList không import | Archive 2 model deprecated; bỏ dead code deposit; xử lý RESEND_API_KEY fail-fast cứng | |
| GA-19 | Chat unread-per-user | P2 | Chat | Todo | | | `case/[id]/page.tsx:113` (messages?.length = tổng số tin) | Unread count theo user thay vì tổng số tin | Nice-to-have |
| GA-20 | Backup tự động (scheduled + RPO) | P2 | Infra | Todo | | | `docs/db-backup-guide.md` (chỉ guide thủ công) | Scheduled pg_dump + RPO rõ ràng + test restore | Hệ thống giữ dữ liệu tài chính |

## Execution Order (khuyến nghị)

1. **GA-01** — fix quên mật khẩu (impact lớn nhất, fix nhỏ nhất, không đụng DB).
2. **GA-02** — xác minh code trạng thái `intake_ready` → chốt intake flow (cần quyết định Q1–Q5).
3. **GA-03** — rate limit + lockout đăng nhập.
4. **GA-04** — xóa tài khoản + **GA-13** — 2FA admin/supporter + **GA-07** — session timeout (nhóm bảo mật tài khoản).
5. **GA-12** — ToS/Privacy + consent + **GA-11** — user data export (nhóm tuân thủ NĐ 13/2023).
6. P1 còn lại: **GA-05** avatar → **GA-06** session UI → **GA-09** pagination/search → **GA-10** export CSV → **GA-08** notification preferences.

## Conventions

1. **Nguồn sự thật** là bảng trên — mọi cập nhật trạng thái sửa ở đây (và sheet khi đã đồng bộ).
2. **Ai cập nhật:** Assignee cập nhật status + evidence task của mình; leader rà lại trước mỗi họp (1 lần/tuần).
3. **Status flow:** `Todo` → `In Progress` (khi có branch/commit thật) → `Review` (khi mở PR, điền link vào Evidence) → `Done` (CHỈ khi PR merged + verify xong, không tự tick) → `Blocked` (kẹt >1 ngày hoặc cần quyết định — ghi lý do vào Ghi chú, nêu trong họp).
4. **Assignee:** 1 tên duy nhất chịu trách nhiệm chính; để trống = chưa ai nhận, chốt trong họp.
5. **Evidence:** task `Done` phải có ≥1 link (PR/commit/doc) — không link = chưa hoàn thành.
6. **Priority:** P0 chặn release / vi phạm pháp lý → ưu tiên tuyệt đối, không trễ quá 1 sprint; P1 trong kế hoạch học kỳ; P2 làm khi rảnh, không cam kết hạn.
7. **Sort:** luôn giữ P0 trước rồi ID; ID cố định GA-01…GA-20, không đổi khi sắp xếp.
