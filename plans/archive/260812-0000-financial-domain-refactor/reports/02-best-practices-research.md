# Research Report: Financial Domain Design — Best Practices

**Date:** 2026-08-12
**Scope:** Wallet → Order → Service architecture, double-entry ledger, event sourcing, idempotency, domain separation

---

## Executive Summary

Industry standard for fintech/SaaS wallet systems revolves around 4 pillars:
1. **Append-only double-entry ledger** — never UPDATE balances, always INSERT journal lines
2. **Domain separation** via bounded contexts — Wallet (money), Order (intent), Service (consumption) as independent aggregates
3. **Event sourcing + CQRS** — event log as single source of truth, materialized views for queries
4. **Idempotency + outbox** — idempotency_key + UNIQUE constraint + transactional outbox for exactly-once processing

Our design (`deposits → wallet_tx → orders → order_items → credit_ledger`) aligns perfectly with industry consensus. Key gaps to address: pessimistic locking on wallet balance reads, double-entry invariant enforcement, and outbox pattern for cross-domain event publishing.

---

## Research Methodology

- **Sources:** 15+ articles across dev.to, medium.com, squareup.com, freecodecamp.org, Reddit, StackOverflow, finlego.com
- **Date range:** 2024–2026
- **Search terms:** double-entry accounting schema, wallet payment domain design, event sourcing ledger, idempotency outbox PostgreSQL, SaaS wallet multiple services order-item pattern

---

## Key Findings

### 1. Ledger Pattern — Append-Only, Never Mutate

**Core principle:** All financial systems MUST treat the ledger as an immutable event log. Never UPDATE/DELETE rows. Corrections are new compensating entries.

| Anti-pattern | Correct pattern |
|---|---|
| `UPDATE wallet SET balance = balance + 100` | `INSERT INTO ledger (amount: 100, type: 'credit')` |
| `DELETE FROM ledger WHERE id = X` | `INSERT INTO ledger (amount: -100, type: 'reversal', ref: X)` |
| Store balance as mutable column | Derive balance: `SELECT SUM(amount) FROM ledger` |

**Database schema** — 3 canonical tables:
```
accounts          (id, name, type, currency)
journal_entries   (id, description, timestamp, metadata_jsonb)
journal_lines     (id, entry_id FK, account_id FK, amount SIGNED, entry_type: debit|credit)
```

**Constraint:** `CHECK (SUM(debits) - SUM(credits) = 0)` per journal_entry — enforced at DB level.

**Relevance to Nexus:** Our `wallet_transactions` is the `journal_lines` table. We should enforce double-entry: every deposit → debit system account + credit user wallet. Every purchase → debit user wallet + credit system revenue. Currently we only record one side.

---

### 2. Domain Separation — 4 Bounded Contexts

Research consistently identifies these contexts:

| Context | Responsibility | Our Design |
|---------|---------------|------------|
| **Wallet** | Balance, money movement, bank reconciliation | `deposits` + `wallet_transactions` + `user_wallets` ✅ |
| **Order** | Purchase intent, lifecycle state | `orders` + `order_items` ✅ |
| **Payment Bridge** | PSP integration (bank, Sepay) | `deposits` (transfer_content, proof, verify) ✅ |
| **Service Ledger** | Service-specific consumption tracking | `credit_ledger` ✅ |

**Communication pattern:** Do NOT couple Order ↔ Wallet directly. Use event-driven choreography:
```
OrderCreated → WalletService reserves funds → OrderPaid → WalletService captures funds
```

**Saga pattern** for rollback: if order fails after wallet deduction → compensating transaction (refund).

**Relevance:** Our current `verifyPayment` does everything in one transaction (payment + credit + case) — violates separation. Need to split: deposit completes → fire event → order handler creates credit. This makes wallet deposits reusable across services.

---

### 3. Concurrency — Protect Wallet Balance

High-frequency updates on single wallet require locking. Two approaches:

**Pessimistic Locking (recommended for financial):**
```sql
START TRANSACTION;
SELECT balance FROM user_wallets WHERE user_id = ? FOR UPDATE;
-- validate balance >= cost
UPDATE user_wallets SET balance = balance - cost WHERE user_id = ?;
INSERT INTO wallet_transactions (...);
COMMIT;
```

**Optimistic Locking (better for read-heavy):**
```
UPDATE user_wallets SET balance = balance - cost, version = version + 1
WHERE user_id = ? AND version = ?
-- if rows_affected = 0 → retry
```

**Relevance:** Our `wallet.repository.ts` already uses `SELECT ... FOR UPDATE` via `getWalletForUpdate()`. Good. Need to ensure ALL wallet mutation paths use this — check `purchase-credits.usecase.ts`.

---

### 4. Idempotency + Outbox — Exactly-Once Processing

Every financial API must handle retries:

1. **Client sends `idempotency_key`** (UUID) with every request
2. **Database UNIQUE constraint** on `idempotency_key` column
3. **Check-before-insert:** if key exists → return cached result, don't re-execute

**Transactional Outbox pattern** solves "dual write" problem (DB update + event publish aren't atomic):

```sql
BEGIN;
  INSERT INTO ledger_entries (...);
  INSERT INTO outbox (event_type, payload, status) VALUES ('WalletDeposited', ...);
COMMIT;
-- Async worker polls outbox → publishes to event bus
```

**Relevance:** Our `wallet_transactions` already has `idempotency_key UNIQUE` — perfect. Missing: outbox pattern for cross-domain events. Current event bus (`emitEvent`) is fire-and-forget without transactional guarantee — potential event loss on crash between DB write and emit.

---

### 5. Order-Item Pattern — Single Wallet, Multiple Services

A single wallet funding multiple service types follows the **Order-Item** pattern:

```
orders:
  user_id, total_amount, status: pending→paid→refunded

order_items:
  order_id, service_type, quantity, unit_price, amount
  metadata_json  ← service-specific context (case_id, etc.)
```

**Consumption flow (atomic):**
```
1. Service requests consumption
2. Wallet service: SELECT FOR UPDATE → validate balance → deduction
3. On success → ledger entry + order item
4. On failure → deny access (insufficient funds)
```

**Key insight:** Services never touch wallet directly. They call a centralized wallet API with `idempotency_key`. The wallet service owns ALL money movement.

**Relevance:** Our design matches this exactly. `order_items.service_type` enables future services without schema changes.

---

### 6. Double-Entry Enforcement — Why It Matters

Without double-entry, you can't prove NO money was created or destroyed:

```
Every transaction = at least 2 journal_lines:
  DEPOSIT:    debit(system_cash_account, +amount) + credit(user_wallet, +amount)
  PURCHASE:   debit(user_wallet, -amount) + credit(system_revenue, +amount)
  CONSUME:    debit(system_revenue, -amount) + credit(system_consumed, +amount)
```

**At any point:** `SUM(all debits) - SUM(all credits) = 0` → system integrity proven.

**Relevance:** Our current `wallet_transactions` records only one side (user's). Missing counterpart entries. For MVP, derived balance from single-sided ledger works. For future, add counterpart tracking.

---

## Comparative Analysis

| Aspect | Current Nexus | Proposed | Industry Standard |
|--------|--------------|----------|-------------------|
| Money movement | Single-sided wallet_tx | Single-sided (MVP) → Double-entry (future) | Double-entry mandatory |
| Balance storage | Mutable column | Mutable column + append-only txn | Sum from ledger (derived) |
| Deposit vs Purchase | Mixed (Payment does both) | Separated (deposits + orders) | Separated bounded contexts ✅ |
| Order lifecycle | None (direct credit create) | orders + order_items | Order aggregate ✅ |
| Multi-service | Hard-coded | order_items.service_type | Order-item pattern ✅ |
| Concurrency | FOR UPDATE (good) | FOR UPDATE (keep) | Pessimistic/optimistic |
| Idempotency | idempotency_key UNIQUE ✅ | Same | Standard |
| Cross-domain events | Fire-and-forget emitEvent | Missing outbox | Transactional outbox |
| Service extensibility | Schema change required | 1 order_items row | Feature flags + metadata |

---

## Implementation Recommendations

### Must-Have (Phase 1)
1. **Deposits table** — replace Payment + WalletTopup with unified deposits
2. **Orders + order_items** — bridge wallet ↔ service consumption
3. **Keep idempotency_key UNIQUE** — already in place
4. **Keep SELECT FOR UPDATE** — already in wallet.repository.ts

### Should-Have (Phase 2)
5. **Double-entry ledger** — add counterpart journal lines (system accounts)
6. **Transactional outbox** — replace fire-and-forget emitEvent with outbox + relay
7. **Saga compensation** — refund flow for failed orders

### Nice-to-Have (Future)
8. **Derived balance** — compute balance from ledger sum, not mutable column
9. **Event sourcing** — full event store replacing mutable wallet state
10. **CQRS** — separate read models for balance display

---

## Common Pitfalls

| Pitfall | Prevention |
|---------|-----------|
| Using FLOAT for money | Use DECIMAL(19,4) or BIGINT (cents). Nexus uses Int → correct ✅ |
| Updating balance outside transaction | Always wrap wallet mutation in `$transaction` ✅ |
| Missing idempotency on retry | UNIQUE constraint on idempotency_key ✅ |
| Dual-write: DB update + event emit not atomic | Use outbox pattern or change-data-capture |
| Direct cross-service DB access | Wallet API as single entry point for all money ops |
| Soft-delete on ledger rows | Never. COMPENSATING entries only |

---

## Resources

- [Square: Ledger Database Design](https://developer.squareup.com/blog/books-an-immutable-double-entry-accounting-database-service/)
- [FreeCodeCamp: Accounting Database Design](https://www.freecodecamp.org/news/accounting-database-design/)
- [dev.to: PostgreSQL Event Sourcing](https://dev.to/event-driven/event-sourcing-with-postgresql)
- [Microservices.io: Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Uber: LedgerStore — immutable financial ledger](https://www.uber.com/blog/ledgerstore/)

---

## Unresolved Questions

1. **Double-entry now or later?** MVP with single-sided ledger is simpler, but migrating later is costly. Recommend: add `counterpart_account` column to `wallet_transactions` from day 1, populate later.
2. **Outbox vs CDC?** Transactional outbox (application-level) simpler. CDC (Debezium + Kafka) more scalable. For Nexus scale, outbox sufficient.
3. **`amount_received` vs `amount`?** Deposits should track both requested amount and actual bank amount for partial payments. Add field to deposits table.
