# PROJECT KNOWLEDGE BASE

- Prefer `caveman` skill lite mode + `sequential-thinking` for structured reasoning.
- **CodeGraph**: Project indexed with CodeGraph. Use `codegraph_explore` MCP or `codegraph explore` CLI BEFORE `grep` or Read.

**Generated:** 2026-08-24

## OVERVIEW

Turborepo monorepo. Stack: Next.js 16, Hono, Better Auth, Prisma 7, Mantine UI v9, TanStack Query/Form/Virtual, Lucide React, Vercel AI SDK (OpenAI/Google), shared `@repo/*` packages.

## STRUCTURE

```
root/
├── apps/api/         # Hono backend (13 modules, 79 endpoints: 75 module + 4 system)
├── apps/web-1/       # Next.js 16 product app (port 3001)
├── packages/         # Shared packages
│   ├── validation/   # Zod schemas (shared frontend↔backend)
│   ├── eslint-config/# ESLint 9 flat configs
│   └── typescript-config/ # tsconfig presets
├── prisma/           # Root Prisma schema (30 models)
├── docs/             # Product + technical documentation
├── .agents/rules/    # Agent development rules
├── .codegraph/       # Code intelligence index
└── .omo/             # Local continuation/workflow state
```

## WHERE TO LOOK

| Task            | Location                                              | Notes                                                        |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| Backend/API     | `apps/api/src/index.ts`, `auth.ts`, `db.ts`, `env.ts` | Hono entry, auth mount, DB wiring                            |
| Web UI          | `apps/web-1/app/*`                                    | Mantine UI v9 app; read `apps/web-1/AGENTS.md` first         |
| Shared UI       | Mantine UI v9                                          | Real design system for web-1                                 |
| DB schema       | `prisma/schema-*.md` or `prisma/schema.prisma`        | 30 models, plural snake_case fields                          |
| DB migration    | `docs/db-migration-guide.md`                          | Prisma migration workflow, generate/migrate/deploy          |
| Tech docs       | `docs/tech-doc-urls.txt`                              | Source of truth for external docs                            |
| CI/CD           | `docs/ci-guide.md`                                    | GitHub Actions workflow, automate build/test/deploy          |
| Workspace rules | `package.json`, `turbo.json`                          | Root scripts + Turbo task graph                              |
| Shared packages | `packages/validation/src/`                             | Zod schemas (shared FE↔BE)                                   |
| Agent rules     | `.agents/rules/`                                      | Development, docs, orchestration, workflow, prisma-migration |
| Test infra      | `apps/api/src/shared/infrastructure/tests/`           | 22 files (21 *.test.ts + coverage-report.ts), node:test only in apps/api |
| Realtime chat   | `apps/api/src/modules/realtime/`                      | Centrifugo v6; ops: `docs/realtime-centrifugo-guide.md`     |
| DB query (prod) | `docs/db-query-guide.md`                              | Read-only query via READONLY_DATABASE_URL, guest account     |
| DB backup       | `docs/db-backup-guide.md`                             | pg_dump via Docker, safe SQL on VPS, restore                 |
| Docker build    | `docs/docker-build-push-guide.md`                     | Build/push API & Web images, deploy to VPS                   |

## CONVENTIONS

- One root `.env`.
- TypeScript ESM, NodeNext-style relative imports use `.js`.
- API `8000`; web `3001`.
- Better Auth in `apps/api`; frontend only consumes client/session helpers.
- Prisma schema: plural tables + snake_case columns.
- Mantine UI web-only.
- ESLint 9 flat config (not legacy .eslintrc).
- Tailwind CSS v4 + postcss-preset-mantine.
- TanStack Query + Axios for data fetching (no Redux/Zustand).
- TanStack Form for form state management.
- Lucide React for icons (not Mantine icons).
- Test: Node built-in runner (`node:test` + `node:assert`), only in apps/api.
- CI/CD: see `docs/ci-guide.md` for GitHub Actions workflow setup.
- Docker build: see `docs/docker-build-push-guide.md` for API & Web images.
- Shared validation: see `docs/shared-validation-convention.md` for zod/entity rules.

## ANTI-PATTERNS

- Split env files per app.
- Add auth routes/session logic outside `apps/api`.
- Edit `apps/web-1` without reading `apps/web-1/AGENTS.md` first.
- Reintroduce shadcn-style components into `apps/web-1`.
- Change Prisma names away from plural/snake_case.
- Ignore `docs/tech-doc-urls.txt` when touching Hono, Better Auth, or Mantine UI code.
- Add manual Tailwind positioning classes (`fixed`, `inset-0`, `flex`, `items-center`, `justify-center`) to Mantine UI components (`Modal`, `Drawer`). Mantine has default layout; override classes break display (e.g., center alignment).
- Split `.env` per app (3 violations found: `apps/web-1/.env`, `apps/web-1/.env.prod`, `.env.prod`).
- Direct `apiClient` calls in UI components instead of hooks.
- `as any` type escapes (126 occurrences in API, 20 in web-1 — số đếm hiện tại, có thể trôi).
- try/catch in component code (delegate to hook/query layer).
- Files exceeding 200-line limit (20 files across API and web-1).
- Shadows on Mantine Card/Paper (`shadow-sm`, `shadow-md` on 22 files).

## UNIQUE STYLES

- `apps/web-1`: Mantine UI v9 + TanStack Form + Lucide React.
- `apps/api`: Hono streaming helpers, Better Auth plugins, Vercel AI SDK for Google/OpenAI.
- `packages/validation`: Zod schemas shared FE↔BE; single source of truth for entity types.

## COMMANDS

```bash
npm run dev
npm run build
npm run check-types
npm run prisma:generate
npm run prisma:migrate
```

## BUILD & CI

```bash
# Dev
npm run dev                    # parallel: API (tsx watch :8000) + Web (next dev :3001)
npm run build                  # prisma generate → tsc (API) + next build (Web)
npm run lint                   # ESLint zero-warnings (Web + UI)
npm run check-types            # tsc --noEmit all workspaces
npm run prisma:generate        # Root Prisma schema → client
npm test                       # Only in apps/api: tsx --test (Node built-in runner)
npm run format                 # Prettier (not in CI pipeline)
```

## DOCKER BUILD & DEPLOY

> Full guide: `docs/docker-build-push-guide.md` — troubleshooting, Makefile shortcuts, CI/CD template.

## CI/CD

> Full guide: `docs/ci-guide.md` — GitHub Actions workflow, automate build/test/deploy.

## CRITICAL — DATABASE SAFETY

> ⚠️ **ĐỌC TRƯỚC KHI LÀM BẤT CỨ VIỆC GÌ LIÊN QUAN DATABASE**

**[.agents/rules/prisma-migration-safety.md](.agents/rules/prisma-migration-safety.md)** — Migration safety, DB mutation rules, target DB classification.

**Absolute forbidden commands (kể cả qua subagent):**

- `prisma migrate dev` (full run) — chỉ được `--create-only`
- `prisma migrate reset` / `prisma migrate reset --force`
- `prisma db push`
- `DROP TABLE`, `DROP COLUMN`, `DELETE FROM`, `TRUNCATE`

Nếu DATABASE_URL trỏ `supabase.co` hoặc `pooler.supabase.com` → **tuyệt đối không chạy destructive command**. Orchestrator phải inject safety block vào mọi subagent prompt (xem `.agents/rules/orchestration-protocol.md` → DB SAFETY PROTOCOL).

**Vi phạm = data loss = irrecoverable.** Đã xảy ra 1 lần. Không được phép lần 2.

## NOTES

- `apps/web-1/AGENTS.md` is child-specific Mantine UI note; sync with web work.
- **Agent Rules**: [.agents/rules/](.agents/rules/) contains project-wide guidelines:
  - [development-rules.md](.agents/rules/development-rules.md): Coding standards, file sizes, visual aids, no direct `apiClient` calls in UI.
  - [documentation-management.md](.agents/rules/documentation-management.md): Roadmaps, changelogs, plan files.
  - [orchestration-protocol.md](.agents/rules/orchestration-protocol.md): Subagent delegation and parallel execution — **includes DB Safety Protocol**.
  - [primary-workflow.md](.agents/rules/primary-workflow.md): Planning, implementation, testing, code quality, integration, visual explanations — **includes DB Migration Safety Gate**.
- Apps/api: 79 endpoints (75 module + 4 system) across 13 modules (cases, reports, payments, packages, ai-engine, admin, supporter, documents, notifications, realtime, wallet, orders, deposits). Clean Architecture (domain/application/infrastructure/http). Some modules lack infrastructure layer (admin, supporter). Event bus (`shared/domain/domain-events.ts`) dùng cho notifications (14 event types); còn lại phần lớn là direct module-to-module calls.
- Apps/web-1: 21 custom hooks across route groups. Auth entirely client-side (no middleware guard). Vietnamese-first UI.
- Packages/validation: Zod v4, shared schemas for IdeaInput, TeamMemberInput, TeamFitInput.
- No `packages/ui` package exists; Mantine UI v9 is the real design system for web-1.

## UI-UX-PRO-MAX USAGE RULE

ui-ux-pro-max is UI/UX reference, not source of truth.

Before building major frontend screen, optionally query for:

- visual direction
- layout pattern
- color/typography suggestions
- UX anti-patterns
- Next.js/Tailwind implementation guidance

Filter through Nexus Frontend UI/UX Design Rules v2.

Never blindly apply skill recommendations.
Never let skill override Nexus requirements:

- AI output explainable.
- Trust over magic.
- Status visible.
- Student input, AI output, supporter/admin decision separated.
- UI support revision/version workflow.
- Student screens not admin dashboards.
- Landing creative; workspace/admin restrained.

Use skill as inspiration and validation, not rigid generator.