# API KNOWLEDGE BASE

## OVERVIEW
Hono backend for monorepo. Handles authentication (Better Auth), database access (Prisma 7), AI job dispatch (BullMQ `omp-queue`), realtime messaging tokens (Centrifugo v6), internal domain events with dual outbox relays, and Typst PDF report compilation.

## STRUCTURE
```
src/
├── index.ts        # Server entry, routes mount, CORS, global error handling
├── auth.ts         # Better Auth configuration & plugins
├── db.ts           # Prisma client wiring & PgBouncer setup
├── env.ts          # Root env loader & validation
├── modules/        # 15 business domain modules
├── shared/         # Cross-cutting domain, errors, middlewares & test infrastructure
├── services/       # External service wrappers (Cloudinary, Google Generative AI)
└── scripts/        # Standalone background relays (Outbox runners)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Server Entry | `src/index.ts` | Hono `app`, route mounts, port `8000` |
| Auth Config | `src/auth.ts` | Better Auth source of truth |
| DB Access | `src/db.ts` | Prisma client singleton with adapter |
| AI Queue Dispatch | `src/modules/cases/infrastructure/omp-eval.service.ts` | BullMQ producer pushing to `omp-queue` |
| PDF Compilation | `src/modules/reports/infrastructure/pdf/` | Typst PDF report engine |
| Domain Events | `src/shared/domain/domain-events.ts` | 14 domain event types + in-memory emitter |
| Outbox Relays | `src/modules/notifications/` & `src/shared/` | NotificationOutbox (2s) & DomainEventOutbox (5s) |
| Realtime Chat | `src/modules/realtime/` | Centrifugo HS256 tokens & channel publish |

## CONVENTIONS
- ESM only. TypeScript relative imports use `.js` extension.
- CORS mounts on `/api/*`, allowing `localhost:3000`, `localhost:3001`, and `https://nexusforstartup.site`.
- Better Auth handler mounts at `/api/auth/*`.
- `/`, `/health`, `/stream`, `/session` are canonical runtime system endpoints.
- Test runner: built-in `node:test` + `node:assert`, run via `bun run --filter nexus-platform-api test`.

## ANTI-PATTERNS
- Add second auth system or move auth verification outside `apps/api`.
- Read env from per-app `.env` files (must use root `.env`).
- Execute direct destructive SQL on production DB (violates `prisma-migration-safety.md`).
- Generate PDF reports inside `apps/worker-omp` (PDF compilation belongs to `apps/api`).
- Suppress types with `as any` without justification.

## COMMANDS
```bash
bun run --filter nexus-platform-api dev         # Watch mode on port 8000
bun run --filter nexus-platform-api build       # TypeScript compile (tsc)
bun run --filter nexus-platform-api check-types # Typecheck without emit
bun run --filter nexus-platform-api test        # Run 48 test files (tsx --test)
```

## 1. MODULE MAP (15 Modules, 112 Endpoints)

| Module | Mount Path | Routes | Auth Policy | Description |
|--------|-----------|--------|-------------|-------------|
| **Cases** | `/api/cases` | 28 | Mixed | Case CRUD, intake, stages, revisions, SSE AI stream, assign, complete |
| **Admin** | `/api/admin` | 26 | Admin only | Case triage, packages, users, worker monitoring KPI & jobs |
| **Reports** | `/api/reports` | 8 | Supporter/Admin | Draft critique, edit, approve, latest, Typst PDF download |
| **Payments** | `/api/payments` | 7 | Mixed | Payment requests, proof upload, verification, SePay webhook |
| **Wallet** | `/api/wallet` | 7 | Authenticated | Balance inquiry, transaction history, lock/unlock credits |
| **Notifications** | `/api/notifications` | 7 | Authenticated | List, unread count, mark read, mark all read, SSE stream, preferences |
| **Deposits** | `/api/deposits` | 6 | Authenticated | Deposit request, status check, transaction pairing |
| **Orders** | `/api/orders` | 6 | Authenticated | Order creation, package unlock, status query |
| **Supporter** | `/api/supporter` | 5 | Supporter/Admin | Queue triage, draft report edit, publish, request info |
| **AI Engine** | `/api/ai-engine` | 2 | Authenticated | Team-fit evaluation and save (Vercel AI SDK) |
| **Profile** | `/api/profile` | 2 | Authenticated | User profile read & update |
| **Realtime** | `/api/realtime` | 2 | Authenticated | Centrifugo connection token & case channel token (HS256) |
| **Documents** | `/api/documents` | 1 | Authenticated | Document upload & metadata registration |
| **Packages** | `/api/packages` | 1 | Public | List active evaluation packages |
| **Auth** | `/api/auth` | Catch-all | Public / Better Auth | Signin, signup, OAuth callback, session |
| **System** | `/` | 4 | Public | `/`, `/health`, `/stream`, `/session` |

> Total: 108 module route registrations + 4 system endpoints = 112 endpoints.

## 2. EVENT-DRIVEN ARCHITECTURE & OUTBOX RELAYS

Contrary to early MVP stubs, the API implements an event-driven architecture for reliability:
1. **Domain Event Bus (`shared/domain/domain-events.ts`)**: In-memory pub/sub with 14 event types covering case transitions, payment approvals, report generation, and notifications.
2. **Notification Outbox Relay (`NotificationOutbox`)**: Polling relay (2s tick) delivering email (Resend) and Telegram alerts without blocking HTTP handlers.
3. **Domain Event Outbox Relay (`DomainEventOutbox`)**: Crash-recovery relay (5s tick) ensuring domain events persist to PostgreSQL and survive unexpected server restarts.
4. **BullMQ Producer (`omp-queue`)**: Enqueues evaluation tasks to Redis for processing by `apps/worker-omp`.

## 3. EXTERNAL SERVICES & INTEGRATIONS

| Service | File / Module | Purpose |
|---------|---------------|---------|
| BullMQ / Redis | `modules/cases/infrastructure/omp-eval.service.ts` | Enqueues jobs to `omp-queue`, reads realtime log streams |
| Centrifugo v6 | `modules/realtime/centrifugo.service.ts` | Realtime case chat channels (`chat:{caseId}`) |
| Cloudinary | `services/cloudinary.ts` | Payment proof & document file storage |
| Google Generative AI | `services/google-provider.ts` | Gemini 2.5 Flash / Pro model provider via Vercel AI SDK |
| SePay | `modules/payments/http/sepay.routes.ts` | Automated bank transfer webhook reconciliation |
| Resend | `modules/notifications/infrastructure/email/` | Transactional email notifications |
| Telegram Bot | `modules/notifications/infrastructure/telegram/` | Admin & supporter escalation alerts |
| Typst | `modules/reports/infrastructure/pdf/` | Typst PDF report compilation |

## 4. AUTH LAYERS & MIDDLEWARES

1. **`requireAuth`**: Injects authenticated `user` and `session` into Hono context `c`.
2. **`getSession(c)`**: Manual session resolution inside route handlers.
3. **`requireCaseAccess(c, caseId, scope)`**: Verifies student ownership or assigned supporter/admin role.
4. **`requireAdmin(c)` / `getAdminSession(c)`**: Strict gate requiring user role `admin`.
