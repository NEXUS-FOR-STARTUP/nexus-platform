# Phase 5: Cleanup Duplicates & Dead Exports

## Overview
- **Priority:** P2
- **Status:** Done
- **Effort:** 45m
- **Risk:** MEDIUM — getSession dedup touches auth flow. Dead exports: safe delete. Dead components: safe delete.

## Key Insights
- `getSession()` has 3 implementations — DRY violation, different error messages
- All dead exports verified 0 importers via grep + codegraph in prior RCA
- Dead components/hooks: validated 0 callers, no dynamic import strings

## 5a: Deduplicate getSession (MEDIUM risk)

### Problem
```
http-helpers.ts:9     → getSession(c: any)   → used by cases.controller (5 calls)
authorization.ts:34   → getSession(c: any)   → used internally by requireCaseAccess, requireReportCaseAccess
middlewares/auth.ts:17 → auth.api.getSession inline → use in requireAuth middleware
```

### Solution
Consolidate to single `getSession` in `http-helpers.ts`. authorization.ts imports from http-helpers. middlewares/auth.ts stays inline (different use case — middleware, not handler).

### Files to Modify

| File | Action |
|------|--------|
| `apps/api/src/shared/infrastructure/authorization.ts` | Remove own `getSession`, import from `http-helpers.js` |
| `apps/api/src/shared/infrastructure/http-helpers.ts` | Keep as canonical source |

### Implementation
```ts
// authorization.ts — remove lines ~5-40 (type Session + getSession func), add:
import { getSession } from './http-helpers.js';
```
- Preserve custom error message by wrapping or update callers
- All internal calls already use `getSession(c)` pattern — compatible

## 5b: Dead Exports (LOW risk)

| Export | File | Action |
|--------|------|--------|
| `UploadResult` interface | `services/cloudinary.ts:38` | Remove export (keep interface internal if needed) |
| `getCloudinaryHost()` | `services/cloudinary.ts:118` | Remove export |
| `validateCloudinaryUrl()` | `services/cloudinary.ts:132` | Remove export |
| `DocumentTypeQueryRequest` | `cases/application/cases.dto.ts:75` | Remove export |
| `AdminCaseListItemDto` | `admin/application/admin.dto.ts:7` | Remove export |

## 5c: Dead Components/Hooks (LOW risk)

| File | Action |
|------|--------|
| `apps/web-1/app/dashboard/intake/_components/DriveValidatorInput.tsx` | Delete (0 callers) |
| `apps/web-1/hooks/usePackages.ts` | Delete (0 callers) |
| `apps/web-1/app/dashboard/intake/_data/demo-preset.ts` | Delete (duplicate — intake page.tsx inlines its own data; team-fit has active version) |
| `apps/web-1/app/dashboard/case/[id]/hooks/useCaseDocumentUploads.ts` line 39 | Remove `useCaseRevisionUpload` export |
| `apps/web-1/types/user.ts` line 17 | Remove `Session` interface export |
| `apps/web-1/public/logo/Black.svg` | Delete (unused) |
| `apps/web-1/public/logo/White.svg` | Delete (unused) |
| `apps/web-1/public/file.svg, globe.svg, window.svg, vercel.svg, next.svg` | Delete (Next boilerplate, 0 references) |

## Implementation Steps

1. Deduplicate getSession: update authorization.ts import (1 file change)
2. Remove 5 dead exports from API
3. Delete 6 dead files + 2 dead exports from web-1
4. Delete 7 unused SVG assets from public/
5. Run `npm run check-types` + `npm run build`
6. Run API tests: verify auth-related tests pass
7. Git commit: `refactor: deduplicate getSession, remove dead exports and unused assets`

## Verification
- `npm run check-types` passes
- `npm run build` succeeds (API + Web)
- API auth tests pass (middleware, authorization)
- No broken imports in web-1 app
- Public assets confirmed unused via grep

## Risk Assessment
- getSession dedup: MEDIUM. Auth flow — test thoroughly. `import { getSession }` from http-helpers should be drop-in replacement.
- Dead exports: LOW. Verified 0 importers.
- Dead components/hooks: LOW. Verified 0 callers. `useCaseRevisionUpload` is export removal, not file deletion.
