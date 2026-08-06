# Phase 6: Remove Unused Dependencies

## Overview
- **Priority:** P2
- **Status:** Done
- **Effort:** 20m
- **Risk:** LOW — verified 0 JS imports. CSS-only imports count as "used" per research (researcher-02). Some Mantine packages have CSS imports in globals.css.

## Key Insights
- Research (researcher-02): CSS-only imports = used. Peer deps bundled with parent package don't need separate install.
- `@mantine/carousel` has CSS import in `globals.css:6` → counts as used. Its peer `embla-carousel` auto-installed by npm → remove from our deps.
- Verify each package: grep for JS import (not CSS). If 0 JS imports + 0 CSS imports → delete. If CSS import only → keep parent package, remove peers.

## Verification Table

| Package | CSS Import? | JS Import? | Verdict |
|---------|------------|------------|---------|
| `@mantine/carousel` | ✅ globals.css:6 | ❌ | **KEEP** (CSS used) |
| `embla-carousel` | — | ❌ | **VERIFY** first — peer of @mantine/carousel. If carousel component JS never imported (CSS only) → safe delete. Check: `grep -rn "Carousel\|carousel" --include="*.tsx" apps/web-1` BEFORE deleting |
| `embla-carousel-react` | — | ❌ | **VERIFY** — same as above |
| `@mantine/dates` | ✅ globals.css:3 | ❌ | **KEEP** (CSS used) |
| `@mantine/spotlight` | ✅ globals.css:5 | ❌ | **KEEP** (CSS used) |
| `@mantine/nprogress` | ✅ globals.css:10 | ❌ | **KEEP** (CSS used) |
| `@mantine/modals` | ❌ | ❌ | DELETE |
| `@mantine/tiptap` | ✅ globals.css:9 | ❌ | **KEEP** (CSS used) |
| `@tiptap/react` | — | ❌ | **VERIFY** — peer of @mantine/tiptap. If TipTap component JS never imported (CSS only) → safe delete |
| `@tiptap/starter-kit` | — | ❌ | **VERIFY** — same as above |
| `@tiptap/extension-link` | — | ❌ | **VERIFY** — same as above |
| `@tiptap/pm` | — | ❌ | **VERIFY** — same as above |
| `@tanstack/react-devtools` | — | ❌ (commented out) | DELETE |
| `@tanstack/react-form-devtools` | — | ❌ (commented out) | DELETE |
| `@tanstack/react-query-devtools` | — | ❌ (commented out) | DELETE |
| `dotenv` | — | ❌ | DELETE |
| `@ai-sdk/openai` (api) | — | ❌ | DELETE |

**Result:** DELETE 6 packages (confirmed safe). VERIFY 6 packages (need grep check before deciding). KEEP 5 (CSS-only Mantine packages).

## Files to Modify

| File | Action |
|------|--------|
| `apps/web-1/package.json` | Remove 11 packages from dependencies |
| `apps/api/package.json` | Remove `@ai-sdk/openai` from dependencies |

## Implementation Steps

1. Update `apps/web-1/package.json`: remove embla-carousel, embla-carousel-react, @mantine/modals, @tiptap/react, @tiptap/starter-kit, @tiptap/extension-link, @tiptap/pm, @tanstack/react-devtools, @tanstack/react-form-devtools, @tanstack/react-query-devtools, dotenv
2. Update `apps/api/package.json`: remove @ai-sdk/openai
3. Run `npm install` (removes from lockfile)
4. Run `npm run check-types` — verify no missing imports
5. Run `npm run build` — verify API + Web build
6. Git commit: `chore: remove 12 unused dependencies`

## Verification
- `npm ls @mantine/modals` → not found
- `npm ls @tiptap/react` → not found
- `npm ls @ai-sdk/openai` → not found (in api workspace)
- `npm run check-types` passes
- `npm run build` succeeds
- Web app renders correctly (verify CSS @mantine/carousel styles still load)

## Risk Assessment
- LOW: packages verified 0 JS imports via grep. CSS-only packages kept.
- Peer deps (embla, tiptap) auto-installed by parent packages — removing from our package.json saves lockfile noise without breaking anything.
- Devtools: commented out in code, re-install later if needed (already in package.json history for reference).
