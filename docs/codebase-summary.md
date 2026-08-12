# Tóm tắt codebase

_Cập nhật: 2026-08-13. Tổng hợp từ codebase hiện tại và docs canonical trong `docs/`._

## Repo này là gì

Turborepo monorepo cho Nexus Platform, đóng gói workflow `student -> admin -> supporter` quanh `Hồ sơ phản biện`, tài liệu minh chứng, báo cáo phản biện, và các vòng sửa.

Công cụ hỗ trợ: **CodeGraph** (`.codegraph/`) — index code symbol, call path, blast radius. Dùng `codegraph_explore` trước grep/read. **Agent rules** (`.agents/rules/`) — 6 file hướng dẫn development, documentation, orchestration, workflow, migration safety.

## Khu vực chính

### `apps/api` (148 files src, ~15,300 LOC)

Backend Hono với:
- modules: cases (22 routes), admin (20 routes: case triage, documents, stats, packages, service-types, users), payments (7 routes, gồm sepay webhook), reports (4 routes), supporter (5 routes), notifications (5 routes: list, unread-count, read, read-all, SSE stream), realtime (2 routes: connection-token, cases/:caseId/subscribe-token), ai-engine (2 routes), packages (1 route), documents (1 route), wallet (4 routes: balance, history, topups, purchase-credits), system (4 route: `/`, `/health`, `/stream`, `/session`)
- shared infra: AppError, requireAuth, requireCaseAccess, audit-logger, **event-bus + domain-events** (9 event types) + **outbox pattern** cho notifications
- services: Cloudinary (file upload), Google Generative AI
- ~77 API endpoints (73 module routes + 4 system), Hono + Better Auth + Prisma 7 + Vercel AI SDK
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
- Pages: landing (`/`), auth (`/auth`), dashboard (`/dashboard`), intake (`/dashboard/intake` — trang riêng, submit/resubmit), team-fit (`/dashboard/team-fit`), case workspace (`/dashboard/case/[id]`), payment (`/dashboard/payment`), wallet (`/dashboard/wallet` — số dư VND, lịch sử giao dịch, nạp tiền SePay), admin (`/admin`), supporter (`/supporter`)
- UI: Mantine UI v9, Lucide React, Recharts, TipTap, Tailwind CSS v4
- Port: 3001

### `packages/` (4 packages)

| Package | Mô tả |
|---------|-------|
| `ui` | Primitive React components (Button, Card, Code) — placeholder, chưa dùng Mantine |
| `validation` | Zod schemas (IdeaInput, TeamMemberInput, TeamFitInput) — shared giữa api và web-1 |
| `eslint-config` | 3 ESLint 9 flat configs (base, next.js, react-internal) |
| `typescript-config` | 3 tsconfig presets (base, nextjs, react-library) |

### `prisma/schema.prisma`

26 models: 5 auth (User, Session, Account, Verification, TwoFactor) + 21 business (ServicePackage, ServiceType, ServicePricing, UserWallet, WalletTransaction, WalletTopup, Case, CaseMember, Checkpoint, LifecycleUnit, DocumentRecord, DocumentType, Report, Payment, CaseMessage, CaseEvent, AiJob, TeamFitReport, CreditLedger, Notification, NotificationOutbox). 18 migrations (mới nhất: `20260811202613_add_workflow_engine_schema`; wallet + service catalog: `20260811135015_add_wallet_and_service_catalog`).

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
- `journals/` — journal entries (6 files, 2026-07-21)
- `ai-rules/` — AI documentation rules
- `archive/` — legacy reference
- `nexus-document/` — tài liệu nguồn học thuật & vận hành

## Verified MVP surfaces

- Student/supporter case workspace cùng bám shared shell (`WorkspaceSidebar`, `WorkspaceTabs`).
- `DocumentWorkspace` là bề mặt first-class với checkpoint selector và các tab `overview`, `documents`, `external-feedback`.
- `TabDiscussionChat` fetch + send message qua REST; realtime qua Centrifugo (WebSocket primary, per-sub token, dedup theo message id), REST polling 60s fallback khi Centrifugo down.
- `ActivityTimeline` render `caseData.events`.
- `useCaseDetails` polling 10 giây expose `case`, `intake_snapshot`, `latest_report`, `document_board_sections`, `round_history`, `document_workspace`, v.v.
- Stage-based case flow: `user_facing_stage` (intake_pending → intake_ready → submitted → need_more_information → under_review → report_ready → waiting_for_revision → revision_submitted → completed/rejected/closed) + `internal_status` (symflow transitions) + `allowed_transitions` + SLA `sla_deadline_at`. UI: `CaseStatusHeader`, `StatusGuidanceCard`, `CaseOverviewPanel`.
- Credit/ledger economy: `CreditLedger` model, `CreditPanel`, `CreditQuantityModal`, `CreditActions`, `CreditTransactionHistory`, `CreditBalanceCard`; backend `NO_CREDITS` (402), events `credit_used`/`credits_purchased`, admin veto-with-refund, sepay webhook, price 39,000 VND/credit.
- Document upload: `StudentDocumentUploadModal`, `ExternalFeedbackUploadModal`, `SupporterOutputUploadModal`.
- Intake: trang riêng (`apps/web-1/app/dashboard/intake/page.tsx`) với submit/resubmit, hybrid Drive/Docs URL + checklist, template helper. Demo presets + `DemoDataFAB` (components/ui/DemoDataFAB.tsx).
- Team-fit: `apps/web-1/app/dashboard/team-fit/` (IdeaMadLibsStep, TeamInputStep, TeamFitResultStep) + API `/ai-engine/team-fit` và `/ai-engine/team-fit/save`.
- Admin: `AdminCaseDetailModal`, Settings/Packages panel với Price Locking và Pricing Change Audit Trail.
- Notifications (2026-08-07): module notifications 5 endpoints + SSE stream `/api/notifications/stream`; event bus `shared/domain/domain-events.ts` + `shared/infrastructure/event-bus.ts`; outbox pattern (NotificationOutbox); frontend `useNotifications` + `NotificationBell` (SSE + TanStack Query). Env mới: RESEND_*, TELEGRAM_*, NOTIFICATIONS_ENABLED. Types/validation dùng chung FE↔BE qua `@repo/validation` (NOTIFICATION_TYPES, NotificationItemSchema, ListNotificationsResponseSchema); Telegram admin alert trên `payment.verified`.
- Realtime chat (2026-08-08): module realtime 2 endpoints (`/api/realtime/connection-token`, `/api/realtime/cases/:caseId/subscribe-token`); Centrifugo v6 transport, HS256 JWT 15min, channel `chat:{caseId}`; fire-and-forget publish sau insert message; frontend `useRealtimeChat` + `centrifuge-client` singleton. Env: CENTRIFUGO_URL, CENTRIFUGO_TOKEN_SECRET, CENTRIFUGO_API_KEY, NEXT_PUBLIC_CENTRIFUGO_URL. Ops: `docs/realtime-centrifugo-guide.md`.
- Pricing logic tập trung: `getCaseEffectivePrice`, `formatPrice`, `caseRequiresPayment`, `validatePaymentProof` trong `@/lib/pricing.ts`.
- Wallet VND (2026-08-11): backend `apps/api/src/modules/wallet/` 4 routes — `GET /api/wallet/balance`, `GET /api/wallet/history`, `POST /api/wallet/topups` (SePay QR + transfer content, min 10,000 VND), `POST /api/wallet/purchase-credits`; Prisma `UserWallet` (cached `balance`, currency VND) + `WalletTransaction` (immutable ledger, `balance_before`/`balance_after`) + `WalletTopup`. Frontend: trang `/dashboard/wallet` (`WalletBalanceCard`, `WalletTransactionList`, `WalletTransactionItem`, `WalletTopupModal`); nav item "Ví của tôi" (icon Wallet) trong `DashboardShell` cho student; hooks `useWalletBalance`/`useWalletHistory`/`useCreateTopup` (`app/dashboard/wallet/hooks/useWallet.ts`, query key `["wallet", ...]`).

## Ràng buộc vận hành

- Một root `.env` duy nhất.
- API sở hữu auth và session.
- Runtime DB: `DATABASE_URL` + `DIRECT_URL`; read-only query script dùng `READONLY_DATABASE_URL` (xem `docs/db-query-guide.md`).
- Prisma: plural table names + snake_case columns.
- Web: Mantine UI v9, App Router, Tailwind CSS v4.
- Code: TypeScript ESM, `.js` suffix trong relative imports.
- Docs: bám code hiện tại, ghi rõ code-confirmed vs deferred.
