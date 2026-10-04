# Phase 09 — Supporter workspace wording inventory

## Overview
- **Owner:** `WordingSupporter`
- **Effort:** 4h
- **Depends on:** Phase 01 manifest
- **Writes only:** `design-system/wording/pages/supporter-workspace.md`

## Evidence scope
`/supporter`, `/supporter/case/[id]`, `/supporter/settings/*`; supporter list/workspace/layout, `SupporterRequestInfoModal`, `SupporterOutputUploadModal`, case review/start/request/revision/upload workflow, discussions/documents/timeline states, role guard, settings forms and all visible feedback/error states.

## Steps
1. Use CodeGraph for supporter route entries, role redirects, workspace tabs and action hooks. Enumerate each allowed-transition-gated action, modal and status branch before writing.
2. Write Page Context by route family: supporter/admin access facts, current case review actions and source-proven exits; tag operational assumptions as unknown.
3. Inventory list/card, workspace chrome, status alerts, action bar, review/upload/request modal copy, documents/chat/timeline, settings and all loading/error/disabled/validation/toast states.
4. In Page Notes, capture `Supporter`/mentor terminology variants and observed role/transition filtering, without resolving them.

## Acceptance criteria
- `supporter-workspace.md` covers all three route families and the named review workflow components.
- Every visible transition-gated branch is represented with factual State and handler action/destination.
- Exact three layers/six columns; no rewrite, subjective assessment, or non-owned file write.

## Risk and rollback
- **Risk:** admin-vs-assigned-supporter permissions or conditional actions misrepresented (High). Mitigate by tracing guards and allowed transitions, then state them as code behavior. Re-extract only this Markdown file if wrong.
