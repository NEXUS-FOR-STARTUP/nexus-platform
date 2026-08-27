# Tóm tắt codebase

_Cập nhật: 2026-08-27. Tổng hợp từ codebase hiện tại và docs canonical trong `docs/`._

## Repo này là gì

Turborepo monorepo cho Nexus Platform, đóng gói workflow `student -> admin -> supporter` quanh `Hồ sơ phản biện`, tài liệu minh chứng, báo cáo phản biện, và các vòng sửa.

Công cụ hỗ trợ: **CodeGraph** (`.codegraph/`) — index code symbol, call path, blast radius. Dùng `codegraph_explore` trước grep/read. **Agent rules** (`.agents/rules/`) — 6 file hướng dẫn development, documentation, orchestration, workflow, migration safety.

## Khu vực chính

### `apps/api` (148 files src, ~15,300 LOC)

Backend Hono với:
- modules: cases (24 routes: triage, details, messages, chat/read, chat/unread, settings, status, intake, v.v.), admin (19 routes: case triage, documents, stats, packages, service-types, users), payments (2 routes: proof + sepay-webhook), reports (4 routes), supporter (4 routes), notifications (5 routes: list, unread-count, read, read-all, SSE stream), realtime (2 routes: connection-token, cases/:caseId/subscribe-token), ai-engine (2 routes), packages (2 routes), documents (1 route), wallet (4 routes: balance, history, purchase-credits [deprecated], topups [410 GONE]), deposits (5 routes), orders (3 routes), profile (2 routes: avatar, account deletion), system (4 routes: `/`, `/health`, `/stream`, `/session`)
- shared infra: AppError, requireAuth, requireCaseAccess, audit-logger, **event-bus + domain-events** (14 event types) + **outbox pattern** cho notifications
- services: Cloudinary (file upload), Google Generative AI
- ~83 API endpoints (79 module routes + 4 system), Hono + Better Auth + Prisma 7 + Vercel AI SDK
- Kiến trúc: modular monolith + Clean Architecture (domain/application/infrastructure/presentation)
- Auth: Better Auth (email/password, Google OAuth, admin plugin)
- DB: Prisma + PostgreSQL, PgBouncer adapter
- Imports: ESM với `.js` suffix

### `apps/web-1` (127 files, ~16,800 LOC)

Next.js 16.2.0 product app với:
- 3 persona surfaces: Student (dashboard + case workspace), Supporter (case workspace + output upload), Admin (triage dashboard + package management)
- Data fetching: TanStack Query + Axios; polling (10s case details; chat realtime Centrifugo + REST polling 60s fallback)
- Forms: TanStack Form everywhere
- Auth: Better Auth client (`useSession`), role-based layout guards
- State: server state qua TanStack Query, không Redux/Zustand
- Pages: landing (`/`), auth (`/auth`), dashboard (`/dashboard`), intake (`/dashboard/intake` — trang riêng, submit/resubmit), team-fit (`/dashboard/team-fit`), case workspace (`/dashboard/case/[id]`), payment (`/dashboard/payment`), wallet (`/dashboard/wallet` — số dư VND, lịch sử giao dịch, nạp tiền SePay), settings (`/dashboard/settings` — Thông tin cơ bản `/dashboard/settings/profile` + Đổi mật khẩu `/dashboard/settings/password`, sidebar pattern Facebook; route cũ `/dashboard/profile` → redirect), admin (`/admin`), supporter (`/supporter`)
- UI: Mantine UI v9, Lucide React, Recharts, TipTap, Tailwind CSS v4
- Port: 3001

### `packages/` (3 packages)

| Package | Mô tả |
|---------|-------|
| `validation` | Zod schemas (IdeaInput, TeamMemberInput, TeamFitInput, Cp1IntakeSchema, …) — shared giữa api và web-1 |
| `eslint-config` | 3 ESLint 9 flat configs (base, next.js, react-internal) |
| `typescript-config` | 3 tsconfig presets (base, nextjs, react-library) |

### `prisma/schema.prisma`

30 models: 5 auth (User, Session, Account, Verification, TwoFactor) + 25 business (ServicePackage, ServiceType, ServicePricing, UserWallet, WalletTransaction, WalletTopup [deprecated], Deposit, Order, OrderItem, DomainEventOutbox, Case, CaseMember, Checkpoint, LifecycleUnit, DocumentRecord, DocumentType, Report, Payment [deprecated], CaseMessage, CaseEvent, AiJob, TeamFitReport, CreditLedger, Notification, NotificationOutbox). 23 migrations (mới nhất: `20260819171456_case_messages_pagination_index`).

> Ghi chú: migration `20260722000000_add_audit_rounds` vẫn còn trong lịch sử migrations (tạo bảng `audit_rounds`), nhưng model `AuditRound` không còn trong schema hiện tại — luồng vòng sửa đã chuyển sang stage-based + credit ledger. Mọi tham chiếu tài liệu tới model `AuditRound` là stale.

## Tài liệu chính trong `docs/`

- `project-context.md` — business context canonical
- `project-overview-pdr.md` — MVP demo realignment PDR
- `system-architecture.md` — architecture hiện trạng
- `code-standards.md` — chuẩn code và conventions
- `codebase-summary.md` — tóm tắt codebase (file này)
- `db-query-guide.md` — hướng dẫn truy vấn DB an toàn
- `realtime-centrifugo-guide.md` — vận hành & troubleshooting realtime chat Centrifugo
- `shared-validation-convention.md` — quy ước zod/entity dùng chung FE↔BE
- `db-backup-guide.md` — hướng dẫn backup DB
- `AGENTS.md` — hướng dẫn agent cho `docs/`
- `README.md` — navigation docs
- `prd/`, `flows/`, `requirements/`, `technical-notes/` — canonical product docs
- `journals/` — journal entries (24 files, 2026-06-29 → 2026-08-21)
- `ai-rules/` — AI documentation rules
- `archive/` — legacy reference
- `nexus-document/` — tài liệu nguồn học thuật & vận hành

## Verified MVP surfaces

- Student/supporter case workspace cùng bám shared shell (`WorkspaceSidebar`, `WorkspaceTabs`).
- `DocumentWorkspace` là bề mặt first-class với checkpoint selector và các tab `overview`, `documents`, `external-feedback`.
- `TabDiscussionChat` fetch + send message qua REST; realtime qua Centrifugo (WebSocket primary, per-sub token, dedup theo message id), REST polling 60s fallback khi Centrifugo down.
- Unread chat per user (GA-19, 2026-08-27): model `CaseChatReadState` (`case_chat_read_states`, unique `case_id` + `user_id`, index kép `case_id, last_read_at`), API `POST /api/cases/:id/chat/read` và `GET /api/cases/:id/chat/unread`, event Centrifugo `chat:read`, hook `useCaseUnreadCount` (reconnect sync qua `client.on("connected")` + `refetchOnWindowFocus`), `WorkspaceSidebar` badge hiển thị chính xác số tin chưa đọc thay vì tổng số tin nhắn.
- `ActivityTimeline` render `caseData.events`.
- `useCaseDetails` polling 10 giây expose `case`, `intake_snapshot`, `latest_report`, `document_board_sections`, `round_history`, `document_workspace`, v.v.
- Stage-based case flow: `user_facing_stage` (intake_pending → intake_ready → submitted → need_more_information → under_review → report_ready → waiting_for_revision → revision_submitted → completed/rejected/closed) + `internal_status` (XState v5 case-machine transitions) + `allowed_transitions` + SLA `sla_deadline_at`. UI: `CaseStatusHeader`, `StatusGuidanceCard`, `CaseOverviewPanel`.
- Credit/ledger economy: `CreditLedger` model, `CreditPanel`, `CreditQuantityModal`, `CreditActions`, `CreditTransactionHistory`, `CreditBalanceCard`; backend `NO_CREDITS` (402), events `credit_used`/`credits_purchased`, admin veto-with-refund, sepay webhook, price 39,000 VND/credit.
- Document upload: `StudentDocumentUploadModal`, `ExternalFeedbackUploadModal`, `SupporterOutputUploadModal`.
- Intake: trang riêng (`apps/web-1/app/dashboard/intake/page.tsx`) với submit/resubmit, hybrid Drive/Docs URL + checklist, template helper. Demo presets + `DemoDataFAB` (components/ui/DemoDataFAB.tsx).
- Team-fit: `apps/web-1/app/dashboard/team-fit/` (IdeaMadLibsStep, TeamInputStep, TeamFitResultStep) + API `/ai-engine/team-fit` và `/ai-engine/team-fit/save`.
- Admin: `AdminCaseDetailModal`, Settings/Packages panel với Price Locking và Pricing Change Audit Trail.
- Notifications (2026-08-07): module notifications 5 endpoints + SSE stream `/api/notifications/stream`; event bus `shared/domain/domain-events.ts` + `shared/infrastructure/event-bus.ts`; outbox pattern (NotificationOutbox); frontend `useNotifications` + `NotificationBell` (SSE + TanStack Query). Env mới: RESEND_*, TELEGRAM_*, NOTIFICATIONS_ENABLED. Types/validation dùng chung FE↔BE qua `@repo/validation` (NOTIFICATION_TYPES, NotificationItemSchema, ListNotificationsResponseSchema); Telegram admin alert trên `payment.verified`.
- Realtime chat (2026-08-08, nâng cấp GA-19 2026-08-27): module realtime 2 endpoints (`/api/realtime/connection-token`, `/api/realtime/cases/:caseId/subscribe-token`); Centrifugo v6 transport, HS256 JWT 15min, channel `chat:{caseId}`; fire-and-forget publish sau insert message (`type: "message"`) và mark-as-read (`type: "chat:read"`); frontend `useRealtimeChat` + `useCaseUnreadCount` + `centrifuge-client` singleton. Env: CENTRIFUGO_URL, CENTRIFUGO_TOKEN_SECRET, CENTRIFUGO_API_KEY, NEXT_PUBLIC_CENTRIFUGO_URL. Ops: `docs/realtime-centrifugo-guide.md`.
- Pricing logic tập trung: `getCaseEffectivePrice`, `formatPrice`, `caseRequiresPayment`, `validatePaymentProof` trong `@/lib/pricing.ts`.
- Wallet VND (2026-08-11): backend `apps/api/src/modules/wallet/` — `GET /api/wallet/balance`, `GET /api/wallet/history` là live; `POST /api/wallet/topups` → **410 GONE** ("Tạo mã nạp tiền tại POST /api/deposits"); `POST /api/wallet/purchase-credits` **deprecated 2026-08-12**. Top-up thuộc module **deposits** (5 routes: `GET /api/deposits/admin/all`, `GET /api/deposits`, `POST /api/deposits`, `GET /api/deposits/:id`, `POST /api/deposits/:id/verify`); mua credit/order thuộc module **orders** (3 routes). Prisma `UserWallet` (cached `balance`, currency VND) + `WalletTransaction` (immutable ledger, `balance_before`/`balance_after`); `WalletTopup` `@deprecated`. Frontend: trang `/dashboard/wallet` (`WalletBalanceCard`, `WalletTransactionList`, `WalletTransactionItem`, `WalletTopupModal` — nay tạo deposit); nav item "Ví của tôi" (icon Wallet) trong `DashboardShell` cho student; hooks `useWalletBalance`/`useWalletHistory`/`useCreateDeposit` (`app/dashboard/wallet/hooks/useWallet.ts`, query key `["wallet", ...]`).
- Settings, Profile & UserMenu modal (2026-08-13, spec F07 `docs/requirements/settings-sidebar-and-profile.md`, cập nhật GA05 2026-08-27): khu vực `/dashboard/settings` — nested layout sidebar (pattern Facebook): `/dashboard/settings` → redirect profile, `/dashboard/settings/profile` (Thông tin cơ bản: tên hiển thị + email là `TextInput disabled` + avatar "Đổi ảnh" upload Cloudinary `nexus-platform/avatars`, giới hạn 2MB/MIME validation, rollback khi lỗi DB, refetch session tức thì trên Settings & Navbar UserMenu), `/dashboard/settings/password` (Đổi mật khẩu, `revokeOtherSessions: true`; ghi chú dài → Tooltip). Route cũ `/dashboard/profile` → redirect stub. Backend module `profile` (`POST /api/profile/avatar`, `DELETE /api/profile/account`). Avatar trong `DashboardShell` mở Mantine `Popover` (`components/layout/_components/UserMenu.tsx`, `position="bottom-end"` neo dưới avatar, thay dropdown cũ): dòng email xem nhanh (mọi role, phân biệt tài khoản) + dòng số dư ví compact (student) + options + Đăng xuất tách biệt — student: Hồ sơ/Thanh toán/Cài đặt; admin/supporter: workspace link (bỏ info block to: avatar lớn, tên, role badge — 2026-08-13). Hook `useProfileMutations` (`app/dashboard/settings/hooks/`); `lib/auth-errors.ts` `translateAuthError` dùng chung. `DashboardShell` 200 → 60 dòng.

## Ràng buộc vận hành

- Một root `.env` duy nhất.
- API sở hữu auth và session.
- Runtime DB: `DATABASE_URL` + `DIRECT_URL`; read-only query script dùng `READONLY_DATABASE_URL` (xem `docs/db-query-guide.md`).
- Prisma: plural table names + snake_case columns.
- Web: Mantine UI v9, App Router, Tailwind CSS v4.
- Code: TypeScript ESM, `.js` suffix trong relative imports.
- Docs: bám code hiện tại, ghi rõ code-confirmed vs deferred.
