import type { Context } from 'hono'
import { z } from 'zod'
import { handleError, readJsonBody } from '../../../shared/infrastructure/http-helpers.js'
import type { AuthEnv } from '../../../shared/infrastructure/middlewares/auth.js'
import { AppError } from '../../../shared/domain/app-error.js'
import { checkPasswordStatusRateLimit } from '../application/password-rate-limit.js'
import { getMyPasswordStatus, getPasswordStatus } from '../application/password-status.usecase.js'
import { setPasswordUseCase } from '../application/set-password.usecase.js'
import { changePasswordUseCase } from '../application/change-password.usecase.js'

const passwordStatusSchema = z.object({
  email: z.string().email(),
})

const setPasswordSchema = z.object({
  password: z.string().min(8),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export async function passwordStatusHandler(c: Context) {
  try {
    const rawIp =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      c.req.header('x-real-ip') ||
      '127.0.0.1'
    checkPasswordStatusRateLimit(rawIp)

    const body = await readJsonBody(c)
    const parsed = passwordStatusSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError(400, 'INVALID_INPUT', 'Email không hợp lệ')
    }

    const result = await getPasswordStatus(parsed.data.email)
    return c.json(result, 200)
  } catch (error) {
    return handleError(c, error)
  }
}

export async function myPasswordStatusHandler(c: Context<AuthEnv>) {
  try {
    const user = c.get('user')
    const result = await getMyPasswordStatus(user.id)
    return c.json(result, 200)
  } catch (error) {
    return handleError(c, error)
  }
}

export async function setPasswordHandler(c: Context<AuthEnv>) {
  try {
    const user = c.get('user')
    const body = await readJsonBody(c)
    const parsed = setPasswordSchema.safeParse(body || {})
    if (!parsed.success) {
      throw new AppError(
        400,
        'INVALID_INPUT',
        'Mật khẩu không hợp lệ, cần ít nhất 8 ký tự',
      )
    }

    const result = await setPasswordUseCase(user.id, parsed.data.password)
    return c.json({ ok: result.ok }, 200)
  } catch (error) {
    return handleError(c, error)
  }
}

export async function changePasswordHandler(c: Context<AuthEnv>) {
  try {
    const user = c.get('user')
    const session = c.get('session')
    const body = await readJsonBody(c)
    const parsed = changePasswordSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError(
        400,
        'INVALID_INPUT',
        'Mật khẩu mới phải có ít nhất 8 ký tự',
      )
    }

    const result = await changePasswordUseCase({
      userId: user.id,
      currentSessionId: session.id,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      headers: c.req.raw.headers,
    })
    return c.json(result, 200)
  } catch (error) {
    return handleError(c, error)
  }
}
