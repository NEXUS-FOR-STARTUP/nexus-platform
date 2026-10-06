# P1 — Guided Documents CP1–CP2 Prisma Migration (CREATE-ONLY)

**Status:** NOT APPLIED — awaiting human review
**Date:** 2026-10-05
**Branch:** dev
**Plan:** `plans/2026-10-05-guided-documents-cp1-cp2/plan.md` §4 (data model) + §11 (migration safety)

---

## 1. Migration directory

- **Dir:** `prisma/migrations/20261005000000_guided_documents_p1/`
- **File:** `prisma/migrations/20261005000000_guided_documents_p1/migration.sql`
- **Created, NOT applied.** No `migrate dev` (full), `migrate reset`, `db push`, `db execute`, or `migrate resolve` was run.

## 2. DB host-check result

Parsed hosts from root `.env` (never echoing credentials or full URLs):

| Var | Host | Local? |
|---|---|---|
| `DATABASE_URL` | `localhost:5432` | ✅ local |
| `READONLY_DATABASE_URL` | `localhost:5432` | ✅ local |
| `DIRECT_URL` | not present in `.env` | — |

All configured hosts resolve to `localhost`. Per the DB safety gate, proceeding was permitted.

## 3. ⚠️ Drift blocker — automated `--create-only` could not run

`prisma migrate dev --create-only --name guided_documents_p1 --schema prisma/schema.prisma`
**did not generate** a migration and **did not apply anything**. It exited demanding a reset
because the local dev database is already out of sync with the committed migration history:

- The following migrations were modified after they were applied:
  - `20260706103326_triage_then_pay_flow_foundation`
  - `20260706130816_add_transfer_content_to_payments`
  - `20260707053409_add_post_closure_chat_expires_at`
  - `20260811132649_add_workflow_engine_schema`
  - `20260811135015_add_wallet_and_service_catalog`
- Drift on existing tables (foreign keys removed in the live DB vs. expected):
  - `accounts.user_id`, `case_events.actor_auth_user_id`, `cases.owner_auth_user_id`, `sessions.user_id`
- A migration applied to the DB but **absent** from `prisma/migrations/`:
  - `20260913120000_add_credits_granted_to_pkg_tf_audit` (a data-only `UPDATE` on `service_packages.features`, same shape as the committed `20260913123000_add_credits_granted_to_pkg_ai_audit`)

Prisma's proposed remedy was `migrate reset` (drop + recreate the `public` schema). **That is
forbidden and was NOT run** (data loss). No `migrate resolve` was run either.

**Workaround used:** the migration SQL below was authored offline from the exact Prisma DDL via
`prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` and restricted to the
four new tables (plus their indexes, FKs, and the §4.5 seed row). It is **additive-only** and
byte-consistent with Prisma's native output (verified against the existing
`20260721000000_add_team_fit_reports` migration ordering and the `20260811135015_add_wallet_and_service_catalog`
interleaved table→index→FK style).

**Implication for later phases:** P3/P6 need this migration applied. Before applying, a human must
reconcile the pre-existing local drift (missing `tf_audit` migration file + edited-after-apply
migrations + dropped FKs) — **outside the agent**, never via `migrate reset`/`migrate resolve`/`db push`.

## 4. §4 table mapping

| §4 model | Table | Notes |
|---|---|---|
| 4.1 `ProjectAnswer` | `project_answers` | current answer state; `@@unique([case_id, question_id])` |
| 4.2 `AnswerRevision` | `answer_revisions` | append-only history; `@@unique([case_id, question_id, revision_no])` |
| 4.3 `ImportProposal` | `import_proposals` | review-before-accept staging; `proposed_items Json` |
| 4.4 `AuthoringJob` | `authoring_jobs` | idempotent generate/import job; `idempotency_key @unique` |
| 4.5 doc type | `document_types` seed row | `code = 'generated_document'`, `flow = 'revision'`, `unit_scope = 'version'` |

Schema edits were **minimal and limited to `prisma/schema.prisma`**: the four models plus the four
required `Case` back-relation fields (`project_answers`, `answer_revisions`, `import_proposals`,
`authoring_jobs`). No other schema change.

### Notes on the two task items that are NOT schema enums/columns

- **"DocumentType enum value `generated_document`"** — there is no `DocumentType` *enum* in
  `schema.prisma`; `DocumentType` is a *model* (table `document_types`). Per §4.5, `generated_document`
  is a **seed row**, included here as the trailing `INSERT … ON CONFLICT ("code") DO NOTHING`.
- **"unit code `gNN`"** — a code-level convention (extension of invariant 10 in
  `apps/api/src/modules/documents/domain/document-contract.ts`), **not** a DB column/enum. No schema
  change is required; it is out of scope for this phase (P1 touches no TS code).

## 5. Full migration SQL (inline)

```sql
-- CreateTable
CREATE TABLE "project_answers" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "answer_text" TEXT NOT NULL,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "review_reason" TEXT,
    "catalog_version" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_answers_case_id_question_id_key" ON "project_answers"("case_id", "question_id");

-- CreateIndex
CREATE INDEX "project_answers_case_id_idx" ON "project_answers"("case_id");

-- AddForeignKey
ALTER TABLE "project_answers" ADD CONSTRAINT "project_answers_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "answer_revisions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "revision_no" INTEGER NOT NULL DEFAULT 1,
    "answer_text" TEXT NOT NULL,
    "status_after" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_document_record_id" TEXT,
    "catalog_version" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "answer_revisions_case_id_question_id_revision_no_key" ON "answer_revisions"("case_id", "question_id", "revision_no");

-- CreateIndex
CREATE INDEX "answer_revisions_case_id_idx" ON "answer_revisions"("case_id");

-- AddForeignKey
ALTER TABLE "answer_revisions" ADD CONSTRAINT "answer_revisions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "import_proposals" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "source_document_record_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proposed_items" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_proposals_case_id_idx" ON "import_proposals"("case_id");

-- AddForeignKey
ALTER TABLE "import_proposals" ADD CONSTRAINT "import_proposals_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "authoring_jobs" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "checkpoint_id" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "input_revision_snapshot" JSONB NOT NULL,
    "output_lifecycle_unit_id" TEXT,
    "error" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "catalog_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authoring_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authoring_jobs_idempotency_key_key" ON "authoring_jobs"("idempotency_key");

-- CreateIndex
CREATE INDEX "authoring_jobs_case_id_idx" ON "authoring_jobs"("case_id");

-- AddForeignKey
ALTER TABLE "authoring_jobs" ADD CONSTRAINT "authoring_jobs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: add generated_document document type (additive; does not modify existing rows).
INSERT INTO "document_types" ("code", "label", "flow", "unit_scope", "sort_order")
VALUES ('generated_document', 'Tài liệu được sinh tự động', 'revision', 'version', 70)
ON CONFLICT ("code") DO NOTHING;
```

## 6. Additive-only verification

Statement inventory (no `DROP`, `TRUNCATE`, `DELETE FROM`, `ALTER COLUMN`, `SET NOT NULL`, `RENAME`):

| Statement | Count |
|---|---|
| `CREATE TABLE` | 4 |
| `CREATE INDEX` | 4 |
| `CREATE UNIQUE INDEX` | 3 |
| `ALTER TABLE … ADD CONSTRAINT … FOREIGN KEY` | 4 |
| `INSERT INTO` (`ON CONFLICT ("code") DO NOTHING`) | 1 |

The four FKs are `ON DELETE CASCADE ON UPDATE CASCADE` — Prisma's default for a required `@id`
relation — and are created **on brand-new tables with no existing data**, so there is no data-loss
risk. The seed `INSERT` is idempotent and touches only the new `generated_document` row.

## 7. Files changed

- `prisma/schema.prisma` — +82 lines (4 models + 4 `Case` back-relation fields)
- `prisma/migrations/20261005000000_guided_documents_p1/migration.sql` — new (additive-only)

No other files were modified. No full-repo type-check/build was run (this phase touches no TS code).

## NOT APPLIED — awaiting human review
