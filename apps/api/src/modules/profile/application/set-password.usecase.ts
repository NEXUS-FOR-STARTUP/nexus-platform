import crypto from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import type { Prisma } from '@prisma/client'
import { prisma as defaultPrisma } from '../../../db.js'
import { AppError } from '../../../shared/domain/app-error.js'
import { auditLogger } from '../../../shared/infrastructure/audit-logger.js'

export interface SetPasswordResult {
  ok: true
}

export async function setPasswordUseCase(
  userId: string,
  password: string,
  db = defaultPrisma,
): Promise<SetPasswordResult> {
  if (!password || password.trim() === '' || password.length < 8) {
    throw new AppError(400, 'PASSWORD_TOO_SHORT', 'Mật khẩu phải có ít nhất 8 ký tự')
  }

  const existingCredential = await db.account.findFirst({
    where: {
      user_id: userId,
      provider_id: 'credential',
      password: { not: null },
    },
    select: { id: true },
  })

  if (existingCredential) {
    throw new AppError(409, 'PASSWORD_ALREADY_SET', 'Tài khoản đã có mật khẩu')
  }

  const passwordHash = await hashPassword(password)

  const executeUpsert = async (tx: Prisma.TransactionClient | typeof defaultPrisma) => {
    const existingAccount = await tx.account.findFirst({
      where: { user_id: userId, provider_id: 'credential' },
      select: { id: true },
    })

    if (existingAccount) {
      await tx.account.update({
        where: { id: existingAccount.id },
        data: { password: passwordHash },
      })
    } else {
      await tx.account.create({
        data: {
          id: crypto.randomUUID(),
          user_id: userId,
          account_id: userId,
          provider_id: 'credential',
          password: passwordHash,
        },
      })
    }
  }

  if ('$transaction' in db && typeof db.$transaction === 'function') {
    await (db as typeof defaultPrisma).$transaction(async (tx) => {
      await executeUpsert(tx)
    })
  } else {
    await executeUpsert(db)
  }

  auditLogger.log({
    operation: 'PASSWORD_SET',
    actor_id: userId,
    action: 'PASSWORD_SET',
  })

  return { ok: true }
}
