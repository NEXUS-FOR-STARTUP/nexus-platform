---
title: "Financial Domain Refactor — Deposit → Order → Service"
description: "Tách 3 khái niệm đang trộn lẫn (deposit/purchase/consumption) thành 3 domain rõ ràng: Wallet, Order, Service. Thay Payment+WalletTopup bằng deposits+orders. Thêm transactional outbox. Zero-downtime migration."
status: complete
priority: P1
effort: 25.5h
branch: feat/user-wallet-vnd
blockedBy: [260809-1030-workflow-engine-refactor]
blocks: [260811-1100-user-wallet-vnd]
tags: [refactor, financial, wallet, deposit, order, sepay, outbox, migration]
created: 2026-08-12
updated: 2026-08-12T19:30
review: "PASSED — 6 CRITICAL + 8 HIGH + 2 CONDITIONS resolved in plan files"
---

# Financial Domain Refactor

## Overview

**Problem:** 3 khái niệm độc lập (deposit / purchase / consumption) bị trộn lẫn vào `Payment`, `WalletTopup`, `CreditLedger`. Không truy vết được tiền. Không mở rộng được service mới. Sepay webhook 2 branch duplicate logic.

**Solution:** Tách thành 3 domain rõ ràng theo `docs/financial-domain-redesign.md` + `docs/financial-domain-research.md`:
- **Wallet domain:** `deposits` (nạp tiền) + `wallet_transactions` (biến động số dư) + `user_wallets` (số dư)
- **Order domain:** `orders` + `order_items` (cầu nối wallet↔service)
- **Service domain:** `credit_ledger` (audit credit consumption)

**References:**
- `reports/01-domain-redesign.md` — complete domain model
- `reports/02-best-practices-research.md` — industry best practices
- `reports/03-red-team-review.md` — 25 findings (ALL RESOLVED in plan)
- `reports/04-plan-validation.md` — APPROVED (conditions resolved)
- `.agents/rules/prisma-migration-safety.md` — DB safety rules

## Findings Resolution Summary

| Finding | Status | Phase Fixed |
|---------|--------|------------|
| C1: verifyDeposit split tx | ✅ Fixed | 02 |
| C2: Sepay webhook split tx | ✅ Fixed | 04 |
| C3: deposits.idempotency_key | ✅ Added | 01 |
| C4: orders.idempotency_key | ✅ Added | 01 |
| C5: withdraw before order.id | ✅ Fixed (create→withdraw→paid) | 03 |
| C6: migration UNIQUE violation | ✅ Fixed (NULLIF) | 08 |
| H1: amount mismatch silent | ✅ amount_mismatch status | 04 |
| H2: DEPOSIT_VERIFIED removed | ✅ Kept in verify-deposit outbox | 06 |
| H3: no status index | ✅ Added @@index | 01 |
| H4: double credit risk | ✅ Removed — old webhook path deleted (Solution B: pending Payment→deposits migration, Phase 08) | 08 |
| H5: no refund outbox | ✅ Added to walletService.refund | 06 |
| H6: withdraw ordering | ✅ T03.9 implemented BEFORE T03.4 | 03 |
| H7: reference_type NULL | ✅ Backfill SQL in Phase 08 | 08 |
| H8: UnpaidAlertBanner removal | ✅ Repurposed to credit-based gate (creditBalance > 0) — correct for new system | 07 |
| C1(val): prefix regex cho deposit | ✅ CRTOPUP confirmed (đã match `/CR[A-Z0-9]{6,}/`), NAP dropped | 02 |
| C2(val): Outbox naming | ✅ Renamed domain_event_outbox | 01, 06 |
| P3: balance compute duality | ✅ Standardized to aggregate _sum | 05 |
| P5: double credit consumption | ✅ Kept inline (Option B) — atomic 1-tx, T11 route rejected (analysis in T05.8) | 05 |
| P6: idempotency defeated | ✅ Deterministic keys (no randomUUID) | 05 |
| G1: thiếu admin list deposits API | ✅ Added `GET /deposits/admin/all` (admin-only, kèm user info) | 02 |
| G2: order idempotency retry → P2002 500 | ✅ P2002 catch → lookup idempotency_key → trả order gốc | 03 |
| G4: giá hardcode 39000 | ✅ Server resolve từ `service_packages` (bỏ trust client unit_price — fix luôn lỗ hổng giá của createPayment cũ) | 03, 07 |
| G3/UD2: UPGRADE_LOCKED_PRICE hardcode 39000 | ✅ Bỏ constant, resolve từ DB package price (`getPackagePrice(packageId)`) | 03 |
| ND2/UQ6: veto-refund data source bug | ✅ Sửa `executeAction` truyền `event.data` (có `caseOwnerId` + `lockedPrice`) thay vì raw request body | 05 |
| ND4/UD4: notification listener paths | ✅ Xác định path thật: `recipients.ts` + `notification-templates.ts` + `domain-events.ts` → vào T06.7 | 06 |

## Problem Summary

| # | Problem | Current State | Target State |
|---|---------|--------------|-------------|
| P1 | `Payment` hard-wired to `case_id` (NOT NULL, FK, Cascade) | Can't do case-less deposits | `deposits` — no case FK |
| P2 | `WalletTopup` duplicates Payment completely | 2 tables, same data, duplicate verify logic | Unified `deposits` table |
| P3 | `verifyPayment` auto-creates `CreditLedger` inside payment tx | Payment domain mutates service domain | `orders` as intermediary |
| P4 | Sepay webhook 2 branches (4a topup + 4b payment) | Duplicate logic, 2 code paths | 1 unified path: `deposits` |
| P5 | No order table — purchase is direct Payment→CreditLedger | No intermediary | `orders` + `order_items` |
| P6 | Missing `service_payment` in WalletTxType | Enum incomplete | Add to enum |
| P7 | No traceability wallet_tx → deposit/order | `source_type`/`source_id` inconsistent | `reference_type`/`reference_id` soft FK |
| P8 | Fire-and-forget `emitEvent` — no transactional guarantee | Event loss on crash | Transactional outbox pattern |

## Files Map

### NEW files
```
apps/api/src/modules/deposits/                          (module mới)
  domain/deposit.types.ts
  application/create-deposit.usecase.ts
  application/verify-deposit.usecase.ts
  application/list-deposits.usecase.ts
  application/list-all-deposits.usecase.ts   (admin — G1)
  application/get-deposit.usecase.ts
  application/deposits.dto.ts
  infrastructure/persistence/deposit.repository.ts
  infrastructure/http/deposit.routes.ts
  infrastructure/http/deposit.controller.ts

apps/api/src/modules/orders/                            (module mới)
  domain/order.types.ts
  application/create-order.usecase.ts
  application/list-orders.usecase.ts
  application/get-order.usecase.ts
  application/orders.dto.ts
  infrastructure/persistence/order.repository.ts
  infrastructure/http/order.routes.ts
  infrastructure/http/order.controller.ts

apps/api/src/modules/shared/
  infrastructure/persistence/outbox.repository.ts        (MỚI — transactional outbox)
```

### MODIFIED files (backend)
```
prisma/schema.prisma                                    (+deposits, +orders, +order_items, +outbox; +type Payment; +service_payment enum; rename source_type→reference_type)
apps/api/src/modules/payments/application/sepay-webhook.usecase.ts  (merge 2 branches → 1)
apps/api/src/modules/payments/application/verify-payment.usecase.ts (dual-write to deposits)
apps/api/src/modules/payments/infrastructure/persistence/payment.repository.ts (add type field to Payment)
apps/api/src/modules/payments/http/payments.routes.ts   (keep active, mark deprecated)
apps/api/src/modules/wallet/application/wallet.service.ts (add orderPayment method, accept tx param)
apps/api/src/modules/wallet/infrastructure/persistence/wallet.repository.ts (rename source_type→reference_type)
apps/api/src/modules/wallet/domain/wallet.types.ts      (add WalletTransactionRefType)
apps/api/src/modules/packages/application/get-package.usecase.ts (NEW — giá cho FE, G4)
apps/api/src/modules/packages/infrastructure/http/package.routes.ts (ADD GET /:id)
apps/api/src/modules/wallet/infrastructure/http/wallet.routes.ts (add GET /history, deprecate POST /topups)
apps/api/src/modules/cases/application/case-transition.service.ts (use WalletService.refund with tx)
apps/api/src/index.ts                                   (mount /deposits, /orders routes)
apps/api/src/shared/domain/domain-events.ts             (+DEPOSIT_VERIFIED, +ORDER_PAID, +WALLET_BALANCE_CHANGED, +DEPOSIT_REJECTED, +ORDER_REFUNDED)
apps/api/src/shared/infrastructure/event-bus.ts         (add outbox relay worker)
apps/api/src/modules/notifications/application/recipients.ts (add 5 event mới vào STUDENT_EVENTS/ADMIN_EVENTS — ND4)
apps/api/src/modules/notifications/application/notification-templates.ts (add templates deposit.verified, order.paid, wallet.balance_changed — ND4)
apps/api/src/modules/notifications/application/notification-listener.ts (auto-subscribe qua DOMAIN_EVENTS — không cần sửa)
```

### MODIFIED files (frontend)
```
apps/web-1/app/dashboard/wallet/_components/WalletTopupModal.tsx     (POST /deposits instead of POST /wallet/topups)
apps/web-1/app/dashboard/wallet/hooks/useWallet.ts                   (update API paths)
apps/web-1/app/dashboard/wallet/_components/WalletTransactionItem.tsx (show reference_type)
apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx (POST /orders instead of POST /payments)
apps/web-1/app/dashboard/case/[id]/_components/CreditPanel.tsx       (update props: orders instead of payments)
apps/web-1/app/dashboard/case/[id]/_components/CreditTransactionHistory.tsx (add deposit rows, show orders)
apps/web-1/app/dashboard/case/[id]/_components/UnpaidAlertBanner.tsx (remove — no longer needed with wallet)
apps/web-1/app/admin/_components/AdminPaymentVerificationTable.tsx  (unified deposit verification)
apps/web-1/app/admin/page.tsx                                        (update verify calls)
apps/web-1/app/dashboard/payments/*                                  (redirect to wallet page)
apps/web-1/types/payment.ts                                         (add deposit/order types)
apps/web-1/lib/pricing.ts                                           (remove — price from DB)
```

### NOT MODIFIED
```
apps/api/src/modules/wallet/application/wallet-topup.usecase.ts    (keep, mark deprecated)
apps/api/src/modules/wallet/application/purchase-credits.usecase.ts (keep, redirect to orders)
apps/api/src/modules/payments/application/create-payment.usecase.ts (keep, mark deprecated)
apps/api/src/modules/payments/application/upload-payment-proof.usecase.ts (keep, mark deprecated)
apps/api/src/modules/payments/application/list-payments.usecase.ts (keep, mark deprecated)
apps/api/src/modules/payments/application/get-payment.usecase.ts (keep, mark deprecated)
apps/api/src/modules/payments/application/list-my-payments.usecase.ts (keep, mark deprecated)
apps/api/src/modules/payments/infrastructure/file-storage.service.ts (no change)
apps/api/src/modules/payments/http/sepay.routes.ts (no change)
apps/api/src/modules/payments/http/sepay.controller.ts (no change)
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  WALLET DOMAIN                                          │
│  deposits + wallet_transactions + user_wallets          │
│  1 wallet / 1 user — pays for ALL services              │
└──────────────────────────┬──────────────────────────────┘
                           │ pays with
┌──────────────────────────▼──────────────────────────────┐
│  ORDER DOMAIN                                           │
│  orders + order_items — bridge wallet ↔ service         │
└──────────────────────────┬──────────────────────────────┘
                           │ funds
              ┌────────────┴────────────┐
              ▼                         ▼
┌────────────────────────┐  ┌────────────────────────┐
│ SERVICE: CREDIT        │  │ SERVICE: FUTURE (team_fit,│
│ credit_ledger          │  │ document...)            │
└────────────────────────┘  └────────────────────────┘
```

## Phases

| # | Phase | Effort | Status | Depends | File |
|---|-------|--------|--------|---------|------|
| 01 | Schema Migration | 3h | complete | — | [phase-01](./phase-01-schema-migration.md) |
| 02 | Deposit Module | 3.5h | complete | Phase 01 | [phase-02](./phase-02-deposit-module.md) |
| 03 | Order Module | 3.5h | complete | Phase 01, 02 | [phase-03](./phase-03-order-module.md) |
| 04 | Sepay Webhook Merge | 2h | complete | Phase 02 | [phase-04](./phase-04-sepay-webhook-merge.md) |
| 05 | CreditLedger Refactor | 1.5h | complete | Phase 03 | [phase-05](./phase-05-credit-ledger-refactor.md) |
| 06 | Transactional Outbox | 2h | complete | Phase 01 | [phase-06](./phase-06-transactional-outbox.md) |
| 07 | Frontend Refactor | 4h | complete | Phase 01-05 | [phase-07](./phase-07-frontend-refactor.md) |
| 08 | Legacy Dual-Write + Data Migration | 2.5h | complete | Phase 01-07 | [phase-08](./phase-08-legacy-migration.md) |
| 09 | Cleanup + Deprecation | 2h | pending | Phase 08 | [phase-09](./phase-09-cleanup-deprecation.md) |

**Total effort: ~25.5h**

## Dependency Graph

```
Phase 01 (schema) ───────────────────────────────────────┐
  ├─ Phase 02 (deposit module) ──────────────────────────┤
  │    └─ Phase 04 (sepay merge) ────────────────────────┤
  ├─ Phase 03 (order module) ────────────────────────────┤
  │    └─ Phase 05 (credit ledger refactor) ─────────────┤
  ├─ Phase 06 (outbox) ──────────────────────────────────┤
  └──────────────────────────────────────────────────────┤
       └─ Phase 07 (frontend) ── Phase 08 (dual-write) ── Phase 09 (cleanup)
```

Phase 02 + 03 can run in parallel after Phase 01.
Phase 04 depends on Phase 02. Phase 05 depends on Phase 03.
Phase 06 can run anytime after Phase 01.
Phase 07 needs Phase 02-05 done (API endpoints exist).
Phase 08 needs Phase 07 (FE switched to new endpoints).
Phase 09 needs Phase 08 (dual-write confirmed, legacy safe to deprecate).

## Key Design Decisions

| Decision | Rationale | Source |
|----------|-----------|--------|
| `deposits` not `payments` | "payment" = mua gì đó; "deposit" = chỉ thêm tiền | redesign §8 |
| `orders` not `purchases` | order = process, purchase = result. Order có items | redesign §8 |
| `order_items.service_type` | Service-agnostic line items → future-proof | redesign §5 |
| Int for all amounts | VND smallest unit. No float. | redesign §9 |
| `idempotency_key` UNIQUE on all ledger tables | Chống double-spend / webhook retry | research §4 |
| Soft FK: `reference_type` + `reference_id` | Cross-domain traceability, no hard cascade | redesign §9 |
| `SELECT FOR UPDATE` on wallet mutations | Pessimistic lock → chống concurrent overspend | research §3 |
| 3-tier: Wallet→Order→Service | Domain separation, reusable wallet | research §2 |
| Outbox pattern | Atomic: DB write + event publish → no event loss | research §4 |
| Old Payment routes active during transition | Dual-write period → zero-downtime migration | redesign §7 |
| Old webhook branch 4b removed | Migrate pending Payment→deposits before Phase 04 (Phase 08), single webhook path — clean | Solution B |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Schema migration breaks prod | Low | Critical | `--create-only`, expand-contract, no destructive SQL |
| Concurrent wallet mutation → overspend | Medium | High | `SELECT FOR UPDATE` already in place |
| Dual-write data inconsistency | Medium | High | Reconciliation query comparing old vs new |
| Sepay webhook branch 4b removal → stuck pending Payment | Low | Medium | Migration: insert pending Payment→deposits before removing 4b (Phase 08) |
| Frontend missed old Payment path | Low | Medium | Grep all `POST /payments`, `POST /wallet/topups` before Phase 08 |
| Frontend missed old Payment path | Low | Medium | Grep all `POST /payments`, `POST /wallet/topups` before Phase 08 |
| Outbox relay worker crash → event loss | Low | Medium | Outbox has retry column, relay polls with processing_at |
| Migration data corruption (Payment→deposits) | Low | High | Clone prod DB, test migration script, verify row counts |
| CreditQuantityModal missed | Low | Low | Impact only on purchase flow — test purchase E2E |

## Testing Strategy

| Phase | Unit Tests | Integration Tests | E2E Tests |
|-------|-----------|------------------|-----------|
| 01 | — | Verify migration applies without error | — |
| 02 | deposit.service: create, verify, reject, list | POST /deposits → verify → check wallet balance | — |
| 03 | order.service: create, pay, list | POST /orders → wallet deducted → credit_ledger +entry | — |
| 04 | sepay webhook: deposit match, amount mismatch, dedup | Sepay webhook → deposit verified → wallet balance | — |
| 05 | credit_ledger: purchase with order ref, consumption | — | — |
| 06 | outbox: insert, relay poll, retry | Outbox relay → event emitted → notification sent | — |
| 07 | — | WalletTopupModal → deposit created. CreditQuantityModal → order created. Admin verify → deposit verified | Complete deposit → purchase → consumption flow |
| 08 | Data migration: row counts, balance consistency | — | Old data accessible, new deposits correct |
| 09 | — | Old endpoints return 410 Gone | — |

## Rollback Strategy

Each phase is independently rollback-able:
- **Phase 01 (schema):** New tables are additive. No rollback needed — old tables untouched.
- **Phase 02-06 (backend):** New modules alongside old. Disable route mount in index.ts to rollback.
- **Phase 07 (frontend):** Git revert. FE calls old API paths if needed.
- **Phase 08 (dual-write):** Stop dual-write by reverting service code. Old Payment/WalletTopup still source of truth.
- **Phase 09 (cleanup):** Do not execute until all verification gates pass. Once done, old tables exist but are read-only.

## Success Criteria

- [ ] `deposits` table replaces `Payment` + `WalletTopup` for nạp tiền use case
- [ ] `orders` + `order_items` table for purchase flow (credit_audit service)
- [ ] Sepay webhook single code path for deposit verification
- [ ] Wallet balance derived from `wallet_transactions` (append-only)
- [ ] `reference_type`/`reference_id` populated on every wallet_transaction
- [ ] `idempotency_key` UNIQUE on deposits, orders, credit_ledger
- [ ] Transactional outbox: DB write + event publish in same tx
- [ ] Old Payment/WalletTopup still functional during transition (dual-write)
- [ ] Frontend: WalletTopupModal → deposits, CreditQuantityModal → orders, Admin → unified verification
- [ ] check-types root 3/3 PASS
- [ ] ESLint web 0 warning
- [ ] No destructive DB operation during entire plan

## Unresolved Questions

**Resolved in latest revision:**
- **GAP-4 / price (was UD2 "amount/39000")**: giá lấy từ `service_packages` (pricing_tiers[0].price ?? price) — server resolve theo `case.package_id`, client không gửi giá. `UPGRADE_LOCKED_PRICE` hardcode bị BỎ — resolve `getPackagePrice(packageId)` từ DB.
- **GAP-3 / P5 (T11 state machine)**: giữ inline deduction (atomic). T11 kích hoạt thuộc workflow-engine plan — handoff note trong T05.8.
- **ND2/UQ6 (veto-refund)**: `executeAction` sửa truyền `event.data` (có `caseOwnerId` + `lockedPrice` từ L208-212) thay vì raw request body `{ reason }`. `locked_price` guaranteed set tại createCase + upgrade-package.
- **ND4/UD4 (notification listener paths)**: path thật: `recipients.ts` (thêm 5 event mới vào `STUDENT_EVENTS`/`ADMIN_EVENTS`), `notification-templates.ts` (thêm template `deposit.verified`, `order.paid`, `wallet.balance_changed`), `domain-events.ts` (5 hằng số mới). Đã vào T06.7 + Files Map.
- **ND1 (H4 + branch 4b)**: Xoá branch 4b khỏi webhook. Phase 08 migration: `INSERT INTO deposits...SELECT FROM pending Payment` → webhook chỉ 1 path (4a). Không cần H4 guard. CRTOPUP prefix confirmed (đã match regex hiện tại).

1. **`deposits.amount_received` vs `amount`?** (partial payment handling) — add nullable `amount_received` column from day 1, populate later.
2. **`orders` partial refund?** MVP: full refund only. Future: partial.
3. **Admin verification UI redesign?** Keep current layout, swap Payment → Deposit data source.
4. **Archive old data or keep read-only?** Keep old tables read-only after Phase 09, archive in Phase 09 future step.
5. **Outbox relay — in-process or separate worker?** In-process `setInterval` for MVP. Separate worker for scale.
