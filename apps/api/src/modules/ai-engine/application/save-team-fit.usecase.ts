import { AppError } from '../../../shared/domain/app-error.js'
import logger from '../../../shared/infrastructure/logger.js'
import type { IdeaInput, TeamMemberInput, TeamFitFreeReport } from '@repo/validation'
import {
  findPackageById as defaultFindPackageById,
} from '../../packages/infrastructure/persistence/package.repository.js'

// ---------------------------------------------------------------------------
// Dependency interfaces for testability
// ---------------------------------------------------------------------------

export interface SaveTeamFitDeps {
  findPackageById: typeof defaultFindPackageById
  findTeamFitReportsByOwner: (ownerId: string) => Promise<Array<{
    id: string
    case_id: string
    idea_snapshot: unknown
    team_snapshot: unknown
    case: { id: string; case_code: string }
  }>>
  findCaseByCode: (code: string) => Promise<{ id: string } | null>
  createCaseAndReport: (data: {
    caseCode: string
    ownerId: string
    teamName: string
    packageId: string
    lockedPrice: number
    isFree: boolean
    idea: IdeaInput
    team: TeamMemberInput[]
    result: TeamFitFreeReport
  }) => Promise<{ id: string; case_code: string }>
}

export interface SaveTeamFitInput {
  idea: IdeaInput
  team: TeamMemberInput[]
  result: TeamFitFreeReport
  packageId?: string
  userId: string
}

export interface SaveTeamFitOutput {
  caseId: string
  caseCode: string
  isNew: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateCaseCode(): string {
  return 'NX-' + Math.random().toString().slice(2, 8)
}

async function generateUniqueCaseCode(
  findCaseByCode: (code: string) => Promise<{ id: string } | null>,
): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCaseCode()
    const existing = await findCaseByCode(code)
    if (!existing) return code
  }
  throw new AppError(500, 'CASE_CODE_COLLISION', 'Unable to generate unique case code')
}

// ---------------------------------------------------------------------------
// Use Case: Save Team-Fit Report
// ---------------------------------------------------------------------------

export async function saveTeamFitUseCase(
  input: SaveTeamFitInput,
  deps: SaveTeamFitDeps,
): Promise<SaveTeamFitOutput> {
  const { idea, team, result, packageId, userId } = input
  const { findPackageById, findTeamFitReportsByOwner, findCaseByCode, createCaseAndReport } = deps
  const t0 = Date.now()
  let caseId: string | undefined

  try {
    // Validate package — default to free tier
    const targetPackageId = packageId || 'pkg_tf_free'
    const pkg = await findPackageById(targetPackageId)
    if (!pkg || !pkg.is_active) {
      throw new AppError(400, 'PACKAGE_NOT_FOUND', 'Gói dịch vụ không tồn tại hoặc không khả dụng')
    }

    // Idempotency: check if same idea+team already saved for this user
    const ideaKey = JSON.stringify(idea)
    const teamKey = JSON.stringify(team)
    const existingReports = await findTeamFitReportsByOwner(userId)
    const duplicate = existingReports.find(
      (r) =>
        JSON.stringify(r.idea_snapshot) === ideaKey &&
        JSON.stringify(r.team_snapshot) === teamKey,
    )
    if (duplicate) {
      return { caseId: duplicate.case.id, caseCode: duplicate.case.case_code, isNew: false }
    }

    // Generate unique case code (retry on P2002)
    const caseCode = await generateUniqueCaseCode(findCaseByCode)

    const created = await createCaseAndReport({
      caseCode,
      ownerId: userId,
      teamName: idea.projectName,
      packageId: targetPackageId,
      lockedPrice: pkg.price,
      isFree: pkg.price === 0,
      idea,
      team,
      result,
    })
    caseId = created.id

    logger.info({ caseId, analysisId: caseId, duration_ms: Date.now() - t0 }, 'AI result saved')
    return { caseId: created.id, caseCode: created.case_code, isNew: true }
  } catch (error) {
    logger.error({ err: error, caseId }, 'AI result save failed')
    throw error
  }
}
