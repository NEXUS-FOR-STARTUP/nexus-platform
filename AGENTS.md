# PROJECT KNOWLEDGE BASE

- Prefer `caveman` skill lite mode + `sequential-thinking` for structured reasoning.
- **CodeGraph**: Project indexed with CodeGraph. Use `codegraph_explore` MCP or `codegraph explore` CLI BEFORE `grep` or Read.

**Generated:** 2026-07-23

## OVERVIEW

Turborepo monorepo. Stack: Next.js 16, Hono, Better Auth, Prisma 7, Mantine UI v9, TanStack Query/Form/Virtual, Lucide React, Vercel AI SDK (OpenAI/Google), shared `@repo/*` packages.

## STRUCTURE

```
root/
├── apps/api/         # Hono backend (8 modules, 51 endpoints)
├── apps/web-1/       # Next.js 16 product app (port 3001)
├── packages/         # Shared packages
│   ├── ui/           # React primitives (Button, Card, Code)
│   ├── validation/   # Zod schemas (shared frontend↔backend)
│   ├── eslint-config/# ESLint 9 flat configs
│   └── typescript-config/ # tsconfig presets
├── prisma/           # Root Prisma schema (16 models)
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
| Shared UI       | `packages/ui/src/*`                                   | Common primitives for shared React usage                     |
| DB schema       | `prisma/schema-*.md` or `prisma/schema.prisma`        | 16 models, plural snake_case fields                          |
| Tech docs       | `docs/tech-doc-urls.txt`                              | Source of truth for external docs                            |
| Workspace rules | `package.json`, `turbo.json`                          | Root scripts + Turbo task graph                              |
| Shared packages | `packages/validation/src/`, `packages/ui/src/`        | Zod schemas, React primitives                                |
| Agent rules     | `.agents/rules/`                                      | Development, docs, orchestration, workflow, prisma-migration |
| Test infra      | `apps/api/src/shared/infrastructure/tests/`           | 12 test files, Node built-in runner                          |
| DB query (prod) | `docs/db-query-guide.md`                              | Read-only query via READONLY_DATABASE_URL, guest account     |
| DB backup       | `docs/db-backup-guide.md`                             | pg_dump via Docker, safe SQL on VPS, restore                 |
| Docker build    | `docs/docker-build-push-guide.md`                     | Build/push API & Web images, deploy to VPS                   |

## CONVENTIONS

- One root `.env`.
- TypeScript ESM, NodeNext-style relative imports use `.js`.
- API `8000`; web `3000`.
- Better Auth in `apps/api`; frontend only consumes client/session helpers.
- Prisma schema: plural tables + snake_case columns.
- Mantine UI web-only.
- ESLint 9 flat config (not legacy .eslintrc).
- Tailwind CSS v4 + postcss-preset-mantine.
- TanStack Query + Axios for data fetching (no Redux/Zustand).
- TanStack Form for form state management.
- Lucide React for icons (not Mantine icons).
- Test: Node built-in runner (`node:test` + `node:assert`), only in apps/api.
- No CI/CD configured (no GitHub Actions, Docker, Makefile).

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
- `as any` type escapes (107 occurrences in API, 11 in web-1).
- try/catch in component code (delegate to hook/query layer).
- Files exceeding 200-line limit (20 files across API and web-1).
- Shadows on Mantine Card/Paper (`shadow-sm`, `shadow-md` on 22 files).

## UNIQUE STYLES

- `apps/web-1`: Mantine UI v9 + TanStack Form + Lucide React.
- `apps/api`: Hono streaming helpers, Better Auth plugins, Vercel AI SDK for Google/OpenAI.
- `packages/ui`: tiny, stable, shared; keep changes minimal.

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
No CI/CD configured. All commands run locally.

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
- Apps/api: 51 endpoints across 8 modules. Clean Architecture (domain/application/infrastructure/http). Some modules lack infrastructure layer (admin, supporter). Direct module-to-module calls (no event bus).
- Apps/web-1: 16 custom hooks across 4 route groups. Auth entirely client-side (no middleware guard). Vietnamese-first UI.
- Packages/validation: Zod v4, shared schemas for IdeaInput, TeamMemberInput, TeamFitInput.
- Packages/ui: 3 scaffold components — these are NOT the real design system (Mantine is).

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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **nexus-platform** (10518 symbols, 21057 relationships, 258 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user. For unified PDG impact, add `mode: "pdg"` with optional `line: <N>` — it returns statement-level `affectedStatements` over CDG + REACHING_DEF and inter-procedural symbols in `interproceduralByDepth`/`byDepth`; no-layer/degraded PDG results are UNKNOWN-risk notes (`--pdg` layer).
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).
- For control/data dependence, `pdg_query({mode: "controls", target: "fileOrSymbol"})` answers "under what condition does X run?" (CDG, incl. guard clauses) and `pdg_query({mode: "flows", target, variable})` traces "where does variable Y flow?" (REACHING_DEF). `--pdg` layer.

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/nexus-platform/context` | Codebase overview, check index freshness |
| `gitnexus://repo/nexus-platform/clusters` | All functional areas |
| `gitnexus://repo/nexus-platform/processes` | All execution flows |
| `gitnexus://repo/nexus-platform/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
