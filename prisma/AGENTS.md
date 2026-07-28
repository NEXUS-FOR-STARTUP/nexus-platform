# PRISMA KNOWLEDGE BASE

**Generated:** 2026-07-23

## OVERVIEW

Root Prisma schema (Prisma 7 + PostgreSQL). Single source of truth for all data models. Shared by `apps/api` and CLI tools. 16 models across auth + business layers.

## STRUCTURE

```
prisma/
├── schema.prisma     # 16 models (430 lines)
├── migrations/       # Migration history (9 migrations)
├── seeds/            # seed-packages.ts, seed-active-packages.ts
├── backup/           # DB dumps (gitignored)
└── verify-migration.sql
```

## MODELS

### Auth (5) — Better Auth managed
User, Session, Account, Verification, TwoFactor

### Core (8)
Case, CaseMember, Checkpoint, LifecycleUnit, DocumentRecord, DocumentType, Report, Payment

### Add-on (3)
AuditRound, CaseMessage, CaseEvent

### AI (2)
AiJob, TeamFitReport

### Package (1)
ServicePackage

## SCHEMA CONVENTIONS

- **Tables**: Plural snake_case via `@@map("table_names")` — e.g. `service_packages`, `case_members`, `document_records`
- **Columns**: snake_case — `user_facing_stage`, `last_price_changed_at`, `auth_user_id`
- **IDs**: `@id @default(uuid())` for business models; string `@id` for Better Auth models
- **Relations**: Business models reference users via `auth_user_id: String` (no direct FK to Better Auth User model)
- **Indexes**: All FK columns indexed. Composites: `[case_id, checkpoint_id]`, `[case_id, source_kind]`
- **Provider**: postgresql, uses `DATABASE_URL` at runtime, `DIRECT_URL` for migrations

## MIGRATION SAFETY (CRITICAL RULES)

Read `.agents/rules/prisma-migration-safety.md` before any migration task.

- **NEVER** run `prisma migrate dev` on production
- **NEVER** edit applied migration history
- **NEVER** mutate production DB directly as agent
- **ALWAYS** backup via `docs/db-backup-guide.md` before migration
- Use `prisma migrate dev` for local dev, `prisma migrate deploy` for prod deployment
- Schema lives at root level — all commands reference `--schema prisma/schema.prisma`

## COMMANDS

```bash
npm run prisma:generate
npm run prisma:migrate
# or direct:
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate dev --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
```

## NOTES

- `apps/api` runs `prisma generate` before `build` and `check-types`
- `DATABASE_URL` = runtime connection (PgBouncer port 6543); `DIRECT_URL` = direct connection (port 5432)
- `READONLY_DATABASE_URL` = read-only query account (see `docs/db-query-guide.md`)
- Migrations committed to git (history tracks all schema changes)
- Backup directory `prisma/backup/` is gitignored — DB dumps not versioned
