import { prisma } from '../../../../db.js'
import type { Prisma } from '@prisma/client'

export async function getOrCreateWallet(userId: string) {
  let wallet = await prisma.userWallet.findUnique({ where: { user_id: userId } })
  if (!wallet) {
    wallet = await prisma.userWallet.create({
      data: { user_id: userId, balance: 0 },
    })
  }
  return wallet
}

export async function getWalletBalance(userId: string): Promise<number> {
  const wallet = await prisma.userWallet.findUnique({
    where: { user_id: userId },
    select: { balance: true },
  })
  return wallet?.balance ?? 0
}

export async function getWalletForUpdate(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<{ id: string; balance: number } | null> {
  const rows = await tx.$queryRaw<Array<{ id: string; balance: number }>>`
    SELECT id, balance FROM user_wallets WHERE user_id = ${userId} FOR UPDATE
  `
  return rows[0] ?? null
}

export async function createTransaction(
  tx: Prisma.TransactionClient,
  params: {
    walletId: string
    type: string
    amount: number
    balanceBefore: number
    balanceAfter: number
    referenceType: string
    referenceId: string | null
    idempotencyKey: string
    metadataJson?: Record<string, unknown>
  },
) {
  return tx.walletTransaction.create({
    data: {
      wallet_id: params.walletId,
      type: params.type as any,
      amount: params.amount,
      balance_before: params.balanceBefore,
      balance_after: params.balanceAfter,
      reference_type: params.referenceType,
      reference_id: params.referenceId,
      source_type: params.referenceType,
      source_id: params.referenceId,
      idempotency_key: params.idempotencyKey,
      metadata_json: (params.metadataJson ?? undefined) as any,
    },
  })
}

export async function updateWalletBalance(
  tx: Prisma.TransactionClient,
  walletId: string,
  balance: number,
) {
  return tx.userWallet.update({
    where: { id: walletId },
    data: { balance },
  })
}

export async function getTransactionHistory(
  userId: string,
  limit = 20,
  offset = 0,
) {
  const wallet = await prisma.userWallet.findUnique({
    where: { user_id: userId },
    select: { id: true },
  })
  if (!wallet) return { transactions: [], total: 0 }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { wallet_id: wallet.id },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.walletTransaction.count({
      where: { wallet_id: wallet.id },
    }),
  ])
  return { transactions, total }
}
