# Price Locking & Audit Trail Completed

**Date:** 2026-07-21
**Plan:** `260703-1422-price-locking-audit-trail-parallel` — Price locking audit trail
**Status:** Completed (archived)

## Summary

Fixed the root cause exposed by admin price setting: cases now freeze `locked_price` at creation time so package price changes don't affect existing cases. Added last-change metadata to `ServicePackage`.

## 4 phases executed (G0→G1 parallel→G2)

1. Schema migration + backfill — `Case.locked_price`, `ServicePackage` metadata columns
2. Case/payment backend — use `locked_price` as source of truth
3. Package metadata backend — expose `previous_price`, `last_price_changed_at`, `last_price_changed_by`
4. Frontend surfaces — display locked price with legacy fallback `locked_price ?? package?.price ?? 0`

## Key decisions

- `Case.locked_price` is source of truth for payable amount
- Legacy unpaid/rejected cases backfill with current package price (approximation, not full reconstruction)
- Package audit scope: latest-change metadata only, not full history table

## Impact

Existing cases now stable after package price changes. Admin sees last-change metadata on packages. Price lock prevents financial drift.
