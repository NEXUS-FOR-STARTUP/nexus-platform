# Phase 11 — Policy and maintenance wording inventory

## Overview
- **Owner:** `WordingPolicies`
- **Effort:** 2h
- **Depends on:** Phase 01 manifest
- **Writes only:** `design-system/wording/pages/policies.md`

## Evidence scope
`/terms`, `/privacy`, `/refund-policy`, `/fair-use-policy`, `/maintenance`; `PolicyDocumentLayout`, policy-page headings/TOC/sections/metadata, shared navigation/footer as rendered, mail/link destinations, maintenance heading/description/image alt and visible layout behavior.

## Steps
1. Use CodeGraph to map all five entries to `PolicyDocumentLayout` and static policy content; inspect every TOC item and visible document section, not only headers.
2. Write one multi-route Page Context that distinguishes public policy routes from maintenance screen facts; do not convert legal text into interpretation.
3. Inventory each policy document’s header/metadata, TOC labels/anchor behavior, section headings/body clauses, navigation/contact links, accessible content and the maintenance screen’s copy/state.
4. In Page Notes record exact observed terminology and code behavior; unknown legal ownership/effective-policy concerns stay questions, not recommendations.

## Acceptance criteria
- One `policies.md` covers all five listed routes and every visible policy/maintenance string.
- Every table uses exactly six required columns and all anchors/actions/states are source-proven.
- Legal text is transcribed factually with no paraphrase, critique, rewrite, or compliance judgment.

## Risk and rollback
- **Risk:** long static legal documents get partially enumerated (High). Mitigate by section/TOC count reconciliation and visual/source checklist. Roll back/re-extract only `policies.md`; legal/product source remains unchanged.
