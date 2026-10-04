import { prisma as defaultPrisma } from '../../../db.js'

export interface PasswordStatusResult {
  exists: boolean
  hasPassword: boolean
}

export async function getPasswordStatus(
  email: string,
  db = defaultPrisma,
): Promise<PasswordStatusResult> {
  const normalizedEmail = email.trim().toLowerCase()

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      accounts: {
        where: {
          provider_id: 'credential',
          password: { not: null },
        },
        select: { id: true },
      },
    },
  })

  return {
    exists: Boolean(user),
    hasPassword: Boolean(user && user.accounts.length > 0),
  }
}

export async function getMyPasswordStatus(
  userId: string,
  db = defaultPrisma,
): Promise<{ hasPassword: boolean }> {
  const account = await db.account.findFirst({
    where: {
      user_id: userId,
      provider_id: 'credential',
      password: { not: null },
    },
    select: { id: true },
  })
  return { hasPassword: Boolean(account) }
}
