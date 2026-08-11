import { prisma } from '../../../db.js'
import { randomBytes } from 'node:crypto'

export const TOPUP_PREFIX = 'CR'

function generateTransferContent(): string {
  const code = randomBytes(4)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6)
  return `${TOPUP_PREFIX}${code}`
}

interface SePayBankInfo {
  bankName: string
  accountNumber: string
  accountName: string
}

export async function createTopupUseCase(
  userId: string,
  amount: number,
): Promise<{
  id: string
  amount: number
  transferContent: string
  bankInfo: SePayBankInfo
}> {
  const transferContent = generateTransferContent()

  const topup = await prisma.walletTopup.create({
    data: {
      user_id: userId,
      amount,
      transfer_content: transferContent,
      status: 'pending',
    },
  })

  const bankInfo: SePayBankInfo = {
    bankName: process.env.SEPAY_BANK_NAME ?? 'ACB',
    accountNumber: process.env.SEPAY_ACCOUNT_NUMBER ?? '',
    accountName: process.env.SEPAY_ACCOUNT_NAME ?? '',
  }

  return {
    id: topup.id,
    amount: topup.amount,
    transferContent: topup.transfer_content,
    bankInfo,
  }
}
