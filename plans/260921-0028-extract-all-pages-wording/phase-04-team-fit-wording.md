# Phase 04 — Team-fit wording inventory

## Overview
- **Owner:** `WordingTeamFit`
- **Effort:** 2h
- **Depends on:** Phase 01 manifest
- **Writes only:** `design-system/wording/pages/team-fit.md`

## Evidence scope
`/dashboard/team-fit`; route/layout chrome rendered on the route, `StepIndicator`, `IdeaMadLibsStep`, `TeamMemberCard`, `TeamInputStep`, `TeamFitResultStep`, `ReadyState`, `NavigationButtons`, team-fit mutation, validation, loading/success/error and reset/navigation branches.

## Steps
1. Use CodeGraph for page-to-step tree, state model, mutation and all visible errors/toasts.
2. State Page Context only from route/session and code facts; mark tracking/entry assumptions explicitly.
3. Inventory all step labels/options/placeholders/helpers, member controls, navigation, evaluation output labels, ready/loading/error branches, accessible text, and destinations.
4. Preserve observed terminology in Page Notes; do not explain or improve it.

## Acceptance criteria
- `team-fit.md` provides one factual inventory of all named components and all reachable visible state branches.
- All inventories use exactly six specified columns; contexts/notes cite source or mark unknown.
- No rewrite/guidance/problem taxonomy and no non-owned file changes.

## Risk and rollback
- **Risk:** result wording is data-shaped and skipped (High). Mitigate by recording fixed templates, labels, empty/fallback states, and variable provenance. Recreate only this file if source revision changes.
