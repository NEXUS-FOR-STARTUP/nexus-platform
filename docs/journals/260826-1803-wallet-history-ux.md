---
title: Wallet history UX decision
created: 2026-08-26
scope: UX/product
---

# Wallet history UX decision

## Context

Reviewed `/dashboard/wallet` as a user. The page stacks deposit requests and wallet ledger entries. Verified deposits appear in both, while pending deposits appear only in the request list.

## Decision

Use one primary `Hoạt động ví` list. Keep deposit requests as a conditional actionable area for pending/rejected/mismatch states. Do not use default tabs. Do not delete deposit history data.

## Rationale

Preserves bank-transfer proof and verification workflow without presenting a second competing ledger. Makes pending state visible and explains that balance has not changed. Reduces cognitive load for the balanced goal: quick top-up plus complete balance audit.

## Risk

`amount_mismatch` exists in backend workflow but has incomplete frontend recovery semantics. Resolve this product/state contract before implementation.
