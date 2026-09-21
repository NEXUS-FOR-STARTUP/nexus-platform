# Phase 10 — Admin workspace wording inventory

## Overview
- **Owner:** `WordingAdmin`
- **Effort:** 5h
- **Depends on:** Phase 01 manifest
- **Writes only:** `design-system/wording/pages/admin-workspace.md`

## Evidence scope
`/admin`; admin layout/hub, `AdminUsersTable`, `AdminPaymentVerificationTable`, `AdminDepositVerificationTable`, `AdminCaseAssignmentTable`, `AdminWorkerMonitoring`, `WorkerJobsTable`, `WorkerJobTerminal`, `StatsDashboard`, `BanUserModal`, assignment/rejection/approval/retry/heal/detail modals, filters/search/pagination/query/loading/error/toast states.

## Steps
1. Traverse the admin hub’s tab/query selection and every rendered table/modal/hook with CodeGraph. Build a tab × action × state source checklist, including worker monitoring controls.
2. Write Page Context with source-proven admin guard and operational actions; document unknown authorization policy/metrics semantics as unknown instead of assumptions.
3. Inventory each visual tab, KPI/filter/table row/badge/empty/loading/error state, every action modal/form validation, terminal/log copy, notifications, disabled/action-pending behavior and precise handler destination/result.
4. Note factual admin/supporter/user terminology and implementation behavior only.

## Acceptance criteria
- `admin-workspace.md` covers every current `/admin` tab and all named tables/modals/worker interfaces, including reachable conditional states.
- It uses the three prescribed layers and six-column tables with verbatim visible wording.
- No product-operation advice, security judgment, rewrite column, or UI/source change appears.

## Risk and rollback
- **Risk:** large single-page tab tree and recently changing worker UI produce omissions or stale evidence (High × High). Mitigate using manifest revision gate, tab/action/state matrix and full Phase 12 reconciliation. Recreate only this documentation file on drift.
