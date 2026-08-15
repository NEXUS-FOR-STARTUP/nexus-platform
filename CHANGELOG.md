# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 2026-08-16 — Backlog bugs fix (8 bugs: #1 #3 #5 #9 #12 #13 #14 #16)

**Added**
- Completion flow: T17_USER_CONFIRM_COMPLETE (user xác nhận hoàn thành, isOwner), T19_REOPEN (mua credit case `done` → `under_review`, re-arm SLA 48h), auto-done 7 ngày (daily sweep neo latest T11, fire T14 ADMIN)
- Document model: category codes (`idea_report`/`pitch_deck`/`competitor_analysis`/`customer_research`/`task_assignment`/`other`) vào `metadata_json.category`, soft-supersede `superseded_at` (index `[case_id, superseded_at]`), `unit_code` `intake` → `v00`
- Intake caps: max 10 tài liệu (intake-only) + text caps (≤100/≤254/≤20000 theo field) — `Cp1IntakeCaps`
- Refund credit dư: hoàn VND về ví theo giá mua thực tế (walk DESC), idempotency `refund-credit-{caseId}`
- Realtime `case_deleted` trên kênh `chat:{caseId}` khi admin xóa case

**Changed**
- T14 guard: isAssignedSupporter → **isAdmin** (supporter không còn tự close; user confirm qua T17)
- T6 self-loop cho reassign ở `supporter_working`/`report_ready_to_publish` — SLA đếm tiếp, không reset
- T11/T3 hết credit → 402 `NO_CREDITS` rõ (thay 400 generic); `subtractCredit` no-op khi `lockedPrice === 0` (free case)
- Admin list tách bucket `intake_pending` "Chờ sinh viên nộp hồ sơ"; detail empty-state khi `intake_snapshot = null` (disable approve/reject)
- FE banner credit guidance tại `report_ready` (có credit → guidance; hết credit → đỏ + nút mua)

**Fixed**
- #1 Reassign supporter: SLA đếm tiếp (không reset); refund credit dư FIFO đúng giá mua; idempotent, không hoàn kép
- #3 User không hiểu "lần 2 phải mua credit": banner guidance + 402 NO_CREDITS rõ ràng
- #5 Chưa rõ ai xác nhận hoàn thành: user confirm (T17), admin-only force-close (T14), auto-done 7 ngày, mua credit case done → reopen
- #9 Trả tiền nhưng chưa nộp hồ sơ: admin queue tách bucket, detail empty-state, vô hiệu nút duyệt
- #12 Admin thấy nhiều tài liệu, user thấy 1: bỏ "tài liệu chính", category codes, soft-supersede, user chỉ thấy bộ mới nhất
- #13 Intake spam tài liệu: giới hạn 10 tài liệu
- #14 Intake lưu không giới hạn chữ: caps ≤100/≤254/≤20000
- #16 Không kick khi xóa case: realtime `case_deleted` + FE toast/redirect + poll fallback 404

**Removed**
- Supporter close-case route (bypass machine, không guard)

### Added
- Financial domain refactor: deposits module (POST /api/deposits, POST /api/deposits/:id/verify)
- Financial domain refactor: orders module (POST /api/orders)
- Legacy dual-write feature flags: DUAL_WRITE_WALLET_TOPUP, DUAL_WRITE_PAYMENT
- docs/financial-domain-migration-sql.md — migration SQL for production deployment

### Changed
- POST /api/wallet/topups → 410 Gone (use POST /api/deposits)
- POST /api/payments → 410 Gone (use POST /api/deposits or POST /api/orders)
- GET /api/payments, GET /api/payments/my, GET /api/payments/:id → 410 Gone (use /api/deposits)
- POST /api/payments/proof, POST /api/payments/:id/verify → 410 Gone
- WalletTopup, Payment models marked @deprecated in schema
- Payment, WalletTopup use cases marked @deprecated

### Removed
- Legacy payment routes (6 endpoints) returning 410 Gone

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

[Unreleased]: https://github.com/CHECKPOINT-00/nexus-platform/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/CHECKPOINT-00/nexus-platform/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/CHECKPOINT-00/nexus-platform/compare/v0.0.1...v1.0.0
[0.0.1]: https://github.com/CHECKPOINT-00/nexus-platform/releases/tag/v0.0.1
