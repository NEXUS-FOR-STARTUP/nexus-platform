# Phase 1: Delete Dead Tracked Files

## Overview
- **Priority:** P1
- **Status:** Done
- **Effort:** 30m
- **Risk:** LOW — all verified 0 importers, revert-safe via git

## Key Insights
- 9 tracked files confirmed dead: grep whole repo, 0 external references for each
- Research (researcher-02): cold delete for internal code, no deprecation needed
- One commit per area — files + their consumers/dead exports in same commit

## Files to Delete

| # | File | Reason |
|---|------|--------|
| 1 | `packages/ui/` (3 files: package.json, src/button.tsx, src/card.tsx, src/code.tsx) | Turbo starter scaffold, 0 consumers. Mantine = real design system |
| 2 | `apps/api/src/modules/admin/http/admin.schema.ts` | `export {}` placeholder, 0 importers |
| 3 | `apps/api/src/modules/supporter/http/supporter.schema.ts` | `export {}` placeholder, 0 importers |
| 4 | `apps/api/src/modules/reports/http/reports.schema.ts` | `export {}` placeholder, 0 importers |
| 5 | `apps/api/src/modules/payments/http/payments.schema.ts` | `export {}` placeholder, 0 importers |
| 6 | `apps/api/src/modules/packages/http/packages.schema.ts` | `export {}` placeholder, 0 importers |
| 7 | `apps/api/src/modules/documents/infrastructure/cloudinary-url.service.ts` | Backward-compat shim, 0 consumers. Unified in `services/cloudinary.ts` |

> **NOTE:** `packages/domain/package.types.ts` NOT deleted in Phase 1 — Phase 3 replaces its content inline.

## Files to Modify (cleanup references)

| File | Action |
|------|--------|
| `package.json` (root) | If `packages/ui` listed explicitly in workspaces (verify: wildcard `packages/*` means no change needed) |
| `turbo.json` | Remove `ui` task if explicitly listed (verify: not listed, so skip) |
| `AGENTS.md` (root) | Remove `packages/ui` from STRUCTURE, FROM-WHERE-TO-LOOK, NOTES sections |
| `apps/api/AGENTS.md` | Update KNOWN DEVIATIONS: mention packages.schema.ts deleted, schema now in @repo/validation |
| `apps/web-1/AGENTS.md` | Remove @repo/ui references if any |

## Implementation Steps

1. Verify `packages/ui` has no remaining consumers (grep `@repo/ui` entire repo → confirmed 0 outside self)
2. Delete `packages/ui/` directory
3. Delete 5 http/*.schema.ts files
4. Delete `apps/api/src/modules/documents/infrastructure/cloudinary-url.service.ts`
5. Update AGENTS.md files to remove dead-file references
6. Run `npm run check-types` + `npm run build` to verify no broken imports
7. Git commit: `refactor: delete dead files (empty schemas, scaffold, backward-compat shim)`

## Verification
- `npm run check-types` passes with 0 new errors
- `npm run build` succeeds (API + Web)
- `grep -r "admin\.schema\|supporter\.schema\|reports\.schema\|payments\.schema\|packages\.schema\|cloudinary-url\|@repo/ui" --include="*.ts" --include="*.tsx" apps packages` returns 0 results (except intentional references in @repo/validation migration later)

## Risk Assessment
- LOW: all files verified 0 importers via grep + codegraph. Revert = `git revert`.
- Pattern: commit per file group so individual reverts possible.

## Dependencies
- Phase 2 moves team-fit.schema.ts into @repo/validation — both phases can run independently
