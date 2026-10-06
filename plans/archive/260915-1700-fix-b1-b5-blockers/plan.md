---
description: "Fix 4 blockers: B1 nested-tx atomicity, B2 double-refund, B3 double-deduct, B4/B5 deterministic key → 409"
status: done
priority: P0
branch: feat/79k-dual-credit
created: 2026-09-15
---

# Fix B1-B5 Blockers

## Context

Money-matrix report identified 4 live blockers affecting real money. All code-only, no schema changes.

## Phases

| # | Phase | Ticket | Status |
|---|---|---|---|
| 01 | [B1: walletService withdraw nhận tx ambient](./phase-01-wallet-atomicity.md) | B1 | ✅ Done |
| 02 | [B2: gộp refund key namespace → refundAll](./phase-02-refund-dedup.md) | B2 | ✅ Done |
| 03 | [B3: xóa W5 subtractCredit từ T11](./phase-03-w5-dedup.md) | B3 | ✅ Done |
| 04 | [B4/B5: P2002 paid order → 409](./phase-04-key-409.md) | B4/B5 | ✅ Done |

## Verify

- [x] `bun run check-types` PASS (3/3)
