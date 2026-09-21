# Phase 01 — Factual extraction contract and source manifest

## Overview
- **Owner:** `WordingManifestLead`
- **Effort:** 1h
- **Depends on:** none
- **Writes only:** `plans/260921-0028-extract-all-pages-wording/research/source-manifest.md`

## Purpose
Establish one evidence baseline before concurrent extraction. This phase changes no product file and no `design-system/wording/pages/*.md` file.

## Steps
1. Record the current commit revision and extraction timestamp.
2. Build one route-to-source manifest for all ten target documents: route entry, layout, direct rendered components, nested modals, hooks, validation/schema sources, visible notification calls, and policy layout.
3. Attach the six-column table contract and the mandatory word-state checklist: literals, dynamic templates, aria/alt/title, placeholders/helpers/options, loading/empty/error/disabled branches, validation, modal, and toast text.
4. Specify the source-change rule: if a manifest file changes during a page extraction, that owner re-extracts its full document from the new revision; never append a mixed-revision patch.
5. Distribute the manifest path and target-file ownership map to all ten page owners.

## Data flow
`current source revision → CodeGraph route/component map → manifest/checklist → independent page owners`.

## Acceptance criteria
- Manifest lists all ten target Markdown paths and every route named in `plan.md`.
- Each target route has entry/layout/component/state evidence locations, not only a page entry file.
- Contract repeats the exact six allowed Inventory columns and the factual-only prohibition.
- No target page doc, UI/source code, or shared wording instruction file is modified.

## Risks and rollback
- **High:** stale/mixed source revision. Mitigate with recorded revision and atomic re-extraction rule. Rollback is delete/recreate only the manifest; product source is untouched.
