# Phase 08 — Dashboard settings wording inventory

## Overview
- **Owner:** `WordingSettings`
- **Effort:** 3h
- **Depends on:** Phase 01 manifest
- **Writes only:** `design-system/wording/pages/settings.md`

## Evidence scope
`/dashboard/settings/*`; `SettingsLayout`, `SettingsSidebar`, `ProfileInfoForm`, `DeleteAccountModal`, `ChangePasswordForm`, `SessionsList`, `NotificationPreferencesForm`, pages/layouts/hooks, validation, confirmation and success/error states.

## Steps
1. Traverse the settings route family through layouts and forms using CodeGraph, including destructive-confirmation behavior and visible API failure fallbacks.
2. Document Page Context with authenticated access and source-proven account/security/notification actions; mark unknown policy/data-retention details as unknown.
3. Inventory sidebar/navigation, all form labels/placeholders/helpers/errors, password/session controls, preference choices, delete confirmation gate, loading/disabled states, modals/toasts and destinations.
4. Record variants and observable behavior in Page Notes only.

## Acceptance criteria
- `settings.md` represents every route below `/dashboard/settings/*` and all named component states.
- All three layers exist; every table preserves the exact six fields and verbatim copy.
- Destructive behavior is recorded as existing code behavior, never framed as a recommendation.
- No target other than `settings.md` is edited.

## Risk and rollback
- **Risk:** security/delete confirmation strings and disabled gates omitted (High). Mitigate by explicit form/modal/validation walkthrough. Roll back/re-extract only `settings.md`.
