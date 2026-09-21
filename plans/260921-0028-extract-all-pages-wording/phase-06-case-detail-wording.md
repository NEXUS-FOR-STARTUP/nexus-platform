# Phase 06 — Case-detail wording inventory

## Overview
- **Owner:** `WordingCaseDetail`
- **Effort:** 6h
- **Depends on:** Phase 01 manifest
- **Writes only:** `design-system/wording/pages/case-detail.md`

## Evidence scope
`/dashboard/case/[id]`; `WorkspaceTabs`, `WorkspaceSidebar`, `TabReportFindings`, `TabIdeaContent`, `TabCaseSettings`, `TabDiscussionChat`, `CaseStatusHeader`, `StatusGuidanceCard`, `ActiveRadarScanning`, `RadarLogsViewer`, `RadarStagePipeline`, `StudentDocumentUploadModal`, `ExternalFeedbackUploadModal`, document/report rows, transition/status/payment/error/loading/empty state and query-tab behavior.

## Steps
1. Use CodeGraph from page through all tab panels, status/transition helpers, upload modals, document/report components, hooks and schema/toast sources. Build a tab × lifecycle-state checklist first.
2. Write code-evidenced Page Context: access, case lifecycle constraints, payment/transition gates, known exits; mark unseen product policy as unknown.
3. Inventory every rendered tab/sidebar/header/status/radar state and each modal/form/error/validation/loading/empty branch. Preserve dynamic template syntax and record handler destinations precisely.
4. Add factual terminology/state variants and implementation observations under Page Notes.

## Acceptance criteria
- `case-detail.md` covers all named components and every code-reachable tab, lifecycle, modal, upload, report and chat wording state.
- Three-layer format and exact six-column inventories are maintained throughout; no state is guessed from case-status prose.
- No source/UI edits, rewrites, recommendations, subjective grading, or writes to another target file.

## Risk and rollback
- **Risk:** largest conditional tree leads to missed tabs/stages (High × High). Mitigate with tab × status checklist, schema/toast scan, and Phase 12 component manifest reconciliation. Roll back/re-extract only `case-detail.md`.
