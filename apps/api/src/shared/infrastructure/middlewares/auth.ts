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
