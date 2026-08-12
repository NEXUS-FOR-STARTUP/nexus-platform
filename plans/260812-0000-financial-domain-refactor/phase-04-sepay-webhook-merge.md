# Phase 04: Sepay Webhook Merge + Wallet Refactor

**Status:** pending | **Effort:** 1.5h | **Depends:** Phase 01, Phase 02 | **Blocked by:** T08.0 migration SQL (chạy trước deploy, không cần full Phase 08)

## Overview

**Solution B (confirmed):** Xoá branch 4b khỏi webhook. Trước khi deploy Phase 04, chạy T08.0 migration (xem phase-08-legacy-migration.md) — chuyển hết Payment/WalletTopup pending sang deposit. Kết quả: webhook chỉ 1 path duy nhất (check deposits). Không cần H4 guard. Không cần dual-branch maintenance. Sạch.

Refactor `walletService` để accept optional tx param (dùng cho outbox integration trong Phase 06).

### T04.1: Single deposits webhook path

**File:** `apps/api/src/modules/payments/application/sepay-webhook.usecase.ts`

**Current state:** Two branches — 4a (walletTopup) + 4b (payment).

**Target state:** Single path — chỉ check `deposits`. Branch 4b đã bị xoá sau Phase 08 migration.

```typescript
// NEW unified flow (replaces entire sepayWebhookUseCase body after dedup check):
export async function sepayWebhookUseCase(
  payload: SePayWebhookPayload,
): Promise<SePayWebhookResult> {
  const { id: txnId, code, content, transferAmount, transferType } = payload;

  if (transferType !== "in") return { matched: false, action: "ignored" };

  const paymentCode = code || extractCodeFromContent(content);
  if (!paymentCode) return { matched: false, action: "no_match" };

  // Single unified lookup — ONLY deposits (branch 4b removed via Solution B)
  const deposit = await prisma.deposit.findFirst({
    where: { transfer_content: paymentCode, status: { in: ["pending", "amount_mismatch"] } },
    orderBy: { created_at: "desc" },
  });

  if (!deposit) {
    logger.warn({ txnId, paymentCode }, "sepay: no matching deposit found");
    return { matched: false, action: "no_match" };
  }

  // H1 fix: Amount mismatch → record it, don't silently no_match
  if (deposit.amount !== transferAmount) {
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: "amount_mismatch",
        metadata_json: {
          ...(deposit.metadata_json as any ?? {}),
          mismatch_txn_id: String(txnId),
          mismatch_received: transferAmount,
          mismatch_at: new Date(payload.transactionDate).toISOString(),
        },
      },
    });
    logger.warn({ txnId, depositId: deposit.id, expected: deposit.amount, got: transferAmount }, "sepay: deposit amount mismatch — marked for manual review");
    return { matched: true, action: "amount_mismatch" };
  }

  // C2 fix: Single transaction — wallet deposit + deposit update + outbox
  try {
    const idempotencyKey = `sepay-deposit-${deposit.transfer_content}-${txnId}`;

    await prisma.$transaction(async (tx) => {
      await walletService.deposit(deposit.user_id, deposit.amount, "deposit", deposit.id, idempotencyKey, tx);

      await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          status: "verified",
          verification_source: "auto",
          bank_transaction_id: String(txnId),
          bank_credited_at: new Date(payload.transactionDate),
        },
      });

      await insertOutboxEvent(tx, {
        event_type: DOMAIN_EVENTS.DEPOSIT_VERIFIED,
        payload_json: { depositId: deposit.id, userId: deposit.user_id, amount: deposit.amount, source: "auto" },
      });
    });

    logger.info({ txnId, depositId: deposit.id, amount: transferAmount }, "sepay: deposit auto-verified");
    return { matched: true, action: "verified" };
  } catch (error) {
    if ((error as any)?.code === "P2002") {
      logger.info({ txnId, depositId: deposit.id }, "sepay: duplicate deposit tx — already processed");
      return { matched: true, action: "verified" };
    }
    logger.error({ err: error, txnId, depositId: deposit.id }, "sepay: deposit verification failed");
    throw error;
  }
}
```

**Key changes:**
1. No fallback to old WalletTopup or Payment — single `deposits` lookup.
2. C2 fixed: Single `$transaction` wrapping `walletService.deposit` + `deposit.update` + `outbox.insert`.
3. H1 fixed: Amount mismatch → `status: "amount_mismatch"` with mismatch metadata stored, returns `action: "amount_mismatch"`.
4. In-memory dedupSet removed — DB-level `idempotency_key @unique` handles deduplication (P2002 catch).
5. **Điều kiện tiên quyết:** Phase 08 migration đã chạy (pending Payment/WalletTopup → deposits) trước khi deploy code này.

### T04.2: WalletService — add `service_payment` type

**File:** `apps/api/src/modules/wallet/application/wallet.service.ts`

Add new method `payForOrder`:

```typescript
/**
 * Deduct wallet balance for an order (service_payment type).
 * Must be called within a Prisma transaction for atomicity with order creation.
 */
async payForOrder(
  userId: string,
  amountVnd: number,
  orderId: string,
  idempotencyKey: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  return client.$transaction(async (innerTx) => {
    const wallet = await getWalletForUpdate(innerTx as any, userId);
    if (!wallet) throw new WalletNotFoundError(userId);
    if (wallet.balance < amountVnd) throw new InsufficientBalanceError(wallet.balance, amountVnd);

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amountVnd;

    await createTransaction(innerTx as any, {
      walletId: wallet.id,
      type: "service_payment",
      amount: -amountVnd,
      balanceBefore,
      balanceAfter,
      referenceType: "order",
      referenceId: orderId,
      idempotencyKey,
    });

    await updateWalletBalance(innerTx as any, wallet.id, balanceAfter);
  });
}
```

**Note:** Phase 03's `create-order.usecase.ts` will use this. If Phase 03 already uses `withdraw` with updated signature, refactor to `payForOrder` for clarity.

### T04.3: WalletService — update deposit to accept optional tx

**File:** `apps/api/src/modules/wallet/application/wallet.service.ts`

```typescript
async deposit(
  userId: string,
  amountVnd: number,
  referenceType: string,
  referenceId: string,
  idempotencyKey: string,
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;
  return client.$transaction(async (innerTx) => {
    // ... same logic, use innerTx instead of tx variable
  });
}
```

This allows Phase 06 outbox to wrap deposit + outbox insert in same transaction.

### T04.4: WalletRepository — update createTransaction

**File:** `apps/api/src/modules/wallet/infrastructure/persistence/wallet.repository.ts`

```typescript
export async function createTransaction(
  tx: Prisma.TransactionClient | typeof prisma,
  params: {
    walletId: string;
    type: WalletTxType;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    referenceType: string;
    referenceId: string | null;
    idempotencyKey: string;
    metadataJson?: Record<string, unknown>;
  },
) {
  return (tx as typeof prisma).walletTransaction.create({
    data: {
      wallet_id: params.walletId,
      type: params.type,
      amount: params.amount,
      balance_before: params.balanceBefore,
      balance_after: params.balanceAfter,
      reference_type: params.referenceType,  // NEW canonical
      reference_id: params.referenceId,       // NEW canonical
      source_type: params.referenceType,      // OLD compat — remove Phase 09
      source_id: params.referenceId,          // OLD compat — remove Phase 09
      idempotency_key: params.idempotencyKey,
      metadata_json: params.metadataJson as any,
    },
  });
}
```

### T04.5: Wallet routes — add GET /history endpoint

**File:** `apps/api/src/modules/wallet/infrastructure/http/wallet.routes.ts`

Add:
```typescript
// GET /api/wallet/history
walletRouter.get("/history", listWalletTransactionsHandler);
```

**File:** wallet.controller.ts — add handler:
```typescript
export async function listWalletTransactionsHandler(c: Context) {
  try {
    const session = await getSession(c);
    const { limit = "20", offset = "0" } = c.req.query();
    const result = await walletService.getHistory(session.user.id, Number(limit), Number(offset));
    return c.json({ transactions: result });
  } catch (err) { return handleError(c, err); }
}
```

### T04.6: WalletService — getHistory returns reference_type

**File:** `apps/api/src/modules/wallet/application/wallet.service.ts`

`getHistory` already returns `sourceType`/`sourceId` from repository. Since we dual-write, these are still populated. No change needed for GET response — FE reads `sourceType`/`sourceId`. After Phase 09, update to `referenceType`/`referenceId`.

### T04.7: Event constants — add new events

**File:** `apps/api/src/shared/domain/domain-events.ts`

```typescript
export const DOMAIN_EVENTS = {
  // ... existing ...
  DEPOSIT_VERIFIED: "deposit.verified",
  DEPOSIT_REJECTED: "deposit.rejected",
  ORDER_PAID: "order.paid",
  ORDER_REFUNDED: "order.refunded",
  WALLET_BALANCE_CHANGED: "wallet.balance_changed",
} as const;
```

## Testing

- Integration: Sepay webhook hits deposit with matching transfer_content → deposit auto-verified, wallet balance increased
- Integration: Sepay webhook with amount mismatch → deposit marked `amount_mismatch`, wallet unchanged
- Integration: Sepay webhook duplicate → P2002 caught, return verified (idempotent)
- Integration: Sepay webhook without matching deposit → no_match
- Unit: walletService.payForOrder with insufficient balance → throws InsufficientBalanceError
- Unit: walletService.deposit with tx param → uses provided tx client

## Rollback

1. Revert `sepay-webhook.usecase.ts` to pre-migration version (2-branch)
2. Drop deposits migrated from old Payment/WalletTopup (migration is reversible — deposits have idempotency_key, won't conflict with new)
3. Revert wallet.service.ts changes

## Deliverables

- [ ] `sepay-webhook.usecase.ts` — single deposits path (old branches removed)
- [ ] `wallet.service.ts` — tx param on deposit, new payForOrder method
- [ ] `wallet.repository.ts` — dual-write reference_type + source_type
- [ ] `wallet.routes.ts` — GET /history endpoint
- [ ] `domain-events.ts` — new event constants
- [ ] Phase 08 migration (pending Payment/WalletTopup → deposits) executed BEFORE deploy
- [ ] check-types passes
