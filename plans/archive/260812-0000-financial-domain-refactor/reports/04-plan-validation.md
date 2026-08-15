# Plan Validation — Financial Domain Refactor

**Date:** 2026-08-12
**Status:** APPROVED_WITH_CONDITIONS
**Reviewed:** plan.md + 9 phase files

---

## Conditions (must fix before Phase 01)

### C1: SePay NAP prefix integration gap
**File:** phase-02 + phase-04
- Webhook regex matches `CR[A-Z0-9]{6,}` only
- Deposit module generates `NAP` prefix codes
- If SePay sends code:null → fallback regex won't match NAP → auto-verify fails
**Fix:** Update regex to `/CR[A-Z0-9]{6,}|NAP[A-F0-9]{6}/` + configure SePay bank template

### C2: Outbox duplicates NotificationOutbox
**File:** phase-06 T06.1
- System already has NotificationOutbox with identical structure
- Phase 06 creates second Outbox table with same pattern
**Fix:** Rename to DomainEventOutbox + document separation from NotificationOutbox

---

## Unresolved Decisions

| ID | Decision | Impact |
|----|----------|--------|
| UD1 | SePay NAP prefix: regex fix vs bank template config | Blocks Phase 04 auto-verify |
| UD2 | amount/39000 price assumption in migration SQL | May miscount credits for non-standard prices |
| UD3 | NotificationOutbox vs Outbox design | Affects Phase 06 implementation |
| UD4 | Notification listener subscriptions location | Needs exact file path |
| UD5 | source_type/source_id column drop timeline | No target date |
| UD6 | Feature flag cleanup documentation | Flags scattered across phases |
| UD7 | Sepay webhook dedup interplay with DB unique | Race condition risk |

---

## Risk Matrix

| Phase | Overall | Hotspot |
|-------|---------|---------|
| 01 Schema Migration | MEDIUM | amount_received column missing |
| 02 Deposit Module | LOW | Cross-module import refactor overhead |
| 03 Order Module | MEDIUM | withdraw signature refactor ordering |
| 04 Sepay Webhook Merge | HIGH | NAP prefix regex, 2-branch→1 unification |
| 05 CreditLedger Refactor | LOW | Database query updates only |
| 06 Transactional Outbox | HIGH | NotificationOutbox conflict, relay worker |
| 07 Frontend Refactor | LOW | 12 component changes, type updates |
| 08 Legacy Migration | HIGH | SQL precision, no dry-run protocol |
| 09 Cleanup | LOW | Comment/route updates only |

---

## Dependency Graph

```
Phase 01 (schema)
  ├── Phase 02 (deposit) ── Phase 04 (sepay)
  ├── Phase 03 (order) ──── Phase 05 (credit ledger)
  ├── Phase 06 (outbox)
  └──→ Phase 07 (frontend) → Phase 08 (migration) → Phase 09 (cleanup)
```

No circular dependencies. Phase 02+03 can parallel.

---

## Effort Assessment

| Phase | Plan | Realistic |
|-------|------|-----------|
| 01 | 3h | 2.5h |
| 02 | 3h | 4h |
| 03 | 2.5h | 3h |
| 04 | 2h | 3h |
| 05 | 1.5h | 1.5h |
| 06 | 2h | 3h |
| 07 | 4h | 4h |
| 08 | 2h | 3h |
| 09 | 2h | 2h |
| **Total** | **22h** | **~24h (+9%)** |

---

## Testing Gaps

- Missing: Load/volume test for Sepay webhook with concurrent deposits
- Missing: Race condition test for SELECT FOR UPDATE + concurrent orders
- Missing: E2E Sepay auto-verify simulation mechanism
- Good: Each phase lists concrete integration tests
- Good: Phase 08 verification queries (row counts, balance drift) well-defined

---

## Phase 01 Start Checklist

1. C1 resolved (NAP prefix strategy documented)
2. C2 resolved (Outbox naming decided, Phase 06 updated)
3. UD1-UD3 decided by team
4. Snapshot prod DB for migration dry-run baseline
5. prisma-migration-safety.md reviewed
