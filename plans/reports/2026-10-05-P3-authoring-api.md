# P3 — Authoring API (Guided Documents CP1–CP2) — Implementation Report

**Date:** 2026-10-05 · **Branch:** dev · **Plan:** `plans/2026-10-05-guided-documents-cp1-cp2/plan.md` §6

## Status

**RUNTIME BLOCKED until P1 migration applied (tables missing in DB); code compiles via regenerated client.**

The `authoring` module is fully implemented against the plan §6 contract. All Prisma queries
target the four net-new models (`project_answers`, `answer_revisions`, `import_proposals`,
`authoring_jobs`) that exist in `prisma/schema.prisma` but **not yet in the database** (P1
migration is paused). `prisma generate` was run once to regenerate the typed client from the
schema file, so the code type-checks clean; any live request will fail at the DB layer until P1
is applied — that is expected and out of scope for this phase.

## Routes implemented (method + path)

| Method | Path | Purpose | Clauses |
|---|---|---|---|
| GET | `/api/authoring/cases/:caseId/templates` | List CP1/CP2 with progress (required done/total) | 1, 4 |
| GET | `/api/authoring/cases/:caseId/templates/:templateKey/questions` | TOC: phases, per-question state, unlock flags | 2, 5 |
| GET | `/api/authoring/cases/:caseId/questions/:questionId` | Question def + current answer + revisions | 3 |
| PUT | `/api/authoring/cases/:caseId/questions/:questionId` | `{ action: save_draft\|complete, text }` → revision + update | 6, 7 |
| POST | `/api/authoring/cases/:caseId/imports` | multipart: extract → create proposal (no answer writes) | 13 |
| GET | `/api/authoring/cases/:caseId/imports/:importId` | Proposed items + source pointers | 13 |
| POST | `/api/authoring/cases/:caseId/imports/:importId/accept` | `{ accept: [question_id] }` → draft-only answers | 13 |
| POST | `/api/authoring/cases/:caseId/templates/:templateKey/generate` | Dispatch generation job (idempotent) | 8, 14 |
| GET | `/api/authoring/cases/:caseId/jobs/:jobId` | Job status / error | 14 |
| GET | `/api/authoring/cases/:caseId/documents/:unitId` | Preview metadata + download URL | 11 |

Router mounted in `apps/api/src/index.ts` via `app.route("/api/authoring", authoringRouter)`.
`casesRouter` was **not** grown. Every handler begins with `requireCaseAccess(c, caseId)` —
including the import upload route (closes the session-only upload gap, plan §8 / row 10).

## Files changed

| File | Change |
|---|---|
| `packages/validation/package.json` | +1 line: `./catalogs` subpath export (authorized by supervisor) |
| `apps/api/src/index.ts` | +import + `app.route("/api/authoring", authoringRouter)` |
| `apps/api/src/modules/authoring/domain/authoring-domain.ts` | new (292) — pure catalog logic |
| `apps/api/src/modules/authoring/domain/file-sniff.ts` | new (19) — magic-byte sniffing |
| `apps/api/src/modules/authoring/infrastructure/file-extraction.ts` | new (68) — in-API md/txt/docx/pdf extraction |
| `apps/api/src/modules/authoring/infrastructure/queue/authoring-queue.ts` | new (48) — dedicated `authoring-queue` producer |
| `apps/api/src/modules/authoring/application/authoring-persistence.ts` | new — shared prisma helpers |
| `apps/api/src/modules/authoring/application/answer.service.ts` | new — Q&A CRUD |
| `apps/api/src/modules/authoring/application/import.service.ts` | new — import propose/accept |
| `apps/api/src/modules/authoring/application/generate.service.ts` | new — generate dispatch + job/doc reads |
| `apps/api/src/modules/authoring/http/authoring.controller.ts` | new — 10 handlers |
| `apps/api/src/modules/authoring/http/authoring.routes.ts` | new — router |
| `apps/api/src/shared/infrastructure/tests/authoring-domain.test.ts` | new (205) — 10 DB-free tests |

## Test results

- `bunx tsx --test src/shared/infrastructure/tests/authoring-domain.test.ts` → **10/10 pass**.
- `bunx tsc --noEmit -p tsconfig.json` (API package) → **exit 0** (clean type-check).

Tests cover: T2 (draft/complete/reopen state machine), T3 (phase lock/unlock + transitive
dependency invalidation), T4 (generation gate: required incomplete/stale block; optional warns
only), T5 (snapshot-scoped idempotency key), T8 (import accept: draft-only, never overwrite),
plus template progress, per-question state precedence, catalog-load validation, and magic-byte
file sniffing. All DB-free — the domain is a deterministic function of `(template, answers)`.

## Design decisions & deviations (recorded)

1. **Catalog import path.** The P2 catalog barrel was not importable from the API (`@repo/validation`
   had no `./catalogs` subpath export). Per supervisor authorization, added a single
   `"./catalogs"` export mirroring the existing `"."` object; imported as
   `@repo/validation/catalogs`. Catalog remains isolated from `@repo/validation` main (its
   fail-fast `validateCatalog` does not run for unrelated main-index consumers).
2. **`requireCaseAccess` scope.** Plan §6 wrote `requireCaseAccess(c, caseId, "authoring")`; the
   real third param is a `CaseAccessScope` object. Used the default scope (student + supporter +
   admin), which is the correct authoring authorization set.
3. **Import propose (P3 scope).** The route validates the upload (extension allowlist `.md/.txt/
   .docx/.pdf` + 15 MB + magic-byte sniff), extracts raw text in-API (mammoth / pdf-parse /
   plain), stores the source as a `DocumentRecord` (provenance), and creates a `pending`
   `ImportProposal` with the raw extraction staged under `question_id: ""` (unmapped sentinel).
   The AI mapping of raw text → per-question `proposed_items` is the **P6 worker**'s job, not P3.
4. **Generate dispatch (P3 scope).** `POST …/generate` validates the gate, snapshots
   `{ question_id: revision_no }`, dedups (in-progress guard + durable `idempotency_key`), creates
   the `AuthoringJob`, enqueues on the dedicated `authoring-queue`, and returns `202`. The worker
   / coordinator (light-edit `generateObject` + deterministic DOCX render) is P6.
5. **Credit safety.** The `authoring` module (including the queue producer) imports nothing from
   `omp-audit-coordinator` or the credit ledger — a silent one-credit spend is impossible by
   construction (plan §3 landmine). Guard test T9 is P6 hardening.

## Not done / follow-ups

- **P1 migration** must be applied (4 tables) before any live DB call works.
- **P6 worker** must consume `authoring-queue` (generate light-edit + DOCX render; import AI
  mapping) and set `AuthoringJob.output_lifecycle_unit_id` + create the `gNN` `LifecycleUnit`.
- **T1** (`requireCaseAccess` rejection path) is exercised by the shared authz primitive, not
  re-tested here — it would require prisma-module mocking rather than a pure unit test.

## Next steps

1. Apply P1 migration (gated, human-approved).
2. P6: authoring worker/coordinator + DOCX renderer + T6–T9 (light-edit contract, DOCX
   determinism, import no-overwrite, credit guard).
3. P4 (frontend) — remains out of scope for this phase.
