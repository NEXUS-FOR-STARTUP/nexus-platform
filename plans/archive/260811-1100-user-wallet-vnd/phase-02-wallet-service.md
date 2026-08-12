# Phase 02 — WalletService

- Priority: P1 | Status: Done | Effort: 3h
- Depends: Phase 01 (schema)
- Blocks: Phase 03, 05, 06, 07

## Overview

Implement `WalletService` — service layer cho ví VND. 5 methods: `deposit`, `withdraw`, `refund`, `getBalance`, `getHistory`. Tất cả mutation trong DB transaction với `SELECT FOR UPDATE` lock.

## File Structure

```
apps/api/src/modules/wallet/
├── domain/
│   └── wallet.types.ts          # Types: WalletTxType, WalletTxSourceType, InsufficientBalance error
├── application/
│   └── wallet.service.ts        # WalletService — 5 methods
├── infrastructure/
│   ├── persistence/
│   │   └── wallet.repository.ts # Prisma queries (getBalance, createTransaction, getHistory)
│   └── http/
│       └── wallet.routes.ts     # API routes: GET /wallet/balance, GET /wallet/history
```

## wallet.types.ts

```typescript
// apps/api/src/modules/wallet/domain/wallet.types.ts

export const WALLET_TX_TYPES = ['deposit', 'withdrawal', 'refund', 'adjustment', 'migration'] as const;
export type WalletTxType = (typeof WALLET_TX_TYPES)[number];

export const WALLET_SOURCE_TYPES = [
  'topup',
  'credit_purchase',
  'case_consume',
  'admin_refund',
  'platform_bonus',
  'migration',
] as const;
export type WalletTxSourceType = (typeof WALLET_SOURCE_TYPES)[number];

export interface WalletTransactionDTO {
  id: string;
  walletId: string;
  type: WalletTxType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  sourceType: WalletTxSourceType;
  sourceId: string | null;
  idempotencyKey: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export class InsufficientBalanceError extends Error {
  constructor(
    public readonly current: number,
    public readonly required: number
  ) {
    super(`Số dư không đủ: ${current} VND, cần ${required} VND`);
    this.name = 'InsufficientBalanceError';
  }
}

export class WalletNotFoundError extends Error {
  constructor(public readonly userId: string) {
    super(`Wallet not found for user ${userId}`);
    this.name = 'WalletNotFoundError';
  }
}
```

## wallet.repository.ts

```typescript
// apps/api/src/modules/wallet/infrastructure/persistence/wallet.repository.ts

import { prisma } from '../../../../db';
import type { Prisma, PrismaClient } from '@prisma/client';

export async function getOrCreateWallet(userId: string) {
  let wallet = await prisma.userWallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.userWallet.create({
      data: { userId, balance: 0 },
    });
  }
  return wallet;
}

export async function getWalletBalance(userId: string): Promise<number> {
  const wallet = await prisma.userWallet.findUnique({
    where: { userId },
    select: { balance: true },
  });
  return wallet?.balance ?? 0;
}

export async function getWalletForUpdate(
  tx: Prisma.TransactionClient,
  userId: string
): Promise<{ id: string; balance: number } | null> {
  const rows = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
    SELECT id, balance FROM user_wallets WHERE user_id = ${userId} FOR UPDATE
  `;
  return rows[0] ?? null;
}

export async function createTransaction(
  tx: Prisma.TransactionClient,
  data: {
    walletId: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    sourceType: string;
    sourceId?: string;
    idempotencyKey: string;
    metadata?: Record<string, unknown>;
  }
) {
  return tx.walletTransaction.create({ data });
}

export async function updateWalletBalance(
  tx: Prisma.TransactionClient,
  walletId: string,
  balance: number
) {
  return tx.userWallet.update({
    where: { id: walletId },
    data: { balance },
  });
}

export async function getTransactionHistory(
  userId: string,
  limit = 20,
  offset = 0
) {
  const wallet = await prisma.userWallet.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!wallet) return [];

  return prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });
}
```

## wallet.service.ts

```typescript
// apps/api/src/modules/wallet/application/wallet.service.ts

import { prisma } from '../../../db';
import {
  getOrCreateWallet,
  getWalletBalance,
  getWalletForUpdate,
  createTransaction,
  updateWalletBalance,
  getTransactionHistory,
} from '../infrastructure/persistence/wallet.repository';
import {
  InsufficientBalanceError,
  WalletNotFoundError,
} from '../domain/wallet.types';
import { randomUUID } from 'node:crypto';

export class WalletService {
  async getBalance(userId: string): Promise<number> {
    return getWalletBalance(userId);
  }

  async deposit(
    userId: string,
    amountVnd: number,
    sourceType: string,
    sourceId: string,
    idempotencyKey: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Lazy-create wallet if not exists
      let wallet = await getWalletForUpdate(tx, userId);
      if (!wallet) {
        wallet = await tx.userWallet.create({
          data: { userId, balance: 0 },
        });
        // Re-lock sau create
        wallet = await getWalletForUpdate(tx, userId)!;
      }

      const balanceBefore = wallet!.balance;
      const balanceAfter = balanceBefore + amountVnd;

      const txn = await createTransaction(tx, {
        walletId: wallet!.id,
        type: 'deposit',
        amount: amountVnd,
        balanceBefore,
        balanceAfter,
        sourceType,
        sourceId,
        idempotencyKey,
      });

      await updateWalletBalance(tx, wallet!.id, balanceAfter);

      return txn;
    });
  }

  async withdraw(
    userId: string,
    amountVnd: number,
    caseId: string,
    idempotencyKey: string    // required (red-team A5: chống double-withdraw nếu retry)
  ) {
    return prisma.$transaction(async (tx) => {
      const wallet = await getWalletForUpdate(tx, userId);
      if (!wallet) {
        throw new WalletNotFoundError(userId);
      }

      if (wallet.balance < amountVnd) {
        throw new InsufficientBalanceError(wallet.balance, amountVnd);
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore - amountVnd;

      const txn = await createTransaction(tx, {
        walletId: wallet.id,
        type: 'withdrawal',
        amount: -amountVnd,
        balanceBefore,
        balanceAfter,
        sourceType: 'credit_purchase', // Mua credit bằng ví VND. Case consume là credit_ledgers, không phải wallet
        sourceId: caseId,
        idempotencyKey: key,
      });

      await updateWalletBalance(tx, wallet.id, balanceAfter);

      return txn;
    });
  }

  async refund(
    userId: string,
    amountVnd: number,
    sourceType: string,      // 'admin_veto' từ workflow engine
    caseId: string,
    idempotencyKey: string,  // required
    tx?: Prisma.TransactionClient  // optional — dùng chung tx với CaseTransitionService
  ) {
    // Nếu có tx param → manual implement để tránh nested transaction
    if (tx) {
      const wallet = await getWalletForUpdate(tx, userId);
      if (!wallet) throw new WalletNotFoundError(userId);
      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + amountVnd;
      await createTransaction(tx, {
        walletId: wallet.id, type: 'refund', amount: amountVnd,
        balanceBefore, balanceAfter, sourceType, sourceId: caseId,
        idempotencyKey,
      });
      await updateWalletBalance(tx, wallet.id, balanceAfter);
      return;
    }
    // Không có tx → tạo tx riêng, delegate cho deposit
    return this.deposit(userId, amountVnd, sourceType, caseId, idempotencyKey);
  }

  async getHistory(
    userId: string,
    limit = 20,
    offset = 0
  ) {
    return getTransactionHistory(userId, limit, offset);
  }
}

// Singleton export
export const walletService = new WalletService();
```

## wallet.routes.ts

```typescript
// apps/api/src/modules/wallet/infrastructure/http/wallet.routes.ts

import { Hono } from 'hono';
import { walletService } from '../../application/wallet.service';
import { authMiddleware } from '../../../../auth';

const walletRoutes = new Hono();

walletRoutes.use('*', authMiddleware);

walletRoutes.get('/balance', async (c) => {
  const userId = c.get('user').id;
  const balance = await walletService.getBalance(userId);
  return c.json({ balance });
});

walletRoutes.get('/history', async (c) => {
  const userId = c.get('user').id;
  const limit = Number(c.req.query('limit') ?? 20);
  const offset = Number(c.req.query('offset') ?? 0);
  const transactions = await walletService.getHistory(userId, limit, offset);
  return c.json({ transactions });
});

export { walletRoutes };
```

Mount trong `apps/api/src/index.ts`:
```typescript
import { walletRoutes } from './modules/wallet/infrastructure/http/wallet.routes';
app.route('/wallet', walletRoutes);
```

## Deliverables

- [x] `wallet.types.ts` — types + error classes
- [x] `wallet.repository.ts` — 6 functions (getOrCreateWallet, getBalance, getWalletForUpdate, createTransaction, updateWalletBalance, getHistory)
- [x] `wallet.service.ts` — 5 methods (deposit, withdraw, refund, getBalance, getHistory) trong DB transaction
- [x] `wallet.routes.ts` — GET /wallet/balance, GET /wallet/history
- [x] Mount routes trong `index.ts` (thực tế: `app.route('/api/wallet', walletRoutes)` tại `apps/api/src/index.ts:158`)
- [ ] Unit test: deposit → balance tăng, withdraw → InsufficientBalanceError, concurrent withdraw → 1 pass 1 fail <!-- chưa có test file wallet nào trong apps/api/src/shared/infrastructure/tests/ -->
- [x] `check-types` PASS
