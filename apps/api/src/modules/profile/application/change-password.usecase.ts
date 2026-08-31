import { auth } from '../../../auth.js'
import { prisma as defaultPrisma } from '../../../db.js'
import { AppError } from '../../../shared/domain/app-error.js'
import { auditLogger } from '../../../shared/infrastructure/audit-logger.js'
import { revokeOtherSessionsUseCase } from './revoke-other-sessions.usecase.js'

export interface ChangePasswordInput {
  userId: string
  currentSessionId: string
  currentPassword: string
  newPassword: string
  headers: Headers
}

export async function changePasswordUseCase(
  input: ChangePasswordInput,
  db = defaultPrisma,
): Promise<{ ok: true }> {
  const { userId, currentSessionId, currentPassword, newPassword, headers } = input
  if (!newPassword || newPassword.length < 8) {
    throw new AppError(400, 'PASSWORD_TOO_SHORT', 'Mật khẩu mới phải có ít nhất 8 ký tự')
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      },
      headers,
    })
  } catch (error: unknown) {
    const errObj = error && typeof error === 'object' ? (error as Record<string, unknown>) : {}
    const bodyObj = errObj.body && typeof errObj.body === 'object' ? (errObj.body as Record<string, unknown>) : {}
    const message = typeof errObj.message === 'string' ? errObj.message : typeof bodyObj.message === 'string' ? bodyObj.message : ''
    if (
      message.includes('INVALID_PASSWORD') ||
      errObj.status === 400 ||
      errObj.statusCode === 400
    ) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Mật khẩu hiện tại không chính xác')
    }
    throw error
  }

  await revokeOtherSessionsUseCase(userId, currentSessionId)
  auditLogger.log({
    operation: 'PASSWORD_CHANGED',
    actor_id: userId,
    action: 'PASSWORD_CHANGED',
  })

  return { ok: true }
}
