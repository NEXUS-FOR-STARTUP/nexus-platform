# Prisma Migration Safety Rules for AI Agents

## Context

This project uses Prisma with a production self-hosted PostgreSQL 18.4 database running via Docker on a VPS (`docker-compose.prod.yml`, container `nexus-db`).

The production database has:

* no replica
* no automatic backup guarantee
* no safe rollback guarantee
* real user/business data

Therefore, database migration work must be treated as a high-risk production operation.

The agent must prioritize data preservation over task completion.

## Absolute Core Principle

**Data in the database is sacred. Protecting it is the highest priority.**

* The agent must never drop a database.
* The agent must never delete data.
* The agent must never overwrite or destroy existing columns or tables.
* If data must move (rename, restructure), it must be **copied to new structure first**, verified, and the old structure must be **kept intact** until the human explicitly removes it later.
* When in doubt, stop and ask. Do not guess. Do not proceed silently.

## Interactive Safety Protocol

**When the agent touches anything related to the database, the following protocol is mandatory:**

1. **Explain first**: Before any database action (schema edit, migration file creation, SQL generation, constraint change), the agent must explain in plain language what it intends to do and why.
2. **Ask for confirmation**: The agent must explicitly ask the user to confirm before proceeding. Do not batch multiple actions into one confirmation — each distinct action gets its own explanation and confirmation.
3. **Wait for approval**: The agent must not proceed until the user explicitly agrees. Silence is not consent.
4. **Report result**: After each action, the agent must report what happened and whether it succeeded.

This protocol applies to:

* editing `schema.prisma`
* creating migration files
* generating SQL
* running any Prisma CLI command
* running any SQL query (even read-only on production)
* changing enum definitions
* modifying RLS policies or triggers
* any action that could indirectly affect database state

The agent must never batch database actions silently. Each step must be visible, explained, confirmed, and reported.

## Golden Rule

The agent must never directly mutate the production database.

The agent may prepare, analyze, generate, and review migration files, but must not apply them to production unless the human explicitly performs the final command outside the agent.

## Production Database Definition

Treat the database as production if any of the following is true:

* `DATABASE_URL`, `READONLY_DATABASE_URL`, or `DIRECT_URL` points to a remote VPS host, remote IP, or production domain
* host is not `localhost`, `127.0.0.1`, `::1`, or local Docker internal service `db`
* host contains `supabase.co` or `pooler.supabase.com` (legacy remote)
* database contains real user/business data
* environment is unclear or `.env.prod` is loaded
* the user says "prod", "production", "live", "VPS prod", or "real database"

If uncertain, assume production.
### Connection String Rules (Supabase-Specific)

This project may have multiple database URLs:

* `DATABASE_URL` — primary connection (may use pooler, port 6543)
* `DIRECT_URL` — direct connection (port 5432), required for migrations
* `READONLY_DATABASE_URL` — read-only account for safe queries

Rules:

* Prisma migrations must use `DIRECT_URL` (port 5432), never the pooler URL (port 6543).
* `schema.prisma` must have `directUrl` configured in the datasource block for migrations.
* The agent must verify the connection type before any `migrate` command.
* The agent must never use `READONLY_DATABASE_URL` for write operations.
* The agent may use `READONLY_DATABASE_URL` for safe inspection queries (SELECT, COUNT, etc.) only after user confirmation.

## Absolute Forbidden Commands on Production

The agent must never run these commands against production:

```bash
npx prisma migrate dev
npx prisma migrate reset
npx prisma migrate reset --force
npx prisma db push
npx prisma db seed
npx prisma db execute
npx prisma migrate resolve
```

The agent must never run these SQL statements against production:

```sql
DROP TABLE
DROP DATABASE
DROP SCHEMA
DROP COLUMN
DROP TYPE
TRUNCATE
DELETE FROM <table> (with or without WHERE — all deletes are blocked unless human writes and runs the SQL themselves)
ALTER TABLE ... DROP COLUMN
ALTER TABLE ... ALTER COLUMN ... SET NOT NULL
ALTER TABLE ... ADD CONSTRAINT (without checking existing data first)
```

### Environment Variable Safety

The agent must not extract, echo, print, pass inline, or use `DATABASE_URL`, `DIRECT_URL`, or any database connection string directly in shell commands.

Forbidden patterns:

```bash
# All of these are forbidden
psql $DATABASE_URL -c "..."
psql "$DIRECT_URL" -c "ALTER TABLE ..."
DATABASE_URL="postgres://...supabase..." npx prisma db push
echo $DATABASE_URL
cat .env | grep DATABASE
env | grep DATABASE
```

The agent must not bypass Prisma AI safety checks by setting:

```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION
```

The agent must not suggest setting this variable for production.

### Anti-Auto-Confirm Rule

The agent must never pipe input or use force flags to auto-confirm Prisma prompts:

```bash
# All of these are forbidden
echo y | npx prisma migrate dev
yes | npx prisma migrate dev
npx prisma migrate reset --force
npx prisma db push --accept-data-loss
```

All Prisma commands must run in interactive mode so that reset/destructive prompts are visible to the human.

### Pre-Command DATABASE_URL Check

Before running ANY Prisma CLI command (including `prisma validate`, `prisma generate`, `prisma migrate status`), the agent must:

1. Check what `DATABASE_URL` and `DIRECT_URL` resolve to in `.env`
2. If either points to Supabase or any non-local host → treat as production
3. If production → refuse all mutation commands, even if the user says "this is local"
4. Only read-only / offline commands are allowed when URL points to production

The agent must not trust the user's claim that "this is local" if the URL says otherwise.

## Allowed Agent Actions

The agent may run read-only or local-only commands:

```bash
npx prisma validate
npx prisma format
npx prisma generate
npx prisma migrate status
npx prisma migrate diff
```

The agent may create migration files locally using:

```bash
npx prisma migrate dev --create-only
```

Only if the target database is confirmed local/dev (DATABASE_URL points to localhost or a local Docker container), not production.

The agent may inspect migration files and explain what they do.

The agent may write SQL review notes.

The agent may produce a human-run checklist.

## Required Workflow

For every schema change, follow this workflow.

### 1. Identify target database

Before any migration work, the agent must state:

* target environment: local, preview, staging, or production
* database host type: local, Supabase pooler, Supabase direct, unknown
* actual DATABASE_URL host (without exposing password)
* whether real data may exist
* whether the operation is safe, risky, or blocked

If the target is production, the agent must stop before mutation.

### 2. Classify the migration

Classify the change as one of:

* additive safe change
* data migration
* constraint change
* rename
* destructive change
* unknown risk

Examples:

Safe or usually safe:

* add nullable column
* add new table
* add new optional relation
* add index (with CONCURRENTLY on production if supported)

Risky:

* rename column
* rename table
* change column type
* add `NOT NULL`
* add unique constraint
* delete enum value
* change relation behavior
* cascade delete
* drop column
* drop table

Blocked unless manually approved:

* reset database
* drop table
* truncate table
* delete production data
* overwrite schema using `db push`

### 3. Inspect existing data before constraint changes

Before adding constraints, the agent must propose read-only checks.

Examples:

```sql
-- Check nulls before SET NOT NULL
SELECT COUNT(*) FROM "Table" WHERE "column" IS NULL;

-- Check duplicates before UNIQUE
SELECT "column", COUNT(*)
FROM "Table"
GROUP BY "column"
HAVING COUNT(*) > 1;

-- Check orphan rows before FK
SELECT COUNT(*)
FROM "Child" c
LEFT JOIN "Parent" p ON p.id = c."parentId"
WHERE p.id IS NULL;
```

The agent must not add the constraint until the check result is known and confirmed by the human.

### 4. Use expand-contract for risky changes

For production, avoid one-step destructive migrations.

Use expand-contract:

Step A: Expand

* add new nullable column/table
* keep old column/table
* deploy app code that writes both old and new fields if needed

Step B: Backfill

* run controlled data migration
* verify row counts
* verify nulls, duplicates, and foreign keys

Step C: Contract

* only after verification, add constraints
* only later remove old columns/tables — and only when the human explicitly decides

Never combine expand, backfill, and drop in one blind migration.

### 5. Handle renames: expand-only, never drop

**Do not trust automatic Prisma rename detection.**

If a field/table is renamed, the agent must **never** allow Prisma to generate drop-and-add. This will destroy data.

**Mandatory rename procedure:**

1. **Create new column/table** with the new name (nullable)
2. **Write and review a data migration script** that copies data from old → new
3. **Run the script** (human-approved, tested locally first)
4. **Verify** the new column/table has all expected data
5. **Update app code** to use the new column/table
6. **Keep the old column/table intact** — do not drop it

The old column/table stays until the human explicitly decides to remove it in a future, separate migration.

The agent must never generate SQL like:

```sql
-- FORBIDDEN: Prisma auto-generated drop-and-add for rename
ALTER TABLE "Table" DROP COLUMN "oldName";
ALTER TABLE "Table" ADD COLUMN "newName" ...;
```

Instead, the only acceptable SQL is:

```sql
-- Step 1: Add new column
ALTER TABLE "Table" ADD COLUMN "newName" <type>;

-- Step 2: Copy data (in a separate, reviewed script)
UPDATE "Table" SET "newName" = "oldName";

-- Step 3: Old column stays. Do NOT drop it.
```

Or for table renames, the same expand-only approach: create new table, migrate data, keep old table.

### 6. Do not edit applied migration history

The agent must not edit migration files that may already have been applied to any shared or production database.

If a migration is wrong but already applied, create a new corrective migration.

Allowed:

```text
prisma/migrations/new_timestamp_fix_previous_migration/
```

Forbidden:

```text
editing old migration files that production may already know
```

### 7. Backup gate before production

Before production migration, the agent must require a fresh manual backup.

Acceptable backup examples:

```bash
supabase db dump --db-url "$PROD_DATABASE_URL" -f roles.sql --role-only
supabase db dump --db-url "$PROD_DATABASE_URL" -f schema.sql
supabase db dump --db-url "$PROD_DATABASE_URL" -f data.sql --use-copy --data-only
```

or a `pg_dump` backup.

The agent must not proceed unless the human confirms:

```text
I have created and verified a production backup.
```

Verification means the backup files exist and are non-empty.

For critical systems, restore test is preferred before applying migration.

### 8. Production deploy command

The only Prisma migration command normally acceptable for production is:

```bash
npx prisma migrate deploy
```

But the agent must not run it automatically.

The agent may show it as the final human-run command after all gates pass.

### 9. Required output before any production migration

Before asking the human to run anything, the agent must produce this report:

`````md
## Migration Safety Report

### Target
- Environment:
- Database:
- Production data risk:

### Intended change
- Summary:
- Migration type:
- Tables affected:
- Columns affected:

### Data risk
- Can this lose data?
- Can this lock large tables?
- Can this break existing app code?
- Can this break RLS/auth/storage?

### Generated files
- Migration folder:
- SQL file:
- Prisma schema changes:

### Dangerous SQL found
- DROP:
- TRUNCATE:
- DELETE:
- ALTER COLUMN:
- SET NOT NULL:
- UNIQUE:
- FOREIGN KEY:
- CASCADE:

### Required checks before deploy
- Check 1:
- Check 2:
- Check 3:

### Backup status
- Backup required:
- Backup confirmed by human:
- Restore tested:

### Deploy command for human
```bash
npx prisma migrate deploy
```

### Rollback strategy
- Rollback possible:
- Rollback steps:
- Data recovery needed:
`````

If the report cannot be completed, stop.

### 10. Human-Run Migration Handoff Protocol

Since the agent is blocked from applying migrations to production, the agent must guide the user through doing it themselves. This is the most critical section — the agent's job is not done when the migration file is created; it is done when the user has clear, safe, copy-paste-ready instructions to execute the migration.

**Phase 1: Agent prepares everything**

The agent must complete all of the following before handing off:

1. Edit `schema.prisma` with the intended changes (after user approval)
2. Run `npx prisma validate` to confirm schema is valid
3. Run `npx prisma migrate dev --create-only` (only if DATABASE_URL is local) or manually write the migration SQL file
4. Review the generated SQL in `prisma/migrations/<timestamp>/migration.sql`
5. Flag any risky SQL and explain each statement
6. Produce the Migration Safety Report (§9)
7. If the migration involves data transformation, prepare a separate reviewed SQL script

**Phase 2: Agent hands off with a checklist**

The agent must present the user with a numbered, copy-paste-ready checklist. Each command must be explicit — no "run the migration" without showing the exact command.

Template:

```md
## Migration Checklist — [brief description]

### Pre-flight
- [ ] Review the migration SQL below and confirm it matches your intent
- [ ] Confirm DATABASE_URL and DIRECT_URL in `.env` are correct

### Step 1: Backup (REQUIRED)
Run these commands in your terminal:
​```bash
supabase db dump --db-url "$PROD_DATABASE_URL" -f backup_roles_YYYYMMDD.sql --role-only
supabase db dump --db-url "$PROD_DATABASE_URL" -f backup_schema_YYYYMMDD.sql
supabase db dump --db-url "$PROD_DATABASE_URL" -f backup_data_YYYYMMDD.sql --use-copy --data-only
​```
- [ ] Verify backup files exist and are non-empty
- [ ] (Recommended) Test restore on a local database

### Step 2: Pre-migration checks
Run these read-only queries to verify data safety:
​```sql
-- [agent fills in specific check queries]
​```
- [ ] Confirm check results are as expected

### Step 3: Apply migration
​```bash
npx prisma migrate deploy
​```
- [ ] Confirm migration applied without errors

### Step 4: Generate Prisma client
​```bash
npx prisma generate
​```

### Step 5: Post-migration verification
Run these queries to verify the migration succeeded:
​```sql
-- [agent fills in verification queries]
​```
- [ ] Confirm data is intact
- [ ] Confirm application works correctly

### Rollback plan (if something goes wrong)
[agent fills in rollback steps or restore-from-backup instructions]
```

**Phase 3: Agent assists during execution**

While the user runs commands:

* The agent may answer questions about errors or unexpected output
* The agent may suggest read-only diagnostic queries
* The agent must not offer to "just run it for you"
* If the user pastes an error, the agent must diagnose it and provide a safe fix — never a destructive workaround

**Phase 4: Post-migration support**

After the user confirms migration is applied:

* The agent may run `npx prisma generate` (safe, local-only)
* The agent may help update application code to use the new schema
* The agent may suggest verification queries for the user to run
* The agent must not run any further mutation commands against the database

**What the agent must NOT do during handoff:**

* Do not say "run prisma migrate deploy" without the full checklist
* Do not skip the backup step
* Do not combine multiple migrations into "just run this one command"
* Do not assume the user knows what each SQL statement does — explain everything
* Do not proceed to app code changes until migration is confirmed successful

## SQL Review Rules

The agent must inspect generated migration SQL.

The agent must flag these as high risk:

```sql
DROP TABLE
DROP COLUMN
DROP SCHEMA
DROP TYPE
TRUNCATE
DELETE
ON DELETE CASCADE
ALTER COLUMN TYPE
SET NOT NULL
ADD UNIQUE
ADD FOREIGN KEY
CREATE UNIQUE INDEX
```

The agent must explain why each risky statement is safe or unsafe.

If it cannot prove safety, it must mark the migration as blocked.

## Table Lock Awareness

Some ALTER TABLE operations acquire exclusive locks that block all reads and writes on the table for the duration. On a production database with no replica, this means **the application goes down** during the lock.

High-risk locking operations:

* `ALTER TABLE ... ADD COLUMN ... DEFAULT ...` — full table rewrite on older PostgreSQL (< 11); safe on PG 11+ for non-volatile defaults, but still risky on very large tables
* `CREATE INDEX` without `CONCURRENTLY` — locks writes for entire index build duration
* `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY` — full table scan, blocks writes
* `ALTER TABLE ... ALTER COLUMN TYPE` — full table rewrite
* `ALTER TABLE ... SET NOT NULL` — full table scan (PG 12+ can skip if CHECK constraint exists)

Rules:

* The agent must estimate table size (row count) before proposing any ALTER on production.
* If a table has > 100,000 rows, the agent must warn about lock duration.
* If a table has > 1,000,000 rows, the agent must recommend the change be done with a manual maintenance window.
* Index creation on production must always use `CREATE INDEX CONCURRENTLY`.
* The agent must never generate `CREATE INDEX` without `CONCURRENTLY` for production tables.

## Enum Safety

PostgreSQL enums are dangerous to modify. Prisma may generate drop-and-recreate SQL for enum changes, which will fail or destroy data.

Rules:

* **Adding enum value**: Usually safe. Must use raw SQL: `ALTER TYPE "EnumName" ADD VALUE 'new_value';` — Prisma does not handle this well, so the agent must generate the SQL manually.
* **Removing enum value**: **BLOCKED**. PostgreSQL does not support `DROP VALUE` from an enum. Prisma will attempt to drop the type and recreate it, which will fail if any column uses it, or destroy data if it somehow succeeds.
* **Renaming enum value**: **BLOCKED**. Same risk as removing — Prisma will drop and recreate.

Before any enum change, the agent must check:

```sql
SELECT COUNT(*) FROM "Table" WHERE "enumColumn" = 'value_being_changed';
```

If the count is > 0, the change is blocked until data migration is complete.

## Supabase-Specific Rules

The agent must not modify Supabase-managed schemas unless explicitly requested:

```text
auth
storage
realtime
supabase_functions
extensions
vault
graphql
```

The agent must be careful with:

* RLS policies
* triggers
* auth users
* storage buckets
* realtime publications
* extensions
* enum changes
* cascade delete behavior

The agent must not disable RLS casually.

The agent must not drop or rewrite Supabase auth/storage objects.

## Data Migration Rules

If data must be transformed, the agent must prefer a separate, reviewed script.

The script must be:

* idempotent where possible
* batch-safe
* transaction-aware
* logged
* tested locally first
* able to resume or safely fail

The agent must not run bulk updates/deletes on production without a WHERE clause and expected row count.

Before a bulk update/delete, the agent must provide:

```sql
SELECT COUNT(*) ...
```

Then the human must confirm the expected count before the agent proceeds.

## Safe Defaults

When uncertain, the agent must choose the safer option:

* ask for confirmation
* create a migration file only
* do not apply migration
* avoid destructive SQL
* preserve old data
* add new structure instead of replacing old structure
* keep old columns/tables instead of dropping them
* stop rather than guess

## Required Stop Conditions

The agent must stop immediately if:

* the database target is unclear
* the command points to production
* the migration contains destructive SQL (DROP, DELETE, TRUNCATE)
* there is no backup
* the user asks to "just reset", "drop table", "force it", or "push schema" on production
* Prisma asks to reset the database
* Prisma reports drift on production
* migration history is inconsistent
* generated SQL does not match the intended change
* DATABASE_URL in .env points to Supabase but user claims "this is local"
* the agent cannot verify table size before a locking operation
* an enum change would affect existing data

The agent must then explain the risk and propose a safer manual path.

## Final Rule

A successful migration task is not one where the command runs.

A successful migration task is one where production data survives, schema changes are reviewed, rollback is understood, and the human has explicit control over the final deploy.

**Data preservation is not negotiable. When in doubt, do nothing and ask.**
