import { prisma } from '../../../db.js'
import type { Prisma } from '@prisma/client'
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { insertOutboxEvent } from "../../../shared/infrastructure/persistence/outbox.repository.js";
import {
  getWalletForUpdate,
  createTransaction,
  updateWalletBalance,
  getWalletBalance as repoGetBalance,
  getTransactionHistory,
} from '../infrastructure/persistence/wallet.repository.js'
import {
  InsufficientBalanceError,
  WalletNotFoundError,
} from '../domain/wallet.types.js'

export class WalletService {
  async getBalance(userId: string): Promise<number> {
    return repoGetBalance(userId)
  }

  async deposit(
    userId: string,
    amountVnd: number,
    sourceType: string,
    sourceId: string,
    idempotencyKey: string,
  ) {
    return prisma.$transaction(async (tx) => {
      let wallet = await getWalletForUpdate(tx, userId)
      if (!wallet) {
        wallet = await tx.userWallet.create({
          data: { user_id: userId, balance: 0 },
          select: { id: true, balance: true },
        })
        wallet = (await getWalletForUpdate(tx, userId))!
      }

      const balanceBefore = wallet!.balance
      const balanceAfter = balanceBefore + amountVnd

      const txn = await createTransaction(tx, {
        walletId: wallet!.id,
        type: 'deposit',
        amount: amountVnd,
        balanceBefore,
        balanceAfter,
        referenceType: sourceType,
        referenceId: sourceId,
        idempotencyKey,
      })

      await updateWalletBalance(tx, wallet!.id, balanceAfter)

      await insertOutboxEvent(tx, {
        event_type: DOMAIN_EVENTS.WALLET_BALANCE_CHANGED,
        payload_json: {
          userId,
          amount: amountVnd,
          balanceBefore,
          balanceAfter,
          referenceType: sourceType,
          referenceId: sourceId,
        },
      })

      return txn
    })
  }

  async withdraw(
    userId: string,
    amountVnd: number,
    idempotencyKey: string,
    opts?: { referenceType?: string; referenceId?: string },
  ) {
    return prisma.$transaction(async (tx) => {
      const wallet = await getWalletForUpdate(tx, userId)
      if (!wallet) {
        throw new WalletNotFoundError(userId)
      }

      if (wallet.balance < amountVnd) {
        throw new InsufficientBalanceError(wallet.balance, amountVnd)
      }

      const balanceBefore = wallet.balance
      const balanceAfter = balanceBefore - amountVnd

      const txn = await createTransaction(tx, {
        walletId: wallet.id,
        type: 'withdrawal',
        amount: -amountVnd,
        balanceBefore,
        balanceAfter,
        referenceType: opts?.referenceType ?? 'adjustment',
        referenceId: opts?.referenceId ?? idempotencyKey,
        idempotencyKey,
      })

      await updateWalletBalance(tx, wallet.id, balanceAfter)

      return txn
    })
  }

  async refund(
    userId: string,
    amountVnd: number,
    sourceType: string,
    caseId: string,
    idempotencyKey: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (tx) {
      const wallet = await getWalletForUpdate(tx, userId)
      if (!wallet) throw new WalletNotFoundError(userId)
      const balanceBefore = wallet.balance
      const balanceAfter = balanceBefore + amountVnd
      await createTransaction(tx, {
        walletId: wallet.id,
        type: 'refund',
        amount: amountVnd,
        balanceBefore,
        balanceAfter,
        referenceType: sourceType,
        referenceId: caseId,
        idempotencyKey,
      })
      await updateWalletBalance(tx, wallet.id, balanceAfter)

      await insertOutboxEvent(tx, {
        event_type: DOMAIN_EVENTS.WALLET_BALANCE_CHANGED,
        payload_json: {
          userId,
          amount: amountVnd,
          sourceType: "refund",
          referenceType: sourceType,
          referenceId: caseId,
        },
      })
      return
    }
    await this.deposit(userId, amountVnd, sourceType, caseId, idempotencyKey)
  }

  async payForOrder(
    userId: string,
    amountVnd: number,
    orderId: string,
    idempotencyKey: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? prisma;
    return client.$transaction(async (innerTx) => {
      const wallet = await getWalletForUpdate(innerTx, userId);
      if (!wallet) throw new WalletNotFoundError(userId);
      if (wallet.balance < amountVnd) throw new InsufficientBalanceError(wallet.balance, amountVnd);

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore - amountVnd;

      await createTransaction(innerTx, {
        walletId: wallet.id,
        type: "service_payment",
        amount: -amountVnd,
        balanceBefore,
        balanceAfter,
        referenceType: "order",
        referenceId: orderId,
        idempotencyKey,
      });

      await updateWalletBalance(innerTx, wallet.id, balanceAfter);
    });
  }

  async getHistory(
    userId: string,
    limit = 20,
    offset = 0,
    opts?: { type?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' },
  ) {
    return getTransactionHistory(userId, limit, offset, opts)
  }
}

export const walletService = new WalletService()
