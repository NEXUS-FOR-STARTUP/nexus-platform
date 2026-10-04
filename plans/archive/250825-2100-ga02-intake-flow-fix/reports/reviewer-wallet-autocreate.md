# Review — Wallet Auto-Create (GA-02 intake-flow-fix)

- Reviewer: `WalletFixReviewer`
- Branch: `feat/ga02-intake-flow-fix`
- Scope (4 files): `wallet.repository.ts`, `wallet.service.ts`, `auth.ts`, `phase-10-wallet-auto-create.test.ts`
- Verdict: **APPROVED_WITH_NITS**

---

## Summary

The change replaces the dead non-transactional `getOrCreateWallet` (and the inline
create in `deposit`) with a single transaction-safe `getOrCreateWalletInTx`, and
wires it into all four wallet mutation paths. `WalletNotFoundError` is no longer
thrown from the service; a wallet-less user attempting a debit now sees
`INSUFFICIENT_BALANCE` (balance `0`) instead of `WALLET_NOT_FOUND`. A Better Auth
`databaseHooks.user.create.after` hook best-effort pre-creates the wallet at signup,
removing the race window in the common path.

All findings below were verified against the actual `node_modules/better-auth`
v1.4.3 sources and the Prisma schema, not assumed.

---

## Findings

### NIT-1 — P2002 race window in `getOrCreateWalletInTx` (acceptable, comment warranted)

**File:** `apps/api/src/modules/wallet/infrastructure/persistence/wallet.repository.ts:4-14`

**Analysis.** `getOrCreateWalletInTx` does `SELECT … FOR UPDATE` then `INSERT` on
miss. In PostgreSQL, `FOR UPDATE` on a *non-existent* row acquires no lock (no
gap/next-key locking at READ COMMITTED), so two concurrent first-time accesses for
the same `user_id` both read `null` and both proceed to `INSERT`. One commits, the
other fails with a unique-constraint violation (`P2002` — `user_wallets.user_id`
is `@unique`, verified in `prisma/schema.prisma:185`), which aborts that
transaction.

**Severity assessment.** Low. The signup hook now pre-creates the wallet for every
new user, so the only reachable window is: *signup hook failed best-effort* AND
*concurrent first credit operation*. Failure mode is a clean rollback (no partial
state) surfacing as a 500/Prisma error; the client retry succeeds because the
wallet row now exists. Catching `P2002` *inside* the transaction cannot recover in
PostgreSQL (the tx is already aborted), so the only robust hardening is an outer
retry wrapper — disproportionate for this probability.

**Fix (optional):** add a one-line comment documenting the reliance on the signup
hook, e.g.:

```ts
// Race: two concurrent first-time accesses can both miss and one INSERT hits the
// user_id unique constraint (P2002). Mitigated by the signup databaseHook
// pre-creating the wallet; a failed hook + concurrent first purchase is the only
// residual window, and it fails clean (rollback + client retry succeeds).
```

### NIT-2 — `WalletNotFoundError` class is now dead code

**File:** `apps/api/src/modules/wallet/domain/wallet.types.ts:43-47`

No throw site remains (verified by grep across `apps/api/src`); the only consumer
is a *string* comparison in `credit-refund.ts:118` (`error.code === 'WALLET_NOT_FOUND'`),
which does not import the class. Harmless to keep as a domain symbol, but it is
unused. Remove only if the team wants zero dead exports; not required.

### NIT-3 — debit paths auto-create a wallet that is rolled back on failure

**File:** `apps/api/src/modules/wallet/application/wallet.service.ts:67-72` (withdraw), `:140-142` (payForOrder)

Not a bug — a design nuance worth recording. In `withdraw`/`payForOrder`, the
`getOrCreateWalletInTx` runs, then `InsufficientBalanceError` is thrown, which
rolls the whole transaction back *including the create*. So the wallet row does
not persist after a failed debit. This is correct: the create exists solely to
select the right error (`INSUFFICIENT_BALANCE` with `current: 0`) instead of
`WALLET_NOT_FOUND`; a wallet-less user (balance 0) can never succeed on a debit
anyway. Wallet persistence is guaranteed by (a) the signup hook and (b) the
`deposit`/`refund` credit paths, which commit. Edge case: withdrawing exactly
`0` VND would commit a newly-created wallet — harmless, but worth being aware of.

---

## Verification (per contract)

### 1. `getOrCreateWalletInTx` correctness & parity

- `wallet.repository.ts:4-14` is a byte-for-byte equivalent of the old
  `deposit` inline-create (same `data: { user_id, balance: 0 }`, same
  `select: { id: true, balance: true }`). **Parity confirmed.**
- Existing-wallet path unchanged: `getWalletForUpdate` (FOR UPDATE lock) returns
  the row, helper returns it without touching create. **No behavior change for
  funded-wallet paths.**
- Dead non-tx `getOrCreateWallet` fully removed; no callers remain (grep clean).

### 2. `wallet.service.ts` call sites & cleanup

| Path | Uses helper? | Error path |
|---|---|---|
| `deposit` (line 27) | yes | n/a (credit) |
| `withdraw` (line 68) | yes | `InsufficientBalanceError` intact (line 71) |
| `refund` tx-path (line 102) | yes | n/a (credit) |
| `payForOrder` (line 141) | yes | `InsufficientBalanceError` intact (line 142) |

- `WalletNotFoundError` no longer thrown anywhere in the service (grep clean).
- Import cleanup complete: `getWalletForUpdate` and `WalletNotFoundError` removed
  from the service import block; only `InsufficientBalanceError` remains.
- `deposit` behavior otherwise unchanged.

### 3. `auth.ts` `databaseHooks.user.create.after`

- **API match (v1.4.3):** verified against
  `node_modules/better-auth/dist/db/with-hooks.mjs` — hooks resolve via
  `hooks[model]?.create?.after` and are invoked as `toRun(created, context)`.
  The `created` object is the adapter's full create result, so `user.id` is
  present (Prisma adapter returns the row; `id` is not remapped in the
  `user.fields` config, `auth.ts:65-78`).
- **Runs for emailOTP + social + email/password:** the hook wraps the *adapter*
  (low level), so every user-creation path flows through it regardless of plugin.
- **try/catch is justified and effectively required:** in
  `@better-auth/core/dist/context/transaction.mjs`, after-hooks are pushed to
  `pendingHooks` and awaited (`for (const hook of pendingHooks) await hook()`)
  *outside* the main try/catch — a throwing after-hook propagates and would fail
  the signup request. The `try/catch + logger.warn` is therefore load-bearing,
  not cosmetic.
- **No transaction interference:** `queueAfterTransactionHook` runs the hook
  *after* commit for transactional flows, so the wallet `INSERT` is a separate
  post-commit statement, and signup success is never blocked by wallet failure.

### 4. `phase-10` tests

- **Contract coverage:** (a) wallet-less withdraw → auto-create +
  `INSUFFICIENT_BALANCE` (asserts `createCalls` data `user_id`/`balance:0`, and
  `InsufficientBalanceError` code/details — not `WALLET_NOT_FOUND`); (b) funded
  withdraw → no create, correct debit (`balance_before:50000`,
  `balance_after:11000`, `update.balance:11000`); (c) refund tx-path →
  auto-create, no throw, `balance_after:5000`. All three defend the contract.
- **Mocking:** direct-assignment of `$transaction` + `finally` restore matches the
  phase-09 convention (documented rationale: Prisma Proxy defeats `t.mock`). The
  `fakeTx` covers every repository dependency exercised
  (`$queryRaw`, `userWallet.create/update`, `walletTransaction.create`,
  `domainEventOutbox.create`) — including `insertOutboxEvent` in the refund
  tx-path (verified `outbox.repository.ts:13` uses `tx.domainEventOutbox.create`),
  so no assertion is a silent no-op.
- **Isolation:** `$transaction` restored in `finally` for the two tests that
  mutate it; refund test passes `tx` directly and touches no global.
  `process.env.NODE_ENV = 'test'` set at module load without restore — consistent
  with phase-09 (same pattern). No live DB access.

### 5. Caller regression hunt

- `purchase-credits.usecase.ts:42` and `create-order.usecase.ts:124` both call
  `walletService.withdraw` and now receive `INSUFFICIENT_BALANCE` instead of
  `WALLET_NOT_FOUND` for wallet-less users — the intended benefit. Their
  surrounding code (outer `prisma.$transaction`) is untouched by this diff; the
  pre-existing nested-transaction pattern is unchanged.
- `credit-refund.ts:115-123` `WALLET_NOT_FOUND` catch is now dead (refund never
  throws it) but is a harmless string comparison — acceptable defensive code; no
  action required.

---

## Overall Assessment

Correct, minimal, and consistent with the existing deposit pattern. The
get-or-create is centralized in one transaction-safe helper, the dead code is
removed, and the signup hook both matches the Better Auth v1.4.3 hook contract
and is genuinely load-bearing (its try/catch prevents an after-hook throw from
failing signup). No BLOCKER/MAJOR/HIGH findings. The residual P2002 race is
low-probability and fails clean; a comment (NIT-1) is the only recommended change.

## Recommended Actions

1. (NIT-1, optional) Add the race-window comment in `getOrCreateWalletInTx`.
2. (NIT-2, optional) Delete the unused `WalletNotFoundError` class if the team
   wants zero dead exports — otherwise leave as-is.
