import { createMiddleware } from 'hono/factory'
import { auth } from '../../../auth.js'
import logger from '../../../shared/infrastructure/logger.js'

export type SessionUser = typeof auth.$Infer.Session.user
export type Session = typeof auth.$Infer.Session.session

export interface AuthEnv {
  Variables: {
    user: SessionUser
    session: Session
  }
}

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!session) {
      logger.warn({ reason: 'no_session' }, 'auth middleware: unauthorized')
      return c.json({ error: 'Unauthorized' }, 401)
    }

    c.set('user', session.user)
    c.set('session', session.session)
    await next()
  } catch (error) {
    logger.error({ err: error }, 'auth middleware failed')
    return c.json({ error: 'Unauthorized' }, 401)
  }
})

export const requireAdmin = createMiddleware<AuthEnv>(async (c, next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!session) {
      logger.warn({ reason: 'no_session' }, 'admin middleware: unauthorized')
      return c.json({ code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' }, 401)
    }

    if (session.user.role !== 'admin') {
      logger.warn({ userId: session.user.id, role: session.user.role }, 'admin middleware: forbidden')
      return c.json({ code: 'FORBIDDEN', message: 'Yêu cầu quyền quản trị' }, 403)
    }

    c.set('user', session.user)
    c.set('session', session.session)
    await next()
  } catch (error) {
    logger.error({ err: error }, 'admin middleware failed')
    return c.json({ code: 'UNAUTHORIZED', message: 'Xác thực thất bại' }, 401)
  }
})

export const requireAdminOrWriter = createMiddleware<AuthEnv>(async (c, next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })

    if (!session) {
      logger.warn({ reason: 'no_session' }, 'admin/writer middleware: unauthorized')
      return c.json({ code: 'UNAUTHORIZED', message: 'Chưa đăng nhập' }, 401)
    }

    if (session.user.role !== 'admin' && session.user.role !== 'writer') {
      logger.warn({ userId: session.user.id, role: session.user.role }, 'admin/writer middleware: forbidden')
      return c.json({ code: 'FORBIDDEN', message: 'Yêu cầu quyền quản trị hoặc người viết bài' }, 403)
    }

    c.set('user', session.user)
    c.set('session', session.session)
    await next()
  } catch (error) {
    logger.error({ err: error }, 'admin/writer middleware failed')
    return c.json({ code: 'UNAUTHORIZED', message: 'Xác thực thất bại' }, 401)
  }
})

const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost:(3000|3001)$/,
  /^https:\/\/(?:www\.)?nexusforstartup\.site$/,
]

export const verifyMutationOrigin = createMiddleware(async (c, next) => {
  const method = c.req.method.toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = c.req.header('origin')
    if (origin) {
      const isAllowed = ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))
      if (!isAllowed) {
        logger.warn({ origin, method, path: c.req.path }, 'mutation origin rejected')
        return c.json({ code: 'FORBIDDEN', message: 'Nguồn yêu cầu không hợp lệ (Origin mismatch)' }, 403)
      }
    }
  }
  await next()
})
