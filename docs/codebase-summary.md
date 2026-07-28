# Tóm tắt codebase

_Cập nhật: 2026-07-23. Tổng hợp từ codebase hiện tại và docs canonical trong `docs/`._

## Repo này là gì

Turborepo monorepo cho Nexus Platform, đóng gói workflow `student -> admin -> supporter` quanh `Hồ sơ phản biện`, tài liệu minh chứng, báo cáo phản biện, và các vòng sửa.

Công cụ hỗ trợ: **CodeGraph** (`.codegraph/`) — index code symbol, call path, blast radius. Dùng `codegraph_explore` trước grep/read. **Agent rules** (`.agents/rules/`) — 6 file hướng dẫn development, documentation, orchestration, workflow, migration safety.

## Khu vực chính

### `apps/api` (112 files, ~9,674 LOC)

Backend Hono với:
- modules: cases (2,446 LOC, 19 routes), documents (1,553 LOC), admin (841 LOC, 12 routes), payments (606 LOC), reports (382 LOC), supporter (213 LOC), ai-engine (379 LOC), packages (94 LOC)
- shared infra: AppError, requireAuth, requireCaseAccess, audit-logger
- services: Cloudinary (file upload), Google Generative AI
- ~47 API endpoints, Hono + Better Auth + Prisma 7 + Vercel AI SDK
- Kiến trúc: modular monolith + Clean Architecture (domain/application/infrastructure/presentation)
- Auth: Better Auth (email/password, Google OAuth, admin plugin)
- DB: Prisma + PostgreSQL, PgBouncer adapter
- Imports: ESM với `.js` suffix

### `apps/web-1` (~115 files, ~8,755 LOC)

Next.js 16.2.0 product app với:
- 3 persona surfaces: Student (dashboard + case workspace), Supporter (case workspace + output upload), Admin (triage dashboard + package management)
- Data fetching: TanStack Query + Axios, polling (10s case details, 5s chat)
- Forms: TanStack Form everywhere
- Auth: Better Auth client (`useSession`), role-based layout guards
- State: server state qua TanStack Query, không Redux/Zustand
- Pages: landing (`/`), auth (`/auth`), dashboard (`/dashboard`), intake (`/dashboard/intake`), team-fit (`/dashboard/team-fit`), case workspace (`/dashboard/case/[id]`), admin (`/admin`), supporter (`/supporter`)
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

16 models (430 lines): 4 auth (User, Session, Account, Verification, TwoFactor) + 12 business (ServicePackage, Case, CaseMember, Checkpoint, LifecycleUnit, DocumentRecord, DocumentType, Report, Payment, AuditRound, CaseMessage, CaseEvent, AiJob, TeamFitReport). 9 migrations.

## Tài liệu chính trong `docs/`

- `project-context.md` — business context canonical
- `project-overview-pdr.md` — MVP demo realignment PDR
- `system-architecture.md` — architecture hiện trạng
- `code-standards.md` — chuẩn code và conventions
- `codebase-summary.md` — tóm tắt codebase (file này)
- `db-query-guide.md` — hướng dẫn truy vấn DB an toàn
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
- `TabDiscussionChat` fetch + send message qua REST và polling 5 giây; chưa có realtime socket.
- `ActivityTimeline` render `caseData.events`; `AuditRoundTimeline` hiển thị lịch sử vòng audit.
- `useCaseDetails` polling 10 giây expose `case`, `intake_snapshot`, `latest_report`, `document_board_sections`, `round_history`, `document_workspace`, v.v.
- Revision rounds: `RevisionSubmitModal` (nộp sửa), `BuyRoundModal` (mua thêm vòng).
- Payment: `PaymentDrawer` (inline), `UnpaidAlertBanner`, `payment/page.tsx` riêng.
- External feedback: `ExternalFeedbackUploadModal`, `SupporterOutputUploadModal`.
- Version selector: `VersionSelector` cho tài liệu workspace.
- Workspace tabs abstract: `TabIdeaContent`, `TabDiscussionChat`, `TabReportFindings`, `TabCaseSettings` với `TabIdeaContent`, `TabReportFindings`.
- Intake: hybrid Drive/Docs URL + checklist, template helper.
- Admin: `AdminCaseDetailModal`, Settings/Packages panel với Price Locking và Pricing Change Audit Trail.
- Pricing logic tập trung: `getCaseEffectivePrice`, `formatPrice`, `caseRequiresPayment`, `validatePaymentProof` trong `@/lib/pricing.ts`.

## Ràng buộc vận hành

- Một root `.env` duy nhất.
- API sở hữu auth và session.
- Runtime DB: `DATABASE_URL` + `DIRECT_URL`; read-only query script dùng `READONLY_DATABASE_URL` (xem `docs/db-query-guide.md`).
- Prisma: plural table names + snake_case columns.
- Web: Mantine UI v9, App Router, Tailwind CSS v4.
- Code: TypeScript ESM, `.js` suffix trong relative imports.
- Docs: bám code hiện tại, ghi rõ code-confirmed vs deferred.
