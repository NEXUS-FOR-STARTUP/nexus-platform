# Zod Validation Package Structure — Research

**Date:** 2026-08-03
**Scope:** `@repo/validation` in Turborepo monorepo (Next.js 16 FE + Hono BE + Prisma 7)
**Current state:** flat single `src/index.ts` (5 schemas, all input-side), `"." → ./src/index.ts`, no Prisma coupling. 9 consumers: 4 in `apps/api` (routes, dto, 2 usecases), 5 in `apps/web-1` (page, hooks, lib, component).

---

## Finding 1 — File layout: domain entities, NOT flat index, NOT request/response split

**Verdict: split by domain entity. Keep requests.ts/responses.ts per-entity only if DTOs are complex.**

Production pattern (t3-oss, cal.com, dub): one folder per domain entity; schema + composed variants + inferred type co-located. Flat `index.ts` dies at ~15 schemas (merge conflicts, no discoverability). Splitting *by concern* (requests.ts / responses.ts) duplicates shared base shapes and forces cross-imports; compose instead.

```ts
// packages/validation/src/team-fit/idea.ts
export const ideaBase = z.object({ projectName: z.string().min(2).max(200) });
export const IdeaInputSchema = ideaBase.extend({ /* input-only fields */ });
export const IdeaOutputSchema = ideaBase.extend({ id: z.string(), createdAt: z.coerce.date() });
export type Idea = z.infer<typeof ideaBase>;
// packages/validation/src/index.ts — thin barrel, explicit named exports
export * from './team-fit/idea.js';
```

Rules:
- Base schema (DB-shaped) + `.extend()`/`.pick()`/`.omit()` variants → `Create`, `Update`, `Output`. KISS: 3 variants max per entity.
- Barrel exports only the root `.`; each entity exported explicitly, no `export *` at package root.
- **Adoption risk:** low. Pure file moves, zero behavior change.

## Finding 2 — Prisma types: zod NOT single source of truth

**Verdict: keep Prisma-generated types as-is; generate Zod schemas FROM the Prisma schema; do not hand-maintain a mirrored entity layer.**

`zod-prisma-types` (chrishoermann) is in **limited maintenance** — maintainer recommends `prisma-zod-generator` (Omar Dulaimi) for new projects. `prisma-zod-generator` explicitly supports Prisma 7 (TS-based engine) + Zod 4; `zod-prisma-types` docs only cover Prisma ≤6.x. Hand-written zod entity schemas drift from the DB — the exact failure mode shared packages exist to kill.

```prisma
generator zod {
  provider   = "prisma-zod-generator"
  output     = "../../packages/validation/src/generated"
  // modelCase/style options; use "// @zod.custom.use(...)" comments for refinements
}
// generated: export const IdeaModelSchema = z.object({...});
// export type Idea = z.infer<typeof IdeaModelSchema>;  // mirrors Prisma Idea
```

- **Trade-off:** generated schemas need post-processing (relation pruning, `Decimal`→`z.coerce`). Mitigate: `@zod.omit()` comments + wrappers that extend generated base (Finding 1's `ideaBase` becomes the *wrapped* schema, not the raw generated one).
- **Not recommended:** replacing Prisma client types with zod-inferred types. Prisma's generated types are query-aware (`include`/`select` result types); zod's are static. Export BOTH — zod for validation/API boundary, Prisma types for repo/query layer.
- **Adoption risk:** medium. Adds a generator + generated dir to git. Must run `prisma generate` in CI before API build (already in build pipeline per AGENTS.md).

## Finding 3 — Request vs response DTOs: both live in the same package, but BE-only shapes stay out of the FE bundle

**Verdict: yes, both in `@repo/validation` — but response schemas must be FE-safe (no server-only deps).**

cal.com-style contracts: input schemas drive `req.body` parsing + FE form validation; output schemas drive serialization/`z.infer` types. Keeping both in one package prevents contract drift (the whole point). Danger: response schemas that pull in Prisma types (`z.object({ user: PrismaUser })`) leak DB coupling into FE. Fix: response schemas composed from the *zod* entity schema (Finding 2 wrapper), never raw Prisma types.

```ts
// packages/validation/src/team-fit/index.ts
export const EvaluateTeamFitRequestSchema = TeamFitInputSchema.extend({ traceId: z.string().uuid().optional() });
export type EvaluateTeamFitRequest = z.infer<typeof EvaluateTeamFitRequestSchema>;
export const TeamFitReportSchema = z.object({ teamGaps: z.array(z.string()) });
export type TeamFitReport = z.infer<typeof TeamFitReportSchema>;
```

- If a response type is BE-only (never rendered client-side), keep it in `apps/api` DTO layer — existing `team-fit.dto.ts` already does this. Rule: *FE-visible shapes → shared; BE-internal shapes → API module.*

## Finding 4 — Import paths & tree-shaking: subpath exports + `sideEffects: false`, no god barrel

**Verdict: keep `.` root barrel for convenience, add subpath exports per entity group, mark `sideEffects: false`.**

Zod's fluent method API shakes poorly; a root barrel of many entities forces bundlers to evaluate the whole module graph. Explicit exports + subpaths + `sideEffects: false` give Next.js (webpack/turbopack) and Hono the pruning hooks.

```jsonc
{
  "name": "@repo/validation",
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": "./src/index.ts",
    "./team-fit": "./src/team-fit/index.ts",
    "./generated/*": "./src/generated/*"   // zod-prisma-generated schemas, BE/DB-coupled
  }
}
```

```ts
// FE (web-1) — schema for form + inferred type, no DB shapes
import { TeamFitInputSchema } from '@repo/validation/team-fit';
// BE (api) — full surface incl. generated model schemas
import { IdeaModelSchema } from '@repo/validation/generated/idea';
```

- **Rule of thumb:** FE imports only `./<entity>` or root; BE may import `./generated/*`. Enforce with ESLint `no-restricted-imports` per app (FE banned from `./generated/*`).
- **Adoption risk:** low-medium. Subpath exports break nothing (root stays). Note: exported source (`./src/*`) requires consumer bundlers to compile TS — fine for turbopack/webpack/tsx, already the repo's working model.

## Finding 5 — Migration: Expand → Migrate → Contract, dual-export via `@deprecated` re-export shims

**Verdict: move schemas into `@repo/validation` incrementally per entity; keep old local definitions as `@deprecated` re-exports until consumers flip. One breaking change at a time.**

Parallel-change pattern (expand/migrate/contract). Order for this repo:
1. **Expand:** add each entity folder to `@repo/validation` (from current flat `index.ts`). Keep old symbols exported at root — zero consumer churn.
2. **Migrate:** flip consumers one at a time (`grep -rl "@repo/validation" apps/` → 9 files; each is a 1-line import change). For BE-only types living in `apps/api`, add shim:
   ```ts
   // apps/api/src/modules/ai-engine/domain/team-fit.dto.ts
   /** @deprecated import from @repo/validation/team-fit instead */
   export { TeamFitReport, TeamFitReportSchema } from '@repo/validation/team-fit';
   ```
3. **Contract:** after all consumers migrate, delete shims + remove stale root exports.

- **Guardrail:** keep `IdeaInputSchema`/`TeamFitInputSchema`/`TeamFitFreeReportSchema` exported from root `index.ts` until BOTH apps reference the new path — grep confirms 0 remaining matches, then contract.
- **Risk:** low if steps are atomic (no schema-shape changes during moves). Never combine move + shape change in one commit.

---

## Ranked recommendations

| # | Action | Effort | Risk | Why |
|---|--------|--------|------|-----|
| 1 | Split `index.ts` → `src/<entity>/` folders + thin barrel | S | Low | KISS; unblocks everything below |
| 2 | Adopt `prisma-zod-generator` for DB-entity schemas (skip `zod-prisma-types` — unmaintained vs Prisma 7) | M | Med | Single source of truth for DB shape |
| 3 | Add subpath exports + `sideEffects: false`; ban FE from `./generated/*` | S | Low | Tree-shaking + boundary enforcement |
| 4 | Migrate consumers entity-by-entity via `@deprecated` shims | M | Low | No breaking change ever lands |

**Skip (YAGNI):** full request/response folder split, zod as replacement for Prisma client types, generated-CRUD modes (`zod-prisma-generator`'s `createMany` etc.).

## Limitations

- No live verification of `prisma-zod-generator` vs Prisma 7 *this repo's* exact version — read `docs/db-migration-guide.md` before adding generator.
- cal.com/t3-oss patterns sourced from secondary write-ups, not direct repo reads.
- Tree-shaking numbers (bundle deltas) not measured here — only structural best practice.
