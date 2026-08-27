# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Quên mật khẩu bằng OTP (GA-01)**: Trang `/auth/reset-password` hỗ trợ đặt lại mật khẩu với email và mã OTP 6 số (prefill email từ `sessionStorage`), kèm cơ chế đếm ngược gửi lại mã OTP.
- **Tải lên ảnh đại diện (GA-05)**: API `POST /api/profile/avatar` tiếp nhận và upload ảnh đại diện lên Cloudinary trực tiếp từ server (ghi URL vào `User.image`), giao diện hỗ trợ xem trước và kiểm tra định dạng ảnh.
- **Tự động tạo ví & ví an toàn (GA-22)**: Khởi tạo ví rỗng cho người dùng mới qua Better Auth hook `databaseHooks.user.create.after`; áp dụng cơ chế `getOrCreateWalletInTx` xuyên suốt các luồng nạp, rút, hoàn tiền, thanh toán đơn hàng (trả về `InsufficientBalance` thay vì lỗi `WALLET_NOT_FOUND`).
- **Chống nạp tiền trùng lặp**: Hỗ trợ `idempotency_key` cho `POST /deposits` và khóa nút bấm trên client để ngăn chặn double-submit tạo mã nạp tiền.
- **Phân trang & Lọc hồ sơ (GA-09)**: Phân trang, tìm kiếm và sắp xếp server-side cho danh sách Case (`GET /cases`); cung cấp component dùng chung `CaseListFilters` (sinh viên lọc theo `user_facing_stage`, supporter lọc theo `internal_status`).
- **Xuất CSV dữ liệu Admin (GA-10)**: API và giao diện menu `AdminExportMenu` xuất CSV cho 4 phân hệ (`cases`, `deposits`, `transactions`, `orders`).
- **Cải tiến UX ví & Biên lai nạp tiền (PR #23)**: Banner cảnh báo các khoản nạp tiền đang ở trạng thái chờ duyệt trên trang ví; quản lý và xem trước ảnh biên lai chuyển khoản đặt trong modal chi tiết nạp tiền; tự động dọn dẹp file ảnh biên lai mồ côi nếu transaction ghi database thất bại.
- **Financial domain refactor**: Module `deposits` (`POST /api/deposits`, `POST /api/deposits/:id/verify`) và module `orders` (`POST /api/orders`); cờ tính năng dual-write `DUAL_WRITE_WALLET_TOPUP`, `DUAL_WRITE_PAYMENT`; tài liệu hướng dẫn migration SQL (`docs/financial-domain-migration-sql.md`).
- **Bắt buộc xác minh email OTP**: OTP 6 số qua Resend trước khi đăng nhập (hết hạn 300s, rate-limit 3/60s), trang `/auth/verify-email`.
- **Completion flow**: `T17_USER_CONFIRM_COMPLETE` (sinh viên xác nhận hoàn thành), `T19_REOPEN` (mua credit khi case đã `done` → chuyển sang `under_review`, kích hoạt lại SLA 48h), tự động hoàn tất sau 7 ngày (`T14 ADMIN`).
- **Document model & Intake caps**: Phân loại danh mục tài liệu trong `metadata_json.category`, soft-supersede qua `superseded_at`, giới hạn tối đa 10 tài liệu cho intake và giới hạn độ dài ký tự (`Cp1IntakeCaps`).
- **Refund credit dư**: Hoàn tiền VND về ví theo giá mua thực tế (FIFO walk DESC), hỗ trợ idempotency `refund-credit-{caseId}`.
- **Realtime**: Sự kiện `case_deleted` trên kênh `chat:{caseId}` khi admin xóa hồ sơ.

### Changed
- **Quên mật khẩu**: Tuyến `/auth/forgot-password` chuyển sang gọi `emailOtp.requestPasswordReset` qua OTP thay cho link reset.
- **Session Better Auth**: Cấu hình rolling session tường minh (`expiresIn` 7 ngày, `updateAge` 1 ngày).
- **Lịch sử giao dịch ví**: Hợp nhất toàn bộ giao dịch vào một sổ cái duy nhất trên trang `/wallet`; khóa tải lên biên lai sau khi yêu cầu nạp tiền không còn ở trạng thái `pending`.
- **Guard T14**: Chuyển quyền đóng hồ sơ từ `isAssignedSupporter` sang `isAdmin` (supporter không được tự đóng case; sinh viên xác nhận qua T17).
- **T6 Reassign**: Giữ nguyên đếm tiếp SLA khi supporter tự phân công lại ở trạng thái `supporter_working` / `report_ready_to_publish`.
- **Thông báo hết credit**: T11/T3 trả mã lỗi 402 `NO_CREDITS` rõ ràng thay cho 400 generic; `subtractCredit` no-op khi `lockedPrice === 0` (case miễn phí).
- **Admin Case Queue**: Tách bucket `intake_pending` ("Chờ sinh viên nộp hồ sơ"); hiển thị empty-state khi `intake_snapshot = null` và vô hiệu hóa nút duyệt/từ chối.
- **Auto Refresh Admin**: Các trang Admin tự động làm mới dữ liệu mỗi 10 giây qua `refetchInterval`.
- **Khóa duyệt hồ sơ**: Chặn duyệt hồ sơ (T5_ACCEPT) khi trạng thái thanh toán chưa phải `paid` hoặc `not_required`.

### Deprecated
- Model `WalletTopup`, `Payment` và các use case liên quan được đánh dấu `@deprecated` trong schema và codebase (thay thế bằng module `deposits` và `orders`).

### Removed
- Tuyến đóng case trực tiếp của supporter (bypass state machine, không guard).
- 6 legacy payment endpoints returning 410 Gone (`POST /api/wallet/topups`, `POST /api/payments`, `GET /api/payments`, `GET /api/payments/my`, `GET /api/payments/:id`, `POST /api/payments/proof`, `POST /api/payments/:id/verify`).

### Fixed
- **Intake Flow (GA-02)**: Sửa triệt để lỗi hồ sơ bị kẹt ở trạng thái `intake_ready` sau khi thanh toán; thực thi bất biến Single-Writer cho `user_facing_stage`; payment webhook chỉ ghi nhận trạng thái `payment_status` chứ không đổi stage.
- **SLA Reset & Overdue**: Sửa action T6 `resetSlaIfOverdue` — chỉ gia hạn `now + 48h` nếu `sla_deadline_at <= now` (đã quá hạn); nếu còn hạn thì giữ nguyên; A→A khi quá hạn chỉ ghi lại deadline.
- **Admin Dashboard SLA & Doanh thu**: Tính doanh thu dựa trên các đơn hàng đã thanh toán (`paid`); đếm chính xác số lượng hồ sơ đang xử lý bị quá hạn SLA; format hiển thị thời gian còn lại `1d 23h` (khi > 24h) và `Xh Ym` (khi ≤ 24h).
- **Rate limiting /auth/get-session**: Loại trừ `/auth/get-session` khỏi bộ lọc rate limit auth để tránh lỗi 429 khi client tự động polling session.
- **Realtime chat slot TTL**: Cấu hình TTL dọn dẹp bộ nhớ đệm cho cơ chế rate limit chat 1 tin/giây/user.
- **Chat input**: Chặn phím Enter khi tin nhắn đang gửi (`isSending`).
- **Notification**: Emit đúng `caseCode` từ `case_code` thay vì chỉ có `caseId` gây ra hiển thị `Case undefined`; bổ sung tên supporter trong thông báo Telegram phân công.
- **Unit tests & Mock DB**: Tách mock database độc lập cho `listCases` test, bổ sung test suites hoàn chỉnh cho `payForOrder` và deposit idempotency.
- **Tài liệu intake**: Bỏ "tài liệu chính", category codes, soft-supersede để sinh viên chỉ thấy bộ tài liệu mới nhất đã được duyệt.

### Security
- Bổ sung cấu hình `emailAndPassword.revokeSessionsOnPasswordReset: true` — thu hồi và hủy toàn bộ phiên đăng nhập cũ sau khi đổi mật khẩu qua OTP.
- Kích hoạt rate limiting 3 requests/60s trên các endpoint xác thực của Better Auth.

## [1.1.0] - 2026-08-09

### Added
- Notification system: in-app + email + Telegram delivery, read/badge state, notification bell
- Telegram admin group alert on `payment.verified` events — case thanh toán xong, sẵn sàng triage (admin recipient fan-out trong `recipients.ts` + `adminBody`/`adminLink` template trong `notification-templates.ts`)
- Realtime chat powered by Centrifugo v6 (websocket proxy, env-driven `allowed_origins`, dev port 8081)
- Transfer content column in admin payment verification table

### Changed
- Notifications types/validation shared via `@repo/validation` (single source of truth FE↔BE)
- Entity types migrated to `@repo/validation`: ServicePackage, User, TeamFitReport, Cp1Intake (Zod, 100% parity)
- CI triggers extended to `dev` and `staging` branches
- Centrifugo config environment-driven instead of hardcoded

### Fixed
- Notification coverage gaps: read/badge state, links in notifications
- Raw relative link dropped from Telegram messages
- Telegram disabled treated as delivery failure (not silent success)
- Notification bell keyboard accessibility + SSE ping event listener
- Centrifugo env placeholder missing closing quote
- Removed 12 unused dependencies; deleted dead tracked files and dead exports

### Removed
- 12 unused dependencies
- Dead tracked files, dead exports; `getSession` helper deduplicated

## [1.0.0] - 2026-08-03

### Added
- Unified status workflow engine (symflow): 8 case states aligned with VALID_INTERNAL_STATUSES, guarded transitions across 7 use cases
- Dedicated intake form page with submit and resubmit flow
- CaseOverviewPanel for structured case dashboard display
- CaseStatusHeader replacing the hero banner on case pages
- Case rejection reason display and resubmit after rejection
- Case profile settings editing (student-facing)
- Demo data preset with DemoDataFAB for quick demonstration
- Data migration script to fix invalid internal_status values
- Deploy log documentation and mandatory logging step in docker guide

### Changed
- Symflow places redefined: 8 places, 8 transitions matching VALID_INTERNAL_STATUSES
- Default case internal_status changed to `triage_pending`
- Credit tab always visible in sidebar across all case stages
- Team-fit navigation and member card UI refreshed
- Dashboard sidebar enlarged with role guard; admin/supporter content no longer flashes before redirect
- TanStack devtools disabled in production
- Case data refreshes on navigation (staleTime 0s, query invalidation)
- Badge sizes bumped one level across web components
- Admin case table header paginates dynamically per subtab
- Supporter tab filters use valid internal_status, adding `report_ready_to_publish` tab
- Case profile edits routed to intake form

### Fixed
- AI engine creating cases with wrong status (`triage_pending` now set on creation)
- Revision upload gating by case stage
- Migration script dotenv path and PrismaPg adapter usage
- Admin case detail cache not invalidated after mutations
- Supporter assignment not restricted properly
- Intake form not hydrating saved case profiles
- SLA timer visible to users (comment out for MVP)

## [0.0.1] - 2026-07-28

### Added

**Authentication & User Management**
- Email/password authentication with Better Auth
- Google OAuth integration
- Session management with role-based access control (student, admin, supporter)
- Forgot password flow

**Team-Idea Fit (Free Assessment)**
- MadLibs-style idea input wizard with team member cards
- AI-powered team-fit evaluation engine
- Save and upgrade flow with redirect to case detail
- Validation schemas for team-fit input

**Intake Stage-Based Flow**
- Three-stage pipeline: `intake_pending` → `intake_ready` → `submitted`
- Team-fit save creates case at `intake_pending` with payment CTA
- Payment verification triggers `intake_ready` transition
- Intake form submission transitions to `submitted`
- Stage-gated tab visibility in workspace sidebar
- StatusGuidanceCard with contextual CTAs per stage

**Case Workspace**
- Case detail page with stage-based rendering
- CaseOverviewPanel with badge color mapping
- Activity timeline with event history
- Messaging with supporter (chat tab)
- Document upload and management
- Credit balance panel and transaction history

**Payment Pipeline**
- SePay webhook handler for auto-verification
- Manual payment verification by admin
- Payment proof upload with Cloudinary
- Payment transparency (payer name, bank transaction fields)
- Credit ledger with atomic debit and balance tracking
- Credit purchase via quantity modal
- Idempotency-Key support for payment operations
- Admin payment approval modal

**Admin Dashboard**
- Stats dashboard with case counts, revenue, conversion rate
- Package price configuration settings
- Payment verification table and approval
- Case assignment and detail modals
- Case triage (accept/reject/assign supporter)
- **Admin Package Price Configuration (F07):** Backend API (`PUT /api/admin/packages/:id/price`) and admin console UI for dynamic package pricing using Mantine UI components

**Supporter Workflow**
- Case acceptance and assignment
- Report generation, editing, and publishing
- Request more information from student
- Revision review and submission tracking
- Document review with external feedback upload

**Infrastructure**
- Turborepo monorepo with 6 packages (API, Web, UI, Validation, ESLint, TypeScript)
- Hono backend with 8 modules, 51 endpoints
- Next.js 16 frontend with Mantine UI v9
- Prisma 7 ORM with PostgreSQL (16 models)
- Better Auth framework (email/password + Google OAuth)
- TanStack Query, Form, and Virtual
- Pino structured logging across all modules
- Cloudinary document/image upload service
- GitHub Actions CI workflow (build + type-check)
- Docker build/deploy for API and Web apps
- Production docker-compose and Makefile

**Documentation**
- Project context and PDR documents
- System architecture and code standards
- DB query, migration, and backup guides
- Docker build and deploy guide
- CI setup guide
- Codebase summary with file structure
- Research logging best practices

[Unreleased]: https://github.com/NEXUS-FOR-STARTUP/nexus-platform/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/NEXUS-FOR-STARTUP/nexus-platform/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/NEXUS-FOR-STARTUP/nexus-platform/compare/v0.0.1...v1.0.0
[0.0.1]: https://github.com/NEXUS-FOR-STARTUP/nexus-platform/releases/tag/v0.0.1
