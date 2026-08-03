---
title: "Codebase Cleanup & Shared Validation Convention"
description: "Delete dead code, migrate types to @repo/validation, remove unused deps, enforce shared validation convention"
status: pending
priority: P1
effort: 6h
issue: null
branch: dev
tags: [refactor, tech-debt, backend, frontend, validation]
blockedBy: []
blocks: []
created: 2026-08-03
---

# Codebase Cleanup & Shared Validation Convention

## Overview

Fix core problem: no shared validation convention + no backfill after @repo/validation created. 3-stage build history (Lean DDD scaffold → MVP inline → wave-system ai-engine) left dead files, duplicate types, misplaced schemas, and 16 unused deps. This plan deletes dead code, moves schemas to correct layer, migrates 4 FE entity types to shared package, rewrites manual validate to zod, and adds convention + tooling.

## Root Cause

@repo/validation created mid-development (wave-system). Only 1/8 modules use it (ai-engine). 7 older modules use inline/manual validation. No backfill. Result: 5 empty schema placeholders, 1 empty domain file, 1 dead backward-compat shim, 4 FE-only entity types copying Prisma, 3 duplicate getSession, 16 unused deps.

## Cross-Plan Dependencies

None. This is a standalone cleanup plan.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Delete Dead Tracked Files](./phase-01-delete-dead-files.md) | Pending |
| 2 | [Move Team-Fit Schema to @repo/validation](./phase-02-move-team-fit-schema.md) | Pending |
| 3 | [Migrate Entity Types to @repo/validation](./phase-03-migrate-entity-types.md) | Pending |
| 4 | [Rewrite Cp1Intake Schema to Zod](./phase-04-rewrite-intake-schema.md) | Pending |
| 5 | [Cleanup Duplicates & Dead Exports](./phase-05-cleanup-duplicates-exports.md) | Pending |
| 6 | [Remove Unused Dependencies](./phase-06-remove-unused-deps.md) | Pending |
| 7 | [Add Knip + Convention Document](./phase-07-knip-convention.md) | Pending |

## Red Team Review

### Session — 2026-08-03
**Findings:** 34 raw (4 reviewers), 18 unique after dedup, 10 accepted, 5 rejected, 3 user-decided

| # | Finding | Severity | Disposition |
|---|---------|----------|-------------|
| 1 | Phase 1-3 file conflict (package.types.ts) | Critical | ACCEPTED — Removed from Phase 1 delete list |
| 2 | Phase 1 wrong path (packages/domain/) | Critical | ACCEPTED — Fixed to full path |
| 3 | Price int overflow (no max bound) | High | ACCEPTED — Added .max(2147483647) |
| 4 | features z.unknown() degrades type | High | ACCEPTED — z.array(z.string()).or(z.record(z.string())) |
| 5 | Audit fields leak to shared schema | High | ACCEPTED — Split Public vs BE-only schema |
| 6 | SupportNeedsSchema undefined in Phase 4 | Critical | ACCEPTED — Defined + superRefine for granular errors |
| 7 | Phase 4 no pre-refactor safety net | High | ACCEPTED — Step 0 mandatory snapshot test |
| 8 | Peer dep auto-install claim wrong | Critical | ACCEPTED — VERIFY before delete, grep component JS |
| 9 | No rollback strategy | High | ACCEPTED — Added Rollback Strategy section |
| 10 | No measurable success criteria | High | ACCEPTED — Added Success Metrics table |
| 11 | z.unknown() boundary_confirmations | Critical | REJECTED — Parity rewrite, not security hardening |
| 12 | URL injection drive_url/file_url | Critical | REJECTED — Same reason, parity not hardening |
| 13 | Convention Rule 4 too heavy | Medium | REJECTED — Mitigated by Public/BE-only split |
| 14 | Devtools version pinning loss | Medium | REJECTED — Never active, low value |
| 15 | npm audit gap in Phase 6 | Medium | REJECTED — npm install already audits |
| 16 | Phase 2 YAGNI (0-importer schema) | High | USER DECIDED — Keep, move now |
| 17 | Knip warn-level useless | Medium | USER DECIDED — warn first, escalate later |
| 18 | z.unknown() features escape hatch | Medium | REJECTED — Fixed to concrete types (Finding 4) |

## Validation Log

### Session — 2026-08-03

| # | Question | Answer |
|---|----------|--------|
| 1 | Phase 2 (team-fit schema): move now or wait for paid tier? | Move now — schema ready, chi phí ~0 |
| 2 | Knip severity: warn or error? | Warn first, escalate to error after false positives triaged |
| 3 | Phase 3 scope: template (1 entity) or full (4 entities)? | Full — all 4 entities migrated in one phase |
| 4 | Phase 6 peer deps: VERIFY or keep all? | VERIFY — grep component JS import before deleting |
| 5 | getSession canonical error message? | Keep authorization.ts message (more specific for auth flow) |

## Dependencies

- Research reports: `research/researcher-01-zod-package.md`, `research/researcher-02-dead-code-tools.md`
- Prior analysis: full RCA via code-review + brainstorming + core-problem-identification (see session context)
- Known state: tests 90% pass (path-extractor 24/27, broad-pattern 29/30, monorepo-scenarios 0/27, usage-limits-cache 48/67)

## Rollback Strategy

- **Branch isolation:** All work on `dev` (current branch). If breakage blocks team → `git revert` per-phase commits in reverse order.
- **Per-phase commits:** Each phase = 1 commit. Prefix: `[Phase N]`. Revert: `git revert <phase-commit>`.
- **Phase gates:** Each phase must pass `check-types` + `build` BEFORE next phase starts. If phase fails → STOP, fix, do not proceed.
- **Low-risk first:** Execute phases in order (1→2→3→4→5→6→7). Highest risk (Phase 4) in middle, not end.

## Success Metrics

| Metric | Before | After | Measured By |
|--------|--------|-------|-------------|
| Modules using @repo/validation | 1/8 (ai-engine) | 3/8 (ai-engine + packages + cases) | `grep -r "@repo/validation" apps/api/src/modules` |
| Dead tracked files | 9 | 0 | `find apps packages -name "*.schema.ts" \| xargs grep -l "export {}"` |
| FE hand-written entity types | 4 | 3 (Package migrated, Case/Payment/User deferred) | `wc -l web-1/types/*.ts` |
| Shared entity schemas | 0 | 1 (ServicePackage) | `ls packages/validation/src/service-package.ts` |
| Dead exports | 10 | 0 | Phase 5 verification grep |
| Unused deps | 16 | 6-10 (6 deleted, 6-10 TBD per Phase 6 verification) | `npm ls` per workspace |
| Duplicate getSession | 3 | 1 | `grep -c "export.*getSession" apps/api/src` |
