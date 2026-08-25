import { prisma } from '../../../../db.js'
import type { Prisma } from '@prisma/client'

// NOTE: race window khi 2 request đồng thời đều thấy thiếu ví → 1 request
// dính P2002 (user_id unique) làm tx rollback, client retry sẽ qua. Được giảm
// thiểu bởi databaseHooks.user.create.after tạo sẵn ví khi signup — không cần
// retry wrapper.
export async function getOrCreateWalletInTx(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<{ id: string; balance: number }> {
  const wallet = await getWalletForUpdate(tx, userId)
  if (wallet) return wallet
  return tx.userWallet.create({
    data: { user_id: userId, balance: 0 },
    select: { id: true, balance: true },
  })
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
  opts: { type?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {},
) {
  const wallet = await prisma.userWallet.findUnique({
    where: { user_id: userId },
    select: { id: true },
  })
  if (!wallet) return { transactions: [], total: 0 }

  const where: Prisma.WalletTransactionWhereInput = { wallet_id: wallet.id }
  if (opts.type) {
    where.type = opts.type as any
  }

  const orderField = opts.sortBy === 'amount' ? 'amount' : 'created_at'
  const orderDir = opts.sortOrder === 'asc' ? 'asc' : 'desc'
  const orderBy = { [orderField]: orderDir }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.walletTransaction.count({ where }),
  ])
  return { transactions, total }
}
