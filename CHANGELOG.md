# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

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

[Unreleased]: https://github.com/CHECKPOINT-00/nexus-platform/compare/v0.0.1...HEAD
[0.0.1]: https://github.com/CHECKPOINT-00/nexus-platform/releases/tag/v0.0.1
