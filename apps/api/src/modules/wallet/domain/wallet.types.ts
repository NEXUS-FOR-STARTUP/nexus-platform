export const WALLET_TX_TYPES = ['deposit', 'withdrawal', 'refund', 'adjustment', 'migration', 'service_payment'] as const
export type WalletTxType = (typeof WALLET_TX_TYPES)[number]

export const WALLET_SOURCE_TYPES = [
  'topup',
  'credit_purchase',
  'case_consume',
  'admin_refund',
  'platform_bonus',
  'migration',
  'service_payment',
] as const
export type WalletTxSourceType = (typeof WALLET_SOURCE_TYPES)[number]

export interface WalletTransactionDTO {
  id: string
  walletId: string
  type: WalletTxType
  amount: number
  balanceBefore: number
  balanceAfter: number
  sourceType: WalletTxSourceType
  sourceId: string | null
  idempotencyKey: string
  metadata: Record<string, unknown> | null
  createdAt: Date
}

export class InsufficientBalanceError extends Error {
  constructor(
    public readonly current: number,
    public readonly required: number,
  ) {
    super(`Số dư không đủ: ${current} VND, cần ${required} VND`)
    this.name = 'InsufficientBalanceError'
  }
}

export class WalletNotFoundError extends Error {
  constructor(public readonly userId: string) {
    super(`Wallet not found for user ${userId}`)
    this.name = 'WalletNotFoundError'
  }
}
