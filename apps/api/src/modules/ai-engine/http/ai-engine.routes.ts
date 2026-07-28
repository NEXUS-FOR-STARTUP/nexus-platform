import { Hono } from 'hono'
import { z } from 'zod'
import { TeamFitInputSchema } from '../domain/team-fit.dto.js'
import { evaluateTeamFitUseCase } from '../application/evaluate-team-fit.usecase.js'
import { saveTeamFitUseCase } from '../application/save-team-fit.usecase.js'
import { handleError } from '../../../shared/infrastructure/http-helpers.js'
import { requireAuth } from '../../../shared/infrastructure/middlewares/auth.js'
import { prisma } from '../../../db.js'
import { findPackageById } from '../../packages/infrastructure/persistence/package.repository.js'
import type { AuthEnv } from '../../../shared/infrastructure/middlewares/auth.js'
import type { Context as HonoContext } from 'hono'
import {
  IdeaInputSchema,
  TeamMemberInputSchema,
  TeamFitFreeReportSchema,
} from '@repo/validation'

export const aiEngineRouter = new Hono()

// ---------------------------------------------------------------------------
// Request body schema for team-fit save
// ---------------------------------------------------------------------------
const TeamFitSaveBodySchema = z.object({
  idea: IdeaInputSchema,
  team: z.array(TeamMemberInputSchema).min(1).max(6),
  result: TeamFitFreeReportSchema,
  packageId: z.string().optional(),
})

// ---------------------------------------------------------------------------
// POST /api/ai-engine/team-fit — Evaluate team composition against idea
// ---------------------------------------------------------------------------
aiEngineRouter.post('/team-fit', requireAuth, async (c: HonoContext) => {
  try {
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

// ---------------------------------------------------------------------------
// POST /api/ai-engine/team-fit/save — Save team-fit report as a case
// ---------------------------------------------------------------------------
aiEngineRouter.post('/team-fit/save', requireAuth, async (c: HonoContext<AuthEnv>) => {
  try {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const parsed = TeamFitSaveBodySchema.safeParse(body)
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return c.json(
        {
          error: 'INVALID_INPUT',
          message: `Thiếu thông tin: ${firstIssue.path.join('.')} — ${firstIssue.message}`,
        },
        400,
      )
    }

    const { idea, team, result, packageId } = parsed.data

    const output = await saveTeamFitUseCase(
      { idea, team, result, packageId, userId: user.id },
      {
        findPackageById,
        findTeamFitReportsByOwner: async (ownerId) =>
          prisma.teamFitReport.findMany({
            where: { case: { owner_auth_user_id: ownerId } },
            include: { case: true },
          }),
        findCaseByCode: async (code) => prisma.case.findUnique({ where: { case_code: code } }),
        createCaseAndReport: async (data) =>
          prisma.$transaction(async (tx) => {
            const created = await tx.case.create({
              data: {
                case_code: data.caseCode,
                owner_auth_user_id: data.ownerId,
                team_name: data.teamName,
                school: null,
                course_context: null,
                package_id: data.packageId,
                locked_price: data.lockedPrice,
                user_facing_stage: 'intake_pending',
                internal_status: 'draft',
                payment_status: data.isFree ? 'not_required' : 'unpaid',
                current_checkpoint: null,
              },
            })

            await tx.teamFitReport.create({
              data: {
                case_id: created.id,
                idea_snapshot: data.idea,
                team_snapshot: data.team,
                result_snapshot: data.result,
              },
            })

            return created
          }),
      },
    )

    return c.json(
      { caseId: output.caseId, caseCode: output.caseCode },
      output.isNew ? 201 : 200,
    )
  } catch (error: any) {
    return handleError(c, error)
  }
})
