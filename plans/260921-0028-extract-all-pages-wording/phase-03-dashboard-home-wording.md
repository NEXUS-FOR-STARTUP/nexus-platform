# Phase 03 — Dashboard home wording inventory

## Overview
- **Owner:** `WordingDashboardHome`
- **Effort:** 3h
- **Depends on:** Phase 01 manifest
- **Writes only:** `design-system/wording/pages/dashboard-home.md`

## Evidence scope
`/dashboard`; `DashboardShell`, `UserMenu`, `NotificationBell`, `CaseListFilters`, `CaseCard`, `DashboardEmptyState`, `PackageSelectionModal`, dashboard query/loading/error data branches, menu actions and notification state.

## Steps
1. Traverse route, dashboard layout/shell, direct cards/filter/modal components, hooks and their user-visible result/error strings with CodeGraph.
2. Document Page Context from code: authenticated role/access, case/package routes, current empty/loading/error constraints.
3. Create sectioned six-column inventories for shared chrome rendered here and all home-specific sections, filters, cards, dropdowns, modal states, CTA destinations, badges, placeholders, and toast/errors.
4. Record observed `Case`/`Hồ sơ`/project naming variants and behavior facts in Page Notes without judging consistency.

## Acceptance criteria
- One `dashboard-home.md` covers home plus all named evidence components and conditional states.
- It has three layers, exact six-column tables, verbatim copy, and code-proven actions/states.
- No other wording file/source file is edited; no rewrite or subjective audit content exists.

## Risk and rollback
- **Risk:** data-driven card/filter state missed (High). Mitigate by inventorying loading, empty, populated, and request-error branches separately. Roll back by regenerating only this Markdown file.
