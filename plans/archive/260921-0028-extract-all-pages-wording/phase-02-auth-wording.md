# Phase 02 — Authentication wording inventory

## Overview
- **Owner:** `WordingAuth`
- **Effort:** 2h
- **Depends on:** Phase 01 manifest
- **Writes only:** `design-system/wording/pages/auth.md`

## Evidence scope
`/auth`, `/auth/verify-email`; `AuthShell`, `AuthPanel`, `EmailChoiceStep`, `PasswordStep`, `GoogleButton`, `EmailOtpStep`, `RegisterConfirmModal`, auth redirect and session/loading/error paths; their form schema, server/API errors, notifications, accessible labels, and modal states.

## Steps
1. Use CodeGraph from each route entry through all rendered auth children and handlers; recheck manifest revision.
2. Write Page Context covering unauthenticated/access transition facts; tag unproven user intent/entry source as unknown.
3. Inventory every visible auth choice, input, helper, validation error, OAuth/email flow state, loading/disabled state, toast, modal, alt/aria/title, and code-proven redirect/destination in six columns.
4. Record terminology variants and observed registration/verification behavior under Page Notes only.

## Acceptance criteria
- `auth.md` covers both routes and all named components/states from evidence scope.
- Exactly three layers; every Inventory table has the required six columns only.
- Wording is verbatim and each action/state follows handler/route code.
- Contains no rewrite, recommendation, problem/severity language, or source/UI edit.

## Risk and rollback
- **Risk:** conditional verification/register branches omitted (High). Mitigate by checklist per branch and schema/toast scan. Recreate only `auth.md` from manifest revision if inaccurate.
