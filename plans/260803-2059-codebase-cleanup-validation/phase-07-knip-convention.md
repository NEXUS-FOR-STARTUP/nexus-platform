# Phase 7: Add Knip + Convention Document

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 30m
- **Risk:** LOW — tooling addition, CI warning-level only

## Key Insights
- Research (researcher-02): knip is best tool for monorepo dead code detection. ts-prune archived, depcheck can't do workspaces.
- Current codebase has no automated dead code detection — all findings from this plan were manual. knip prevents regression.
- Convention document ensures future code follows the new rules. Without it, pattern will drift again.

## 7a: Install Knip

### Files to Create

| File | Content |
|------|---------|
| `knip.jsonc` (root) | Monorepo config with plugins for Next.js, ESLint, Prettier |

### Files to Modify

| File | Action |
|------|--------|
| `package.json` (root) | Add `knip` as devDependency + `"knip": "knip"` script |
| `.gitignore` | Add `.knip/` if not already covered |

### Knip Config

```jsonc
// knip.jsonc
{
  "$schema": "https://unpkg.com/knip/schema.json",
  "workspaces": {
    "apps/api": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.ts"]
    },
    "apps/web-1": {
      "entry": ["app/layout.tsx", "app/page.tsx"],
      "project": ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "hooks/**/*.ts", "lib/**/*.ts"]
    },
    "packages/*": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.{ts,tsx}"]
    }
  },
  "ignore": [
    "prisma/**",
    "prisma.config.ts"
  ],
  "ignoreDependencies": [
    "prettier",
    "turbo"
  ],
  "rules": {
    "files": "warn",
    "exports": "warn",
    "dependencies": "warn"
  }
}
```

## 7b: Convention Document

### File to Create

| File | Content |
|------|---------|
| `docs/shared-validation-convention.md` | Rules for placing validation/entity types |

### Document Structure

```markdown
# Shared Validation Convention

## Rule 1: All zod schemas live in @packages/validation
- Request validation (input DTO)
- Response types visible to FE
- Entity types shared FE↔BE
- AI output schemas (Gemini structured output)

## Rule 2: All new modules must use @repo/validation
- http/*.schema.ts imports from @repo/validation, never defines own zod
- FE imports types from @repo/validation, never copies Prisma

## Rule 3: Domain types vs validation types
- domain/ = business enums, pure interfaces, workflow rules (NO zod imports)
- @repo/validation = zod schemas, inferred types for FE↔BE sharing
- BE-internal DTOs stay in module application/*.dto.ts

## Rule 4: New entity types
- After adding Prisma model → add zod schema to @repo/validation (even if only FE imports type)
- FE deletes hand-written DTO, re-exports from @repo/validation

## Rule 5: Cleanup checklist
- Delete file → grep importers → if 0, safe delete
- After delete → run knip → verify 0 warnings
```

## Implementation Steps

1. Install knip: `npm i -D knip` (root)
2. Create `knip.jsonc` with workspace config
3. Add `"knip": "knip"` script to root package.json
4. Run `npx knip` — expect many warnings (baseline). Note count.
5. Suppress known false positives in `ignoreDependencies`
6. Create `docs/shared-validation-convention.md`
7. Update root `AGENTS.md` — add convention reference link
8. Git commit: `chore: add knip for dead code detection + shared validation convention doc`

## Verification
- `npx knip` runs without crash
- Warnings logged but don't fail CI (warn-level per rules in config)
- Convention doc referenced from AGENTS.md
- `npm run check-types` + `npm run build` still pass (knip is dev-only)

## Risk Assessment
- LOW: knip is dev-only, doesn't affect build. CI warning-level = no blocking.
- Knip may report many false positives initially — triage in separate follow-up PR, not this phase.
