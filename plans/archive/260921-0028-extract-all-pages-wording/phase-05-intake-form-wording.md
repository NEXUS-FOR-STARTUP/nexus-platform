# Phase 05 — Intake form wording inventory

## Overview
- **Owner:** `WordingIntake`
- **Effort:** 3h
- **Depends on:** Phase 01 manifest
- **Writes only:** `design-system/wording/pages/intake-form.md`

## Evidence scope
`/dashboard/intake`; `IntakeProgressStepper`, `IntakeChatFlow`, every `Steps/*` component, review/submission state, document/link inputs, package-aware path, intake types/data/schema and form-level validation/toast/loading/error behavior.

## Steps
1. Traverse page, step registry, package branch logic, child inputs and submit handlers through CodeGraph; inventory visible schema errors rather than raw payload-only fields.
2. Write Page Context with code-cited authenticated/intake/package facts and explicit unknown entry analytics.
3. Build inventory by visual step, including stepper labels, questions, option text, field affordances, helper/tooltips, every validation/error/disabled/loading branch, confirmation terms, and submit destination/result.
4. Record observed package-specific behavior and terminology variants factually in Page Notes.

## Acceptance criteria
- `intake-form.md` covers every current rendered step and code-supported package branch, not just the default path.
- Exact three layers and six-column Inventory; every fact/action/state has source evidence or an explicit unknown marker.
- No recommendations or new product wording.

## Risk and rollback
- **Risk:** 79k/149k or conditional support-needs steps diverge (High). Mitigate by branch matrix before writing and separate State rows. Roll back/re-extract only this document on source drift.
