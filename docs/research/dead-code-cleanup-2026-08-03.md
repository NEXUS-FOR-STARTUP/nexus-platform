# Research Report: Dead Code Cleanup in TypeScript Monorepo (Turborepo)

**Date:** 2026-08-03
**Scope:** knip/ts-prune/depcheck comparison; pre-delete verification; deletion order; dep semantics (CSS-only, peer); deprecation convention; git safety.
**Stack context:** Nexus Turborepo — apps/api (Hono), apps/web-1 (Next.js 16 + Mantine v9), packages/ (ui, validation, eslint-config, typescript-config). Root tsconfig presets. No knip installed yet.

## Local Audit (fresh evidence)

`apps/web-1/package.json` declares `@mantine/carousel`, `embla-carousel`, `embla-carousel-react`. `rg` across all source (ts/tsx/css) finds **zero references** — no component usage, no JS import, no CSS import. These 3 deps are verifiably dead *today*. `@mantine/core` etc. are referenced and stay.

## Findings

### 1. Tool: knip wins decisively for Turborepo
| Dimension | knip | ts-prune | depcheck |
|---|---|---|---|
| Scope | files + exports + deps | exports only | package.json deps only |
| Monorepo | native (workspaces, `workspace:*`) | none | per-package, poor |
| Maint. | active (v5+, 1.1k+ snippets) | archived | legacy |
| False positives | low (plugins: next, eslint...) | high (no framework awareness) | medium (misses dynamic usage) |
| Config | 1 root `knip.json` | minimal but wrong-scope | per package |

- **ts-prune archived → reject.** **depcheck** too narrow for workspace graph.
- knip auto-detects Turborepo workspaces; needs plugins so config files (eslint.config.mjs, next.config) don't get flagged. Run CI as warning first, `ignoreDependencies`/`ignoreExports` for documented FPs. `npx knip --debug` to debug discovery.
- **Architectural fit:** zero config file in repo today — add root `knip.jsonc` (repo style prefers jsonc), install at root devDeps.

### 2. Verify beyond grep before deleting
Grep misses 4 classes. Check in order:
1. **Dynamic imports:** `import('...')` with template strings / computed paths (route maps, lazy components). Search: `import(`, `require(`, `await import(`.
2. **String-based refs:** module names in strings — router registries, plugin arrays, `Intl`/`formatter` lookup, container/DJ keys. Search: `"@/modules/x"` literals, config-driven file lists (e.g., `{ name: 'admin' }` resolvers).
3. **Reflection/registry:** controllers/handlers auto-registered by decorators or conventions (Hono router mounting by filename, Prisma model strings, `getOwnPropertyNames` scans). Backend `apps/api` mounts 8 modules — verify module index re-exports before deleting a route file.
4. **Export-only-for-type / re-export chains:** `export * from` in `packages/ui` barrel — deleting the barrel member breaks public API of shared package. Check `packages/*` consumers.
**Order:** knip report → targeted grep for patterns above → `tsc --noEmit` after each candidate group → run API tests (`node --test`) + web build. Deleting in groups, not one-at-a-time; compile+test between groups.

### 3. Safe deletion order: bottom-up, per workspace
Rule: **files before packages before deps**, but verify each workspace independently and delete packages first if whole workspace is orphaned.
- Correct order: (1) unused exports/files within workspace → (2) unused packages (`packages/*` with zero importers — check via knip `workspaces` report + `rg` on importers) → (3) unused deps in each `package.json`.
- If a workspace is fully dead (e.g., `packages/validation` unused by api+web), delete the **package first** — everything below disappears with it, deps included.
- Dependency graph caution: `packages/ui` is consumed by `web-1`; never delete shared-package exports until consumers checked. Prisma schema (`prisma/schema.prisma`) is source of truth — don't delete models from code only.
- Run knip per-workspace (`--workspace @nexus/ui`) after each stage; full-repo scan at end.

### 4. Dep semantics: CSS-only import = used; peer deps ≠ auto-keep
- **CSS-only import counts as used** (side-effect import keeps file/dep alive). Knip handles `.css` via compilers; it strips loader prefixes (`!style-loader!...`). `import '@mantine/carousel/styles.css'` → carousel stays "used".
- **But this project has no such import** — carousel+embla have zero refs. CSS-only import would only *justify keeping the JS package* if the import actually exists. It doesn't. **Delete all 3.**
- **Peer deps:** `embla-carousel`/`embla-carousel-react` are *bundled by* `@mantine/carousel`'s own import graph — Mantine lists them as peerDeps, but **npm auto-installs peers**; deleting from our package.json does NOT break Mantine (it still resolves hoisted peer). Only if you import `embla` APIs directly do you need them declared. Rule: declare peers only when directly imported; otherwise rely on npm auto-install + note in `ignoreDependencies` if knip complains.
- Knip distinguishes optional vs required peerDeps (`peerDependenciesMeta`) — required peers in deps are production deps; optional peers flagged separately.

### 5. Deprecation convention + git safety
**Deprecation:** use a **three-phase, not cold delete**, but only for code with external consumers (shared `packages/*`, public API):
1. `@deprecated` JSDoc + `@deprecated` comment — IDE strikethrough, zero runtime cost.
2. Runtime `console.warn` only for **public-facing shared exports** (once per call-site is fine) — skip for internal app code; warns pollute logs.
3. Remove in a later PR with `[breaking]` note in commit + changelog.
**Internal-only dead code (apps/api, apps/web-1):** cold delete. No deprecation phase — YAGNI; dead internal code has no consumers to migrate.

**Git safety:** the pattern that makes revert trivial:
- **One commit per area**, never one big cleanup: `chore(web): remove unused carousel deps`, `chore(api): remove dead module X`, `chore(packages): remove unused ui export`. `git revert <sha>` per area when something breaks — blast radius bounded.
- Commit **deps removal together with the file deletions that used them** (same commit) — a files-only commit that removes last usage then a separate deps commit breaks the build between commits. Order: delete files, remove deps, verify, commit as one unit.
- Deletion is recoverable via git history — no `git rm --cached`/purge games; keep history.
- **Verification gate before commit:** `npm run check-types` + `npm test` + web build. `git diff --stat` review (a cleanup commit touching 50 files across areas = split it).

## Recommendation (ranked)
1. **Adopt knip** at root, `knip.jsonc` + plugins (next, eslint), CI as non-blocking warning initially.
2. **Immediate win:** delete `@mantine/carousel`, `embla-carousel`, `embla-carousel-react` from `apps/web-1` (zero refs verified). One commit. Revert-safe.
3. Then run knip full scan → triage into per-area cleanup commits, files-before-deps per workspace.
4. Deprecation phase only for `packages/*` public exports; cold delete elsewhere.

## Sources
- knip docs (knip.dev, github.com/webpro-nl/knip — FAQ, DependencyDeputy.ts, integrated-monorepos.md)
- ts-prune (archived), depcheck (npm/GitHub)
- Turborepo docs (workspace config), community comparisons (2025-2026)
- Medium/dev.to/logrocket/CSS-Tricks on dead code deletion + deprecation workflows

## Unresolved Questions
- Whether `@mantine/carousel` was recently used and removed (git log on web-1 package.json) — affects "no deprecation needed" conclusion. If it shipped a feature that was cut, fine; if feature is temporarily disabled via comment, recheck before deleting.
- Knip exact FP count on this repo unknown until first run — expect config iterations (next.js plugin, eslint flat config).
- `packages/validation` usage: not audited here — verify consumers before any shared-package deletion.
