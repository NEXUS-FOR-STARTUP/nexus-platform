import { Hono } from 'hono'
import { TeamFitInputSchema } from '../domain/team-fit.dto.js'
import { evaluateTeamFitUseCase } from '../application/evaluate-team-fit.usecase.js'
import { checkTeamFitRateLimit } from '../application/team-fit-rate-limit.js'
import { handleError } from '../../../shared/infrastructure/http-helpers.js'
import { requireAuth } from '../../../shared/infrastructure/middlewares/auth.js'
import type { AuthEnv } from '../../../shared/infrastructure/middlewares/auth.js'
import type { Context as HonoContext } from 'hono'

export const aiEngineRouter = new Hono()

// ---------------------------------------------------------------------------
// POST /api/ai-engine/team-fit — Evaluate team composition against idea
// ---------------------------------------------------------------------------
aiEngineRouter.post('/team-fit', requireAuth, async (c: HonoContext<AuthEnv>) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    checkTeamFitRateLimit(user.id)
    const body = await c.req.json()
    const parsed = TeamFitInputSchema.safeParse(body)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      const path = firstIssue.path.join('.')
      const message = firstIssue.message
      return c.json(
        { error: 'INVALID_INPUT', message: `Thiếu thông tin: ${path} — ${message}` },
        400,
      )
    }

    const report = await evaluateTeamFitUseCase(parsed.data)
    return c.json(report)
  } catch (error: any) {
    return handleError(c, error)
  }
})
