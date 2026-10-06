# Phase 12 — Cross-page factual completeness audit

## Overview
- **Owner:** `WordingAuditLead`
- **Effort:** 4h
- **Depends on:** Phases 02–11
- **Writes only:** `plans/260921-0028-extract-all-pages-wording/reports/completeness-audit.md`
- **Read-only against:** all ten target wording files and source files

## Purpose
Verify documentation completeness and factual discipline without becoming another owner of page content. If a defect is found, report it by target file/row/source evidence; only that file’s owner remediates it.

## Steps
1. Compare all ten target files with the Phase 01 route/component/state manifest. Check that each scoped route has exactly one designated target owner and all pages exist.
2. Check structure: H1/route/access plus Page Context, Interactive Inventory, Page Notes. Verify every inventory table has exactly `ID | Component / Vị trí | Type | Current wording | Action / Destination | State`.
3. Sample and reconcile source evidence for every route, modal/overlay, validation, notification, loading/empty/error/disabled branch, aria/alt/title and dynamic template. Use CodeGraph as the first source-mapping tool.
4. Scan for forbidden headings/columns/content: `Suggested wording`, recommendation language, `Problem`, `Severity`, subjective correctness claims. Confirm facts cite code or explicitly carry `[Assumption / Cần xác minh]`.
5. Compare shared rendered wording entries across documents for quote/action/state agreement where the same source is cited. It is valid for the same text to occur in multiple factual page documents.
6. Verify revision discipline: each target matches the accepted manifest revision or has an owner-documented full re-extraction revision. Send defects only to the owning agent, re-run audit until zero blocking defects.

## Test matrix / success criteria
- Exactly ten expected page documents; `case-payment.md` exists and no alternate payment filename does.
- 10/10 documents pass three-layer and exact-six-column structural checks.
- 10/10 route groups reconcile against source manifest; no uncited visible branch remains.
- 0 forbidden rewrite/problem/severity columns or subjective copy judgments.
- 0 ownership violations and 0 unresolved source-revision mismatches.
- Audit report lists scope, evidence checks, defects, owner remediation status and final pass result; it contains no rewriting advice.

## Risks and rollback
- **Risk:** audit editor makes unauthorized page-file corrections (Medium × High). Mitigate with read-only page-file rule and owner-routed findings. Roll back by discarding the audit report; page/source state is unchanged.
- **Risk:** false completeness from a shallow scan (High). Mitigate with route/component/state matrix and exact source sampling above.
