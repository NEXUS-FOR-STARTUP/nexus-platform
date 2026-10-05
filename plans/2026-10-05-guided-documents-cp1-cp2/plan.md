---
title: "Guided Documents CP1/CP2 — canonical project Q&A, phase TOC, safe import, light-edit generation, deterministic DOCX"
description: "Approved plan: one canonical project question and answer set with a phase-grouped TOC, per-template required/recommended/supplemental classification, dependency-based unlocking plus stale-review gating, import with review-before-accept, light-edit generation into immutable DOCX versions, and CP1/CP2 assessment routing."
status: pending
priority: P1
effort: 68h
branch: dev
tags: [guided-documents, cp1, cp2, authoring, docx, prisma-migration, api, frontend, security]
created: 2026-10-05
blocks: []
blockedBy: []
---

# Guided Documents CP1/CP2 — canonical project Q&A and guided template workflow

Plan only. Nothing here is implemented. No Prisma CLI command, SQL statement, database connection,
dependency installation, schema edit, or migration is executed or permitted during planning.
Implementation starts only after the phase gates in section 12 are cleared.

**DB SAFETY — mandatory for every phase.** Governed by `.agents/rules/prisma-migration-safety.md`.
Forbidden everywhere, including through subagents: `prisma migrate dev` (full run), `prisma migrate reset`,
`prisma db push`, `DROP TABLE`, `DROP COLUMN`, `DELETE FROM`, `TRUNCATE`, and editing already-applied
migration files. Root `DATABASE_URL` is classified local but `DIRECT_URL` is unknown, therefore production
safety is assumed. Migration work stops at a drafted `--create-only` migration file. A human performs the
backup and the production deploy outside the agent.

**Traceability.** Implements the approved brief at
`plans/2026-10-05-guided-documents-cp1-cp2/reports/planning-brief.md`, evidence-verified against the
working tree. Approved UX clauses are reproduced in section 2; each phase cites the clauses it satisfies.
No official rubric claim is made in this plan (see section 9).

---

## 1. Verified ground truth

Each row was re-checked against the repository by the planner. Scout reports were used as leads, not as
authority.

| # | Fact | Evidence |
|---|---|---|
| 1 | No canonical Q&A, template, phase, answer, or project entity exists | `grep "^model \|^enum " prisma/schema.prisma` returns 30 models; none is Question, Template, Phase, Answer, or Project |
| 2 | The `Case` row is the project root and the authorization root | `prisma/schema.prisma:317` `model Case` (owner_auth_user_id, current_checkpoint, version_no, package_id); the `requireCaseAccess` 404 message is `"Không tìm thấy dự án"` |
| 3 | Authz primitive to reuse unchanged | `apps/api/src/shared/infrastructure/authorization.ts` — `hasCaseAccess` = admin OR assigned supporter OR case owner OR case member; `requireCaseAccess(c, caseId, scope)` returns 401 / 403 / 404 / 500 |
| 4 | Versioning spine to reuse | `prisma/schema.prisma:382` `Checkpoint`, `:403` `LifecycleUnit`, `:429` `DocumentRecord` (`superseded_at`, `@@unique([lifecycle_unit_id, doc_type, seq])`), `:470` `DocumentType`, `:484` `Report` |
| 5 | Unit-code contract and document invariants | `apps/api/src/modules/documents/domain/document-contract.ts` invariants 9-13: `v00` intake, `vNN` revision, `aNN-vNN` assessment, `source_kind="generated"` for approved report artifacts, and every row filtered by `case_id` before any join |
| 6 | The CP1-only report mis-route is a real bug | `apps/api/src/modules/reports/infrastructure/persistence/report.repository.ts:143-184` `saveOmpAuditReport` uses `checkpoint.findFirst({ where: { case_id }, orderBy: { created_at: "asc" } })` (lines 155-158), `report_type: "input_clarification"`, and creates `checkpoint_code: "CP1"` when none exists |
| 7 | Credit spend is centralised in one function | `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts` — `SELECT ... FOR UPDATE` on the case, `getCreditBalanceForTx`, `createCreditEntry({ amount: -1, type: "consumption", idempotencyKey: "audit-trigger-<caseId>-<startedAt>" })`; refund key `"audit-refund-<caseId>-<startedAt>"` |
| 8 | Intake silently spends one credit today | `apps/api/src/modules/cases/application/submit-intake.usecase.ts:249` `await triggerOmpAuditForCase(caseId, { submission_type: "initial" })` |
| 9 | No DOCX writer and no text-extraction library exists | dependency grep across root, `apps/*`, `packages/*` for `mammoth`, `docxtemplater`, `docx`, `officegen`, `jszip`, `pizzip`, `adm-zip`, `pdf-parse`, `pdfjs` returns NONE |
| 10 | Upload is authenticated but not authorized against a case, and is extension-allowlisted only | `apps/api/src/modules/cases/http/cases.controller.ts:171-190` uses `getSession` only; `apps/api/src/modules/documents/domain/document-upload-rules.ts` allows `.pdf .docx .xlsx .pptx .md .txt` up to `15 * 1024 * 1024` bytes |
| 11 | Direct assessment submission already exists and needs no template | `apps/api/src/modules/cases/http/cases.routes.ts:49` `POST /:id/revisions/upload` |
| 12 | Structured AI output has a precedent, and its dependencies are already installed in the API | `apps/api/package.json` deps include `ai ^5.0.44`, `@ai-sdk/google ^2.0.83`, `bullmq ^5.41.0`, `ioredis ^5.6.0`, `zod ^4.4.3`; precedent `apps/api/src/modules/ai-engine/application/evaluate-team-fit.usecase.ts` (`generateObject` with a Zod schema) |
| 13 | Global POST/PATCH idempotency exists but is non-durable and skips multipart | `apps/api/src/index.ts:82` `idempotency({ store: memoryStore(), required: false, methods: ["POST", "PATCH"] })`; the `app.use("/api/*")` wrapper bypasses it when content-type starts with `multipart/` |
| 14 | Route mounting pattern, and a size warning | `apps/api/src/index.ts:154-168` `app.route("/api/<name>", <name>Router)`; `casesRouter` already declares 31 routes, so it must not grow |
| 15 | Test runner and the DB-free helper-import pattern | `apps/api/package.json:11` `"test": "tsx --test src/shared/infrastructure/tests/*.test.ts"`; 48 files in that folder; `document-supersede.test.ts` imports pure helpers via `await import("../../../modules/.../document.repository.js")` and never opens a DB |
| 16 | The shared validation package has no test script, so its own tests would never run | `packages/validation/package.json` scripts = `{ "check-types": "tsc --noEmit" }` only |
| 17 | The shared validation entrypoint is already 982 lines | `wc -l packages/validation/src/index.ts` = 982, one file, no submodules |
| 18 | Student workspace tab machinery and URL sync | `apps/web-1/app/dashboard/case/[id]/page.tsx:62-63` (`isAiPackage`, `VALID_WORKSPACE_TABS` with 7 entries) and `:132-141` (`isTabAvailable`, package-key gating) |
| 19 | Server-side route guard exists | `apps/web-1/proxy.ts` (session cookie plus `MAINTENANCE_MODE`) and `apps/web-1/app/dashboard/layout.tsx` role redirect |
| 20 | Canonical wording source of truth exists | `design-system/wording/` (`AGENTS.md`, `pages/`, `ux-context.md`) |
| 21 | In-repo CP1/CP2 content is business prose only, never data | `docs/nexus-document/cp1/cp1-team-and-idea-document.md`, `docs/nexus-document/cp1/cp1-presentation-script.md`, `docs/nexus-document/cp2/cp2-market-research-document.md`, `docs/nexus-document/cp2/feedback/`, `docs/nexus-document/overview.md`, `docs/nexus-document/structure-map.md` |
| 22 | External CP1 template exists as docx plus a faithful md mirror whose internal title says V1 | `E:/FPT/Semester_7/EXE101/prompt/TEMPLATE_STARTUP_CHECKPOINT1_V2.docx`, `E:/FPT/Semester_7/EXE101/prompt/TEMPLATE_STARTUP_CHECKPOINT1_V2.md` |
| 23 | External CP2 requirements file exists; the planner did not re-verify its contents | `E:/FPT/Semester_7/EXE101/CP2-Requirements-EXE101SP26 (5).pdf`, 337809 bytes, present |
| 24 | Two CP2 files remain unread in every scout pass | `E:/FPT/Semester_7/EXE101/HD  Bài nộp (Proposal) và Thuyết trình debate lấy CP2.pdf`, `E:/FPT/Semester_7/EXE101/THÔNG BÁO về việc THUYẾT TRÌNH CP2.pdf` |
| 25 | User-owned file relocated to canonical docs path (`oc1/feedback/`) and committed per explicit user decision 2026-10-05 — overrides the earlier "never committed" guard | `docs/nexus-document/oc1/feedback/pre-oc1-feedback-transcript.md`, 28056 bytes |
| 26 | The target plan directory is untracked and held only the brief before this file | `git status` shows `?? plans/2026-10-05-guided-documents-cp1-cp2/` |

**Findings that change the shape of the plan (not just background).**

- There is no `Project` entity, so canonical answers have to key off `case_id`. Section 3 explains why that
  is the minimal durable choice rather than introducing a parallel ownership root.
- The credit landmine is `submitIntake` (row 8): any new authoring job that reuses
  `triggerOmpAuditForCase` inherits a silent one-credit charge. Section 3 forbids that path by construction.
- The CP2 routing defect (row 6) is not a new feature; it is a pre-existing bug on the assessment path and
  is fixed in phase P5.
- There is no DOCX writer and no extractor (row 9), and the shared validation package cannot run its own
  tests (row 16). Both shape phase P0 and P3 of section 12.

---

## 2. Scope lock — the approved UX clauses, preserved

These are decided product rules. No phase may weaken them. Each phase in section 12 cites the clauses it
satisfies. Clause numbers are used throughout the rest of this plan.

1. Canonical project Q&A is **not checkpoint-owned**. One canonical question and answer set per project;
   templates select the relevant questions and document sections.
2. Each template shows **all relevant questions as a TOC, grouped into phases**. Open any unlocked
   question. Not a sequential wizard, not a chatbot.
3. A question contains **text, explanation, suggested actions**.
4. Per-template classification is **required / recommended / supplemental**.
5. **Unanswered is NOT locked** unless an explicit question-level dependency exists. A question is
   locked (greyed, unopenable) only when it declares a dependency on another question that is not yet
   complete. Phases are display grouping only (TOC sections) and never gate access. Locks never depend
   on optional answers.
6. **Manual Save draft and Complete buttons**; both persist; draft is in-progress; complete is
   user-declared; **no AI quality gate**; reopening is permitted; saving draft reverts completion.
7. Completed-answer edits **invalidate downstream relevance through the configured dependency graph**:
   keep text and completion history, flag needs-review; the user can edit or confirm still-valid;
   **required stale answers block generation**. Avoid dependency cycles.
8. Generation runs **only after required questions are complete AND required review flags are resolved**,
   and only on an **explicit user action**. **No realtime document preview while answering.** Optional
   omissions warn; they do not block.
9. AI **lightly edits** only: rearrange, merge repetition, group paragraphs and bullets. It preserves
   meaning, numbers, uncertainty, and provenance, **does not invent evidence**, and **does not silently
   reconcile contradictions**.
10. Output is **structured sections plus a deterministic DOCX renderer**; **do not paste each question as
    a heading**. **Source answer revisions are traced to the output.**
11. **No web editing of generated documents** — preview and download only. Edits happen in answers, then a
    **new immutable version** is generated. Word edits stay external.
12. Assessment attaches the **exact artifact plus checkpoint and prompt version**; reuse the existing
    evaluation, revision, and credit flow where appropriate.
13. **Upload for assessment is separate from Import project information.** Import extracts proposed Q&A
    **with source pointers**; the user selects and reviews them against current answers before accepting.
    **No silent overwrite. Accepted content is draft, never auto-complete.** Users can submit existing
    slides or documents directly for assessment without filling a Nexus template.
14. Requirements: **explicit access checks, safe file parsing, storage authorization, prompt-injection
    containment, idempotent jobs, and no credit spending for authoring by accident.**
15. Scope is exactly **CP1 and CP2**. Out of scope: CP3 and CP4, template marketplace or paywall, a general
    template admin builder, a Word-like editor, live collaboration, automatic bidirectional sync.
16. Video guidance, News, YouTube integration, and any pricing change are **not** part of this plan.

---

## 3. Architecture alternatives and the chosen minimal durable one

Four decisions determine the whole shape of the feature. Each is stated as alternatives, then a choice with
the reason, then the trigger that would make the rejected option correct later.

### D1 — Where canonical answers live

| Option | Shape | Verdict |
|---|---|---|
| A. New `Project` root owned by `owner_auth_user_id`, with `Case.project_id` | Canonical answers survive independent of a purchased case | Rejected for now |
| B. Store canonical answers inside the existing `LifecycleUnit.content` JSON | Zero new tables | Rejected |
| C. Key canonical answers by `case_id`, new tables owned by the new authoring module | Reuses the existing ownership and authorization root | **Chosen** |

**Chosen: C.** Reason: `Case` already carries project identity (`team_name`, `group_no`, `school`,
`course_context`, `current_checkpoint`, `owner_auth_user_id`) and is the single authorization root used by
every student route through `requireCaseAccess`. In this product the Case *is* the project — the authz
error string is literally `"Không tìm thấy dự án"`. Option C satisfies clause 1 (answers are not
checkpoint-owned, because they never reference `checkpoint_id`) while adding no second ownership root.
Option A would duplicate ownership, require backfilling `project_id` for existing cases, and force a new
authorization branch. Option B violates clause 1 outright, because `lifecycle_units` rows are checkpoint and
version artefacts that are fed to the audit pipeline, and clause 15 forbids scope creep into them.

**Limitation accepted and recorded:** answers live and die with the case (`onDelete: Cascade` exists on all
case children). Mitigation: generated artifacts are downloadable outside the app, and answer history is
never destructively rewritten.

**Revisit trigger (resolved):** Q1 was decided — authoring requires a case (option A rejected). If a
free-trial draft is ever needed, route it through the existing team-fit free-case path
(`payment_status = "not_required"`) rather than adding a `Project` root. Today the only case-creating
paths are paid checkout, the free-package path in `apps/api/src/modules/cases/application/create-case.usecase.ts`
(`locked_price === 0`), and that team-fit save path.

### D2 — Catalog as code or as database rows

| Option | Shape | Verdict |
|---|---|---|
| A. Catalog tables (`questions`, `templates`, `phases`, `template_questions`) plus seeding | Runtime editable | Rejected for now — Q5 (§14) sets DB catalog as the future goal |
| B. Catalog as versioned TypeScript constants in the shared validation package | No new tables, no admin CRUD | **Chosen** |

**Chosen: B.** Reason: clause 15 excludes a general template admin builder from this plan's scope, so runtime editing has
no consumer yet. (Q5 §14 sets option A as the future goal; this verdict is "not now", not "never".) A database catalog would add four tables, a seeding migration, cache invalidation, and an
authoring surface nobody asked for — that is exactly the kind of speculative generality this project
forbids. Code also makes the catalog reviewable in pull requests next to the rubric copies that justify it.
The one thing a database catalog would buy — history of catalog changes — is instead preserved by storing
`catalog_version` on every answer revision and every generated artifact, and by the rule that question IDs
are never reused or renumbered.

**Revisit trigger:** template marketplace, paywall, or per-institution template overrides enter scope.

### D3 — Where generation and import jobs run, and how DOCX is produced

| Option | Shape | Verdict |
|---|---|---|
| A. Reuse the sandbox agent runtime (`omp-queue`, `omp` CLI in yolo mode) for authoring and import | Zero new AI code | Rejected |
| B. In-API BullMQ worker on a dedicated `authoring-queue`, `generateObject` with fixed Zod schemas, DOCX from structured sections | One new module, no cross-service secret, no agent | **Chosen** |
| C. Synchronous Hono route that generates inline | Simplest to write | Rejected |

**Chosen: B.** Reasons, in order of weight:

1. **Prompt-injection containment (clause 14).** The sandbox runtime spawns the agent CLI with
   auto-approve and yolo approval mode, inside a job directory that also holds a knowledge database. Feeding
   untrusted imported documents to a tool-using agent in that mode is exactly the risk the clause names. With
   `generateObject` and a fixed Zod schema, injected text can only influence field values; it cannot change
   control flow, select tools, or alter the output structure. See section 8.
2. **Credit safety (clause 14).** `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts` is
   the only credit consumer, and it is reached from `submit-intake.usecase.ts:249` automatically. Authoring
   on a separate queue, driven by a separate coordinator that never imports the credit repository, makes a
   silent charge impossible rather than merely unlikely. A guard test enforces this (section 10, T9).
3. **No new deployment surface.** `ai`, `@ai-sdk/google`, `bullmq`, `ioredis`, and `zod` are already API
   dependencies (ground truth row 12). Option A additionally needs no less code but puts the model call
   behind a prompt-switch inside a yolo agent.
4. Option C fails clause 14 (idempotent jobs) and makes cancellation impossible; a full document pass with
   per-section model calls runs for tens of seconds and would be held on an open HTTP request.

**DOCX renderer:** new module, declarative OOXML writer. Preferred package is `docx` (a pure-JS, MIT,
declarative Document / Paragraph / TextRun writer that needs no template file). Fallback if that package is
rejected at review: hand-rolled minimal OOXML with `jszip`. Either way the renderer is deterministic: fixed
style table, no timestamps in document core properties, ordered section map. The Typst path in
`apps/api/src/modules/reports/infrastructure/pdf/` is left untouched and is not extended to DOCX.
**This is a dependency decision that needs explicit approval; installing dependencies was out of scope for
planning.** See section 14, open decision Q3.

### D4 — How generated documents are stored as immutable versions

| Option | Shape | Verdict |
|---|---|---|
| A. Attach `DocumentRecord` with `lifecycle_unit_id = null` (orphan artifact) | No new conventions | Rejected |
| B. New `gNN` generated-document unit under the target checkpoint, plus a `DocumentRecord` | Reuses the existing uniqueness and supersede mechanics | **Chosen** |
| C. Reuse `vNN` revision units for generated output | No new unit code | Rejected |

**Chosen: B.** Reason: `DocumentRecord` is unique on `(lifecycle_unit_id, doc_type, seq)`, and in Postgres a
`NULL` in that tuple does not deduplicate. Option A therefore allows duplicate artifacts on retried or
duplicated generate requests, which breaks clause 14 (idempotent jobs) at the storage layer. Option C
conflates student-uploaded revision units — which the audit pipeline consumes as submission versions — with
generated authoring output, and would corrupt the meaning of `Checkpoint.latest_version_no` and of the audit
input scoping. Option B introduces one new unit code, `gNN`, documented as an extension of invariant 10 of
`apps/api/src/modules/documents/domain/document-contract.ts`, and it inherits the existing
`superseded_at` supersede pattern for "new immutable version replaces the previous one" (clause 11).

---

## 4. Data model — net-new tables, keyed by `case_id`

Per D1 (answers keyed by case) and D2 (catalog as code), only **answers and the job/import
lifecycle** become database rows. The catalog itself is not persisted (section 5). Four new models,
one new `DocumentType` seed row, and one new unit-type value. All four models get
`@@index([case_id])` and `onDelete: Cascade` from `Case` so answers live and die with the case
(limitation accepted in D1).

### 4.1 `ProjectAnswer` (table `project_answers`)

One row per `(case_id, question_id)`, holding the **current** state of a canonical answer.

```prisma
model ProjectAnswer {
  id              String   @id @default(uuid())
  case_id         String
  question_id     String                    // stable catalog id, never renumbered
  status          String   @default("draft") // "draft" | "complete"
  answer_text     String   @db.Text
  needs_review    Boolean  @default(false)  // stale-flag after dependency edit (clause 7)
  review_reason   String?                   // which dependency changed
  catalog_version String                    // catalog version at last write
  updated_at      DateTime @updatedAt

  case Case @relation(fields: [case_id], references: [id], onDelete: Cascade)

  @@unique([case_id, question_id])
  @@index([case_id])
  @@map("project_answers")
}
```

`status` is user-declared only (clause 6): no AI writes this column. `answer_text` is plain text;
no rich markup, no per-question structure — structure belongs to the template output, not the answer.

### 4.2 `AnswerRevision` (table `answer_revisions`)

Append-only history. Never updated after insert; satisfies clause 7 (keep text and completion
history) and clause 10 (trace source answer revisions to output).

```prisma
model AnswerRevision {
  id                       String   @id @default(uuid())
  case_id                  String
  question_id              String
  revision_no              Int      @default(1)
  answer_text              String   @db.Text
  status_after             String                    // "draft" | "complete"
  source                   String                    // "manual" | "import"
  source_document_record_id String?  // provenance for imported answers (clause 13)
  catalog_version          String
  created_by               String
  created_at               DateTime @default(now())

  case Case @relation(fields: [case_id], references: [id], onDelete: Cascade)

  @@unique([case_id, question_id, revision_no])
  @@index([case_id])
  @@map("answer_revisions")
}
```

Every `PUT` to an answer inserts a new revision and bumps `revision_no` on `ProjectAnswer`; the
current text is the latest revision. Generation snapshots a set of `revision_no` values
(section 4.4) so output provenance is immutable even after later edits.

### 4.3 `ImportProposal` (table `import_proposals`)

Review-before-accept staging (clause 13). Extracted proposals are **not** answers until accepted,
and acceptance writes **draft** status only, never `complete`.

```prisma
model ImportProposal {
  id                       String   @id @default(uuid())
  case_id                  String
  source_document_record_id String
  status                   String   @default("pending") // "pending" | "accepted" | "rejected"
  proposed_items           Json     // [{ question_id, proposed_text, source_pointer }]
  created_by               String
  created_at               DateTime @default(now())

  case Case @relation(fields: [case_id], references: [id], onDelete: Cascade)

  @@index([case_id])
  @@map("import_proposals")
}
```

`source_pointer` is a paragraph/heading reference inside the source document, surfaced in the UI
so the user can verify the mapping before accepting. Accepting an item that already has a current
answer shows a side-by-side diff and never silently overwrites (clause 13).

### 4.4 `AuthoringJob` (table `authoring_jobs`)

Durable, idempotent generation and import job record (clause 14). JSON POST bodies hit the global
idempotency middleware, but the durable key here is authoritative because the global store is
in-memory and non-durable (ground truth row 13).

```prisma
model AuthoringJob {
  id                       String   @id @default(uuid())
  case_id                  String
  checkpoint_id            String
  template_key             String
  kind                     String                    // "generate" | "import"
  status                   String   @default("queued") // "queued" | "running" | "succeeded" | "failed"
  input_revision_snapshot  Json     // generate: { question_id: revision_no } ; import: doc record id
  output_lifecycle_unit_id String?  // set on success
  error                    String?
  idempotency_key          String   @unique
  catalog_version          String
  created_at               DateTime @default(now())
  updated_at               DateTime @updatedAt

  case Case @relation(fields: [case_id], references: [id], onDelete: Cascade)

  @@index([case_id])
  @@map("authoring_jobs")
}
```

`input_revision_snapshot` pins the exact answer revisions fed to the model, which is what clause 10
means by "source answer revisions are traced to the output."

### 4.5 New `DocumentType` seed row and unit-type value

- Add `generated_document` to the `DOCUMENT_TYPES` const in
  `apps/api/src/modules/documents/domain/document-types.ts` and seed one `document_types` row
  (`flow = "revision"`, `unit_scope = "version"`, `is_active = true`).
- Introduce unit code `gNN` as an extension of invariant 10 in
  `apps/api/src/modules/documents/domain/document-contract.ts`: a `LifecycleUnit` with
  `unit_type = "generated"`, `unit_code = "g<seq>"`, created under the target checkpoint and never
  consumed by the audit pipeline (D4, option B). The generated DOCX is a `DocumentRecord` with
  `source_kind = "generated"`, `doc_type = "generated_document"`, `direction = "outbound"`, linked to
  that `gNN` unit so the existing `@@unique([lifecycle_unit_id, doc_type, seq])` deduplicates retried
  generations.

---

## 5. Catalog as versioned TypeScript (D2)

Two-level catalog in the shared validation package (new subfolder, not the 982-line
`packages/validation/src/index.ts` — ground truth row 17).

```
packages/validation/src/catalogs/
  types.ts        // Catalog types + Zod schema a catalog must satisfy
  questions.ts    // canonical question registry: id -> { text, explanation, suggested_actions }
  cp1.ts          // CP1 template: phases -> [{ question_id, classification, required }]
  cp2.ts          // CP2 template (content reconciled — see section 9)
  index.ts        // exports + combined CATALOG_VERSION
```

- **Canonical question registry** (`questions.ts`): a question is `{ id, text, explanation,
  suggested_actions }` (clause 3). IDs are stable strings, never reused or renumbered.
- **Template** (`cp1.ts` / `cp2.ts`): a template is `{ template_key, title, phases }`, where a phase
  is `{ id, title, unlock_requires: question_id[], questions: [{ question_id, classification }] }`.
  `classification` is `required | recommended | supplemental` and lives **on the template**, not the
  question (clause 4), so the same canonical question can be required in CP2 but supplemental in CP1.
- **Unlock rule** (clause 5): a question is locked iff an `unlock_requires` dependency is not
  complete; unanswered-but-unlocked questions stay open. Phase unlock depends only on configured
  required prerequisites, never on optional answers. Dependency cycles are rejected at module load
  by a `validateCatalog()` assertion run in CI and in tests (T3).
- **`CATALOG_VERSION`** is a single monotonic string stamped on every `ProjectAnswer` write,
  `AnswerRevision`, and `AuthoringJob`. Catalog changes are reviewable in PRs next to the rubric
  copies that justify them (D2 rationale).

CP1 catalog is authored from the verified template at
`E:/FPT/Semester_7/EXE101/prompt/TEMPLATE_STARTUP_CHECKPOINT1_V2.docx` (ground truth row 22), with the
dedup required by the brief: merge §3.3 (data vs assumption) with §7 (evidence/assumptions), and
derive §9 summary + the checklist from already-answered fields rather than asking them as new
questions. CP2 catalog content is reconciled in section 9 (all three rubric files + lecturer
feedback read).

---

## 6. API surface — new `authoring` module

`casesRouter` already declares 31 routes (ground truth row 14) and must not grow. New module mounted
via the established pattern (ground truth row 14): `app.route("/api/authoring", authoringRouter)` in
`apps/api/src/index.ts`. Every handler begins with `requireCaseAccess(c, caseId, "authoring")`
(reuses `apps/api/src/shared/infrastructure/authorization.ts`, ground truth row 3).

| Route | Purpose | Clauses |
|---|---|---|
| `GET /api/authoring/cases/:caseId/templates` | List CP1/CP2 with progress (required done / total) | 1, 4 |
| `GET /api/authoring/cases/:caseId/templates/:templateKey/questions` | TOC: phases, per-question state (`draft`/`complete`/`locked`/`needs_review`), unlock flags | 2, 5 |
| `GET /api/authoring/cases/:caseId/questions/:questionId` | Question def + current answer + revisions | 3 |
| `PUT /api/authoring/cases/:caseId/questions/:questionId` | `{ action: "save_draft"\|"complete", text }` → insert revision, update current | 6, 7 |
| `POST /api/authoring/cases/:caseId/imports` | multipart: extract → create proposal (no answer writes) | 13 |
| `GET /api/authoring/cases/:caseId/imports/:importId` | Proposed items + source pointers | 13 |
| `POST /api/authoring/cases/:caseId/imports/:importId/accept` | `{ accept: [question_id] }` → draft-only answers | 13 |
| `POST /api/authoring/cases/:caseId/templates/:templateKey/generate` | Dispatch generation job (idempotent) | 8, 14 |
| `GET /api/authoring/cases/:caseId/jobs/:jobId` | Job status / error | 14 |
| `GET /api/authoring/cases/:caseId/documents/:unitId` | Preview metadata + download URL | 11 |

Generation is **not** a long-running HTTP request (D3, option C rejected): the route creates an
`AuthoringJob`, enqueues on the dedicated `authoring-queue`, and returns `202` with the job id.
Idempotency: a second `generate` for the same `template_key` while a job is `queued|running` returns
the existing job; after success a new call with a changed answer snapshot creates a new `gNN` version.

---

## 7. Generation and import pipeline (D3, option B)

Dedicated BullMQ queue `authoring-queue` in `apps/api`, worker consumed in-process (same pattern as
the existing BullMQ producer; no cross-service secret, no sandbox agent). Model call uses
`generateObject` with a fixed Zod schema — the precedent is
`apps/api/src/modules/ai-engine/application/evaluate-team-fit.usecase.ts` (ground truth row 12).

### 7.1 Generation (light edit)

1. Validate gate (clause 8): all `required` questions `complete` AND no `needs_review` flag on any
   required question. Optional omissions produce a warning, not a block.
2. Snapshot `{ question_id: revision_no }` into `AuthoringJob.input_revision_snapshot`.
3. Per output section, call `generateObject` over the answers feeding that section with a system
   prompt encoding clause 9 (light edit only: rearrange, merge repetition, group paragraphs and
   bullets; preserve meaning, numbers, uncertainty, and provenance; never invent evidence; never
   silently reconcile contradictions). Output Zod schema:
   `{ sections: [{ id, heading, blocks: [{ kind: "paragraph"|"bullet_list"|"table", ... }] }] }`.
4. Render structured sections deterministically to DOCX (section 7.3), upload to Cloudinary as
   `generated`, create the `gNN` `LifecycleUnit` + `DocumentRecord` (D4, option B).

### 7.2 Import (extract → propose → accept)

1. Text extraction in-API: `.md`/`.txt` parsed directly; `.docx` via `mammoth`; `.pdf` via
   `pdf-parse` (Q3/Q4 resolved). Extracted text is **untrusted data** (section 8).
2. `generateObject` maps extracted text → `[{ question_id, proposed_text, source_pointer }]`.
3. Stored as `ImportProposal` (pending). The user reviews and accepts; acceptance writes `draft`
   answers with `source = "import"` and `source_document_record_id` set (clause 13).

### 7.3 DOCX renderer (deterministic)

New module `apps/api/src/modules/authoring/infrastructure/docx/`. Preferred dependency `docx`
(declarative `Document`/`Paragraph`/`TextRun`, MIT, no template file). Determinism rules: fixed style
map, ordered section iteration, no `Date`/timestamp in core properties, no locale-dependent
formatting. The existing Typst PDF chain under `apps/api/src/modules/reports/infrastructure/pdf/` is
untouched and not extended to DOCX. Dependency `docx` is resolved (Q3).

---

## 8. Security (clause 14)

| Concern | Control |
|---|---|
| Access control | `requireCaseAccess` on every authoring route; upload is currently session-only (ground truth row 10) — the import upload route must add the case access check |
| Prompt injection | `generateObject` with fixed Zod schema: injected text can only affect field values, never control flow or tool selection (vs the yolo sandbox agent — D3 reason 1) |
| Safe file parsing | Keep the extension allowlist + 15MB cap from `document-upload-rules.ts`; add magic-byte sniff; extraction happens in-API, never inside the yolo sandbox |
| No accidental credit spend | `authoring-queue` + its coordinator never import `omp-audit-coordinator.ts` or the credit repository; the intake credit trigger (ground truth row 8) is untouched. Guard test T9 |
| Idempotent jobs | Durable `AuthoringJob.idempotency_key` (`@unique`); the global in-memory idempotency store is non-durable and skips multipart (ground truth row 13), so the durable key is the source of truth |
| Storage authorization | Generated DOCX uploads as `source_kind = "generated"`; download via existing generated-download path (no server proxy, invariant 13) |

---

## 9. CP2 rubric — reconciled and ready (Q2 RESOLVED)

All three rubric files + the lecturer-feedback notes read and reconciled. The **active format is the
paired debate** (current, later-dated); the English requirements supply detailed grading and the
mandatory gates.

**Source roles**
- `E:/FPT/Semester_7/EXE101/HD  Bài nộp (Proposal) và Thuyết trình debate lấy CP2.pdf` — PRIMARY
  structure (current lecturer guide): the 5-part Proposal + VPC appendix + 4 grading columns
  (Proposal / Presentation / Answering counter-questions / Asking counter-questions).
- `E:/FPT/Semester_7/EXE101/THÔNG BÁO về việc THUYẾT TRÌNH CP2.pdf` — logistics + debate timing
  (07-min presentation, paired debate, 10-min lecturer Q&A). Confirms the current paired-debate format.
- `E:/FPT/Semester_7/EXE101/CP2-Requirements-EXE101SP26 (5).pdf` — DETAILED rubric (150-pt report +
  50-pt presentation): mandatory gates, Porter's Five Forces, buyer-persona elements, survey design,
  format, and AI-disclosure rules.
- `docs/nexus-document/cp2/feedback/cp2-lecturer-feedback-summary.md` — lecturer feedback notes
  (evidence, real interviews, TAM-SAM-SOM bottom-up, prototype alignment).

**Format conflict (resolved):** the English rubric says "15 min + 5 min Q&A" (single-group). The
THÔNG BÁO (current) says 07-min presentation + paired debate + 10-min lecturer. The catalog uses the
**current paired-debate format**; the 15-min figure is legacy.

**CP2 template structure (5 phases + cross-cutting)**

Phase 1 — Tổng quan ý tưởng & cơ hội (Problem/Solution + VPC)
  - Vấn đề / Nhu cầu khách hàng (problem/need)
  - Giải pháp (solution)
  - Cơ hội = Vấn đề/Nhu cầu + Giải pháp
  - VPC Bức tranh Khách hàng: Jobs to be done, Pains, Gains
  - VPC Bức tranh Sản phẩm: Products & Services, Pain Relievers, Gain Creators

Phase 2 — Customer Discovery (nghiên cứu + dữ liệu sơ cấp)
  - Mục tiêu nghiên cứu (câu hỏi nghiên cứu cụ thể)
  - Quá trình Khám phá khách hàng (Customer Discovery)
  - Expert interviews — REQUIRED, 2 experts, ≥6 tháng kinh nghiệm → AUTO-FAIL nếu thiếu
      (profile/contact + learning points: market view / beware-of / experience with target customers / khác)
  - Survey — REQUIRED, ≥100 respondents → AUTO-FAIL nếu thiếu
      (objective & audience, method, questionnaire design ≥2 loại câu hỏi & ≥7 câu, recruitment,
       incentives, anonymity [bắt buộc phần demographic + email], tools, data retention, informed
       consent, sampling/response rate, analysis, conclusions)
  - [Optional] Pain Point Interviews — ≥10/stakeholder, 3 câu tổng hợp
      (có nỗi đau thật không? là gì? có nhiều không?)

Phase 3 — Quy mô thị trường & cấu trúc (TAM-SAM-SOM + cạnh tranh)
  - TAM / SAM / SOM (khuyến khích bottom-up cho SOM)
  - Porter's Five Forces (rivalry / new entrants / substitution / buyer power / supplier power) + vị trí phòng thủ
  - Competitive Analysis Framework (Direct/Indirect/Substitute/New entrants) + Actionables + commonalities
  - Đối thủ vô hình (trì hoãn, "không làm gì cả", thói quen) — cách thuyết phục khách đổi thói quen
  - [Optional] Competitors' Criteria Table — theo metric, 9 đối thủ + startup mình để đạt điểm tối đa

Phase 4 — Trình diễn MVP & vòng lặp tinh chỉnh
  - Demo MVP / Prototype
  - Iterating & Refining từ phản hồi khách hàng (giả định nào sai, tính năng thêm/bớt/sửa)
  - Bất ngờ & Pivot (đổi tính năng, B2C→B2B, đổi kênh/phân phối)

Phase 5 — PMF ban đầu & 4P
  - Dấu hiệu PMF (hài lòng, tín hiệu nhu cầu, retention)
  - 4P: Product / Price / Promotion / Place

Cross-cutting (bắt buộc; trượt nếu thiếu)
  - AI disclosure statement (đoạn nêu dùng AI để làm gì + prompt đã dùng) → AUTO-FAIL nếu thiếu
  - Harvard referencing
  - Appendix: hồ sơ chuyên gia, dữ liệu survey raw
  - Format: 12pt body / 12-16pt headings, Arial/Times New Roman, double-spacing, 2.5cm margins, 5-25 trang

Debate prep (gắn với 2 cột điểm phản biện)
  - Phòng thủ: dùng dữ liệu phỏng vấn sâu làm "tấm khiên"
  - Tấn công: soi SOM ("chiếm 1% thị trường tỷ đô" fallacy), đối thủ vô hình, retention nếu dễ sao chép

---

## 10. Tests (node:test, DB-free helpers)

Follow the established runner (`apps/api/package.json:11`) and the DB-free helper-import pattern
(ground truth row 15). Fix the shared-validation test gap (ground truth row 16) by adding a
`test` script so catalog validation actually runs in CI.

| ID | Test | Proves clause |
|---|---|---|
| T1 | `requireCaseAccess` rejects non-owner/member/supporter on authoring routes | 14 |
| T2 | draft/complete/reopen state machine: draft→complete→reopen→draft | 6 |
| T3 | `validateCatalog()` rejects dependency cycles; lock/unlock logic matches configured prerequisites | 5, 7 |
| T4 | generate gate: blocked when required incomplete or `needs_review` set; optional omissions warn only | 8 |
| T5 | idempotent generate: same snapshot → same `gNN` version; new snapshot → new version | 14, 11 |
| T6 | light-edit contract: output preserves numbers/uncertainty/provenance; does not add evidence (prompt+output fixture) | 9 |
| T7 | DOCX determinism: same structured input → byte-identical output | 10 |
| T8 | import: proposal staged; accept writes draft-only, source pointers set; never overwrites existing | 13 |
| T9 | credit guard: authoring coordinator has no import path to the credit repository (module-import guard) | 14 |

---

## 11. Migration safety gates

Governed by `.agents/rules/prisma-migration-safety.md` (read before any schema work; the brief
mandates production-safety assumption because `DIRECT_URL` is unknown).

1. Draft migration with `prisma migrate dev --create-only --name guided_documents` (create-only;
   full `migrate dev` is forbidden).
2. Migration contains **only** additive changes: the four new tables (section 4) + one
   `document_types` seed row. No `DROP`, no `DELETE`, no `TRUNCATE`, no edit of applied migrations.
3. Confirm local target before generate; human performs backup and the production deploy outside
   the agent (per brief).
4. Re-run `prisma generate` after the migration is approved, and regenerate the client for all
   workspaces.

---

## 12. Phases

| Phase | Deliverable | Clauses satisfied | Gate to next |
|---|---|---|---|
| **P0** Foundation | Authoring module scaffold; shared-validation test script (row 16); add deps `docx` + `mammoth` + `pdf-parse` (Q3/Q4 resolved) | 14 | Deps installed |
| **P1** Data model | Create-only migration: 4 tables + `generated_document` doc type + `gNN` unit-code doc update | 1, 7, 10, 11, 13, 14 | Migration drafted, not applied |
| **P2** Catalog | `catalogs/` in shared validation: CP1 full (dedup'd); CP2 from reconciled rubric (section 9) | 1, 3, 4, 5 | CP1 schema + validator |
| **P3** API | `authoring` module: Q&A CRUD, dependency invalidation, import propose/accept, generate dispatch, access checks | 5, 6, 7, 8, 13, 14 | T1–T5 green |
| **P4** Frontend | Phase-grouped TOC, question editor (save draft/complete), import review, generate preview/download, case-workspace integration (mobile-responsive student surface) | 2, 6, 8, 11, 13 | Manual UX pass |
| **P5** Assessment routing | Fix `saveOmpAuditReport` CP1 mis-route (row 6); attach exact artifact + checkpoint + prompt version; reuse evaluation/revision/credit flow | 12 | Review regression |
| **P6** Hardening | T6–T9 (light-edit, DOCX determinism, import no-overwrite, credit guard); idempotency + storage authorization | 9, 10, 14 | Full suite green |

---

## 13. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| CP2 rubric unread → catalog invented | Ships wrong questions, violates rubric | RESOLVED — reconciled in section 9 |
| `case_id`-keyed answers die with the case | Data loss if case deleted | Accepted in D1; downloadable artifacts + non-destructive history |
| `docx` dependency rejected | Renderer blocked | RESOLVED → `docx` chosen (Q3) |
| Imported text reaches the model | Prompt injection / fabricated mapping | Fixed Zod schema, in-API extraction, draft-only accept (section 8) |
| Generation reuses intake credit path | Silent charge | Separate queue + coordinator; guard test T9 |
| Scope creep into CP3/CP4/marketplace | Over-build | Clause 15/16 explicit; revisit triggers in section 3 |

---

## 14. Open decisions

- **Q1 — authoring before a case exists. ĐÃ CHỐT (theo khuyến nghị).** Bắt buộc có case; data model
  keyed theo `case_id` (mục 4), không thêm `Project` root. Nếu sau này cần free-trial draft, đi qua
  đường team-fit free-case (`payment_status = "not_required"`) sẵn có.
- **Q2 — CP2 catalog content. ĐÃ CHỐT.** Cả 3 file rubric + feedback giảng viên đã đọc, hoà giải
  thành cấu trúc CP2 đầy đủ ở mục 9. Gate P2 đã thông.
- **Q3 — DOCX dependency. ĐÃ CHỐT → `docx`** (khai báo, MIT, đúng mục đích; bỏ `jszip` hand-roll).
  Thêm 1 dependency vào `apps/api`.
- **Q4 — text-extraction dependency. ĐÃ CHỐT → `mammoth` (`.docx`) + `pdf-parse` (`.pdf`).** Đã cài &
  xác minh API (2026-10-05): `mammoth.extractRawText({ buffer })`; `import { PDFParse } from 'pdf-parse'`
  → `new PDFParse({ data }).getText()` (nhớ `.destroy()`); `docx` `Document`/`Packer` render OK.
  Thêm 3 dependency vào `apps/api`: docx@9.8.1, mammoth@1.13.0, pdf-parse@2.4.5.
- **Q5 — Template & câu hỏi soạn ở đâu. ĐÃ DUYỆT (user 2026-10-05) → C hướng tới B.**
  Giữ catalog-as-code (mục 3 D2 option B) làm chuẩn chạy CP1-CP2; Template Builder (admin UI + DB,
  D2 option A) là đích kỹ thuật về sau theo `revisit trigger` ở D2. Marketplace/paywall vẫn out of scope
  (clause 15, Q8). Logic authoring nhận `Template` object chung chung nên đổi nguồn code→DB không vứt code P3.
- **Q6 — "Hệ thống tự viết tài liệu" = merge hay AI. ĐÃ DUYỆT (user 2026-10-05) → C: merge trước, AI polish sau.**
  P6 worker làm merge (điền câu trả lời vào DOCX, renderer deterministic mục 7.3) trước; AI polish là
  lớp gia tăng gắn sau.
- **Q7 — Phạm vi checkpoint. ĐÃ DUYỆT (user 2026-10-05) → A: CP1-CP2 trước.** Chưa làm CP3/CP4 (thiếu rubric).
- **Q8 — Khoá template trả phí. ĐÃ DUYỆT (user 2026-10-05) → C: để sau.** Làm xong lõi "điền → tải tài liệu" đã.
- **Q9 — Luồng điền tài liệu. ĐÃ DUYỆT (user 2026-10-05) → cả 2, ưu tiên Luồng 1 (guided Q&A) trước.**
  Luồng 2 (upload import) làm sau.
- **Q10 — Từ ngữ phân loại câu hỏi. ĐÃ CHỐT (user 2026-10-05) → "bắt buộc / khuyến nghị / bổ sung".**
  Bỏ 3 từ "rất quan trọng / quan trọng / làm rõ"; mapping: rất quan trọng = bắt buộc, quan trọng = khuyến nghị,
  làm rõ = bổ sung. Clause 4 giữ nguyên cấu trúc per-template, chỉ chốt từ ngữ.
- **Q11 — Phạm vi gate tạo tài liệu. ĐÃ CHỐT (user 2026-10-05) → tier 1 (chỉ câu "bắt buộc").**
  "Trả lời toàn bộ câu quan trọng" = chỉ tier bắt buộc; câu khuyến nghị/bổ sung thiếu chỉ cảnh báo, không chặn.
  Clause 8 và §7.1 giữ nguyên (đã đúng giả định tier 1).
- **Q12 — Clause 12 (assessment gắn version). ĐÃ CHỐT (user 2026-10-05, đồng ý ngầm).**
  User không phản đối đề xuất "quy tắc kỹ thuật" ở U26 → giữ clause 12, không cần hỏi lại.


