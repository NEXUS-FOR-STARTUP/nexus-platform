import { AppError } from '../../../shared/domain/app-error.js'

export const WALLET_TX_TYPES = ['deposit', 'withdrawal', 'refund', 'adjustment', 'migration', 'service_payment'] as const
export type WalletTxType = (typeof WALLET_TX_TYPES)[number]

export const WALLET_SOURCE_TYPES = [
  'topup',
  'credit_purchase',
  'case_consume',
  'admin_refund',
  'case_refund',
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

export class InsufficientBalanceError extends AppError {
  constructor(current: number, required: number) {
    super(
      400,
      'INSUFFICIENT_BALANCE',
      `Số dư không đủ: ${current.toLocaleString('vi-VN')} VND, cần ${required.toLocaleString('vi-VN')} VND`,
      { current, required },
    )
  }
}

export class WalletNotFoundError extends AppError {
  constructor(userId: string) {
    super(404, 'WALLET_NOT_FOUND', 'Không tìm thấy ví')
  }
}
