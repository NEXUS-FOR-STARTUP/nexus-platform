import { Hono } from 'hono'
import { z } from 'zod'
import {
  LabelQuoteSchema,
  LabelRequestSchema,
  PreCp1InputSchema,
  TeamFitSavedResultSchema,
} from '@repo/validation'
import { handleError } from '../../../shared/infrastructure/http-helpers.js'
import { requireAuth } from '../../../shared/infrastructure/middlewares/auth.js'
import type { AuthEnv } from '../../../shared/infrastructure/middlewares/auth.js'
import type { Context as HonoContext } from 'hono'
import { labelPreCp1UseCase } from '../application/label-pre-cp1.usecase.js'
import { checkPreCp1LabelRateLimit } from '../application/pre-cp1-rate-limit.js'
import { extractClientIp } from '../../../shared/infrastructure/rate-limiter.js'
import { savePreCp1UseCase } from '../application/save-pre-cp1.usecase.js'
import { attachAi, createReport, findCaseOwnedBy, findReportByHash } from '../infrastructure/persistence/pre-cp1.repository.js'

export const preCp1Router = new Hono()

/** Kill switch: PRE_CP1_ENABLED=false takes both endpoints away without a deploy. */
preCp1Router.use('*', async (c, next) => {
  if (process.env.PRE_CP1_ENABLED === 'false') return c.notFound()
  await next()
})

const SaveBodySchema = z.object({
  caseId: z.string().min(1),
  input: PreCp1InputSchema,
  aiLabels: z.array(LabelQuoteSchema).max(20).optional(),
  // `report` from the client is not part of this schema, so it is dropped: the
  // server always rebuilds the report from the answers.
  aiResult: TeamFitSavedResultSchema.optional(),
})

function invalid(c: HonoContext<AuthEnv>, issues: z.core.$ZodIssue[]) {
  const first = issues[0]
  return c.json(
    {
      error: 'PRE_CP1_INVALID_INPUT',
      message: `Thiếu thông tin: ${first?.path.join('.') ?? ''} — ${first?.message ?? ''}`,
      issues,
    },
    400,
  )
}

// POST /api/pre-cp1/label — AI labels one answer set; never blocks the flow.
preCp1Router.post('/label', requireAuth, async (c: HonoContext<AuthEnv>) => {
  try {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    await checkPreCp1LabelRateLimit(user.id, extractClientIp(c.req.raw.headers))

    const parsed = LabelRequestSchema.safeParse(await c.req.json())
    if (!parsed.success) return invalid(c, parsed.error.issues)

    const result = await labelPreCp1UseCase(parsed.data)
    return c.json({ ok: true, ...result })
  } catch (error) {
    return handleError(c, error)
  }
})

// POST /api/pre-cp1/save — store the flow result in an existing project.
preCp1Router.post('/save', requireAuth, async (c: HonoContext<AuthEnv>) => {
  try {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const parsed = SaveBodySchema.safeParse(await c.req.json())
    if (!parsed.success) return invalid(c, parsed.error.issues)

    const result = await savePreCp1UseCase(
      {
        caseId: parsed.data.caseId,
        userId: user.id,
        input: parsed.data.input,
        aiLabels: parsed.data.aiLabels ?? null,
        aiResult: parsed.data.aiResult ?? null,
      },
      { findCaseOwnedBy, findReportByHash, createReport, attachAi },
    )

    return c.json(
      { ok: true, reportId: result.id, isNew: result.isNew, report: result.report },
      result.isNew ? 201 : 200,
    )
  } catch (error) {
    return handleError(c, error)
  }
})
