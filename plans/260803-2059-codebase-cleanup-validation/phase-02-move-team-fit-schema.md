# Phase 2: Move Team-Fit Schema to @repo/validation

## Overview
- **Priority:** P1
- **Status:** Done
- **Effort:** 20m
- **Risk:** LOW — file is 0 importers currently, move = safe. Adding to @repo/validation makes it available for paid tier

## Key Insights
- `team-fit.schema.ts` (38 lines) is a zod schema → infrastructure concern, NOT domain business logic
- Currently in `ai-engine/domain/` — wrong layer per Clean Architecture
- Correct home: `@packages/validation/` where `TeamFitFreeReportSchema` already lives
- Schema is for PAID tier (rich 4-part report: overview, fitLevel, strengths, weaknesses, recommendations) — pre-designed, not yet activated
- Research (researcher-01): split per-entity files before package grows too large

## Files to Create

| File | Content |
|------|---------|
| `packages/validation/src/team-fit-report.ts` | `TeamFitReportSchema` + `TeamFitReport` type (moved from ai-engine/domain) |

## Files to Modify

| File | Action |
|------|--------|
| `packages/validation/src/index.ts` | Add: `export { TeamFitReportSchema, type TeamFitReport } from './team-fit-report.js'` |

## Files to Delete

| File | Reason |
|------|--------|
| `apps/api/src/modules/ai-engine/domain/team-fit.schema.ts` | Moved to @repo/validation |

## Implementation Steps

1. Create `packages/validation/src/team-fit-report.ts` with exact content of `team-fit.schema.ts` (no change to schema structure)
2. Add export line to `packages/validation/src/index.ts`
3. Search for any internal imports of `team-fit.schema` in ai-engine module — verify 0 (confirmed in prior RCA). If any found, update to `@repo/validation`
4. Delete original file
5. Run `npm run check-types` — verify no broken imports
6. Git commit: `refactor: move TeamFitReport schema from ai-engine domain to @repo/validation`

## Verification
- `npm run check-types` passes
- `grep -r "team-fit.schema" apps/api/src` returns 0
- `grep -r "TeamFitReportSchema" packages/validation` confirms it's exported and importable
- Schema unchanged from original (same zod structure, same comments)

## Note
- Paid tier activation (using this schema in evaluate-team-fit usecase) is OUT OF SCOPE for this plan. This phase only relocates the schema to correct layer.

## Risk Assessment
- LOW: file has 0 callers. Core schema structure preserved. @repo/validation already exports zod schemas (precedent exists).
