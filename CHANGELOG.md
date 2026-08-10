# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

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
