import type { PrismaClient, Prisma } from '@prisma/client'
import { prisma } from '../../../db.js'
import { tryTransition } from '../domain/case-machine.js'
import type {
  TransitionName, TransitionEvent, CaseStage, InternalStatus,
  ActionDescriptor,
} from '../domain/transition.types.js'
import { upsertDocumentRecordsForUnit } from '../../documents/infrastructure/persistence/document.repository.js'
import { AppError } from '../../../shared/domain/app-error.js'
import { emitEvent } from '../../../shared/infrastructure/event-bus.js'
import { DOMAIN_EVENTS } from '../../../shared/domain/domain-events.js'
import logger from '../../../shared/infrastructure/logger.js'
import { walletService } from '../../wallet/application/wallet.service.js'

const TARGET_STAGE: Partial<Record<TransitionName, CaseStage>> = {
  T1_CREATE_CASE:              'intake_pending',
  T2_SUBMIT_INTAKE:            'submitted',
  T3_RESUBMIT_AFTER_REJECT:    'submitted',
  T4_RESUBMIT_AFTER_VETO:      'submitted',
  T5_ACCEPT:                   'under_review',
  T6_ASSIGN_SUPPORTER:         'under_review',
  T7_START_WORK:               'under_review',
  T8_REQUEST_INFO:             'need_more_information',
  T9_SUBMIT_REVISION:          'revision_submitted',
  T10_START_REVIEW_REVISION:   'under_review',
  T11_SUBMIT_OUTPUT:           'report_ready',
  T12_REJECT:                  'rejected',
  T13_VETO:                    'rejected',
  T14_COMPLETE:                'completed',
  T15_CANCEL:                  'closed',
  T16_EDIT_INTAKE:             'intake_pending',
}

function targetStageFor(transition: TransitionName): CaseStage {
  const stage = TARGET_STAGE[transition]
  if (!stage) {
    throw new AppError(500, 'UNKNOWN_TRANSITION', `No target stage for ${transition}`)
  }
  return stage
}

const ALLOWED_METADATA_FIELDS = ['reason', 'note', 'versionNo', 'fileCount']

function pickAllowedMetadata(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ALLOWED_METADATA_FIELDS) {
    if (key in data) out[key] = data[key]
  }
  return out
}

async function getCreditBalanceInTx(
  tx: Prisma.TransactionClient,
  caseId: string,
): Promise<number> {
  const result = await tx.creditLedger.aggregate({
    where: { case_id: caseId },
    _sum: { amount: true },
  })
  return result._sum.amount ?? 0
}

async function executeAction(
  action: ActionDescriptor,
  tx: Prisma.TransactionClient,
  caseId: string,
  context: {
    unitCode?: string
    uploaderId?: string
    versionNo?: number
    actorId?: string
    nextStage?: CaseStage
    data?: Record<string, unknown>
  },
): Promise<void> {
  switch (action.type) {
    case 'upsertDoc': {
      const docs = context.data?.files as Array<{
        file_url?: string
        original_name?: string
        doc_type?: string
        extension?: string
        mime_type?: string
        download_url?: string
        cloudinary_public_id?: string
      }> | undefined
      if (!docs || docs.length === 0) break
      const caseRecord = await tx.case.findUniqueOrThrow({
        where: { id: caseId },
        select: { current_checkpoint: true },
      })
      if (!caseRecord.current_checkpoint) {
        throw new AppError(400, 'NO_CHECKPOINT', 'Case has no active checkpoint')
      }
      const checkpoint = await tx.checkpoint.findFirstOrThrow({
        where: { case_id: caseId, checkpoint_code: caseRecord.current_checkpoint },
      })
      const versionUnit = await tx.lifecycleUnit.findFirstOrThrow({
        where: {
          case_id: caseId,
          checkpoint_id: checkpoint.id,
          unit_type: 'version',
          version_no: checkpoint.latest_version_no,
        },
      })
      await upsertDocumentRecordsForUnit(
        caseId,
        checkpoint.id,
        versionUnit.id,
        `v${checkpoint.latest_version_no}`,
        docs,
        context.actorId ?? context.uploaderId ?? '',
        'revision_document',
        'outbound',
        tx as any,
      )
      break
    }

    case 'subtractCredit': {
      const nonce = crypto.randomUUID()
      const unitCode = context.unitCode ?? `case-${caseId}`
      const key = `consume-${unitCode}-${caseId}-${nonce}`
      const latest = await tx.creditLedger.findFirst({
        where: { case_id: caseId },
        orderBy: { id: 'desc' },
        select: { balance_after: true },
      })
      const currentBalance = latest?.balance_after ?? 0
      if (currentBalance < 1) {
        throw new AppError(402, 'NO_CREDITS', 'Hết credit. Vui lòng mua thêm.')
      }
      const newBalance = currentBalance - 1
      await tx.creditLedger.create({
        data: {
          case_id: caseId,
          amount: -1,
          balance_after: newBalance,
          type: 'consumption',
          reference_id: unitCode,
          idempotency_key: key,
        },
      })
      break
    }

    case 'refundCredit': {
      const ownerId = context.data?.caseOwnerId as string
      const lockedPrice = context.data?.lockedPrice as number
      if (!ownerId || !lockedPrice || lockedPrice === 0) break
      const key = `refund-${caseId}-${crypto.randomUUID()}`
      await walletService.refund(ownerId, lockedPrice, 'admin_veto', caseId, key, tx)
      break
    }

    case 'setSlaDeadline': {
      const deadline = new Date(Date.now() + 48 * 3600_000)
      await tx.case.update({
        where: { id: caseId },
        data: { sla_deadline_at: deadline },
      })
      break
    }

    case 'autoResumeWork':
    case 'resetStatus':
    case 'notifyUser':
    case 'emitStageChanged':
    case 'lockPrice':
      break

    default:
      logger.warn({ actionType: (action as any).type, caseId },
        'Unknown action type — skipped')
  }
}

interface TransitionParams {
  transition: TransitionName
  caseId: string
  actorId: string
  roleVerified: string
  data?: Record<string, unknown>
}

export async function executeTransition(
  params: TransitionParams,
  client?: PrismaClient | Prisma.TransactionClient,
): Promise<{ stage: CaseStage; status: InternalStatus }> {
  const { transition: transitionName, caseId, actorId, roleVerified, data } = params
  const db = client ?? prisma

  const result = await db.$transaction(async (tx) => {
    const caseRecord = await tx.case.findUniqueOrThrow({
      where: { id: caseId },
    })
    const currentStatus = caseRecord.internal_status as InternalStatus

    const creditBalance = ['T11_SUBMIT_OUTPUT', 'T5_ACCEPT', 'T3_RESUBMIT_AFTER_REJECT'].includes(transitionName)
      ? await getCreditBalanceInTx(tx, caseId)
      : 0

    const event: TransitionEvent = {
      type: transitionName,
      actor: { id: actorId, role: roleVerified },
      data: {
        ...data,
        caseOwnerId: caseRecord.owner_auth_user_id,
        caseAssignedSupporterId: caseRecord.assigned_supporter_auth_user_id,
        currentStage: caseRecord.user_facing_stage,
        caseCreatedAt: caseRecord.created_at.toISOString(),
        lockedPrice: caseRecord.locked_price ?? 0,
        creditBalance,
        roleVerified,
        actorId,
      },
    }

    const transitionResult = tryTransition(currentStatus, event)
    if (!transitionResult) {
      throw new AppError(400, 'INVALID_TRANSITION',
        `Cannot execute ${transitionName} from status ${currentStatus}`)
    }

    const { to: nextStatus, actions } = transitionResult
    const nextStage = targetStageFor(transitionName)

    for (const action of actions) {
      await executeAction(action, tx, caseId, {
        unitCode: (data as any)?.unitCode,
        versionNo: (data as any)?.versionNo,
        actorId,
        nextStage,
        data: data as Record<string, unknown>,
      })
    }

    const updated = await tx.case.updateMany({
      where: { id: caseId, version_no: caseRecord.version_no },
      data: {
        user_facing_stage: nextStage,
        internal_status: nextStatus,
        version_no: { increment: 1 },
      },
    })
    if (updated.count === 0) {
      throw new AppError(409, 'TRANSITION_CONFLICT',
        'Case was modified by another request — retry')
    }

    await tx.caseEvent.create({
      data: {
        case_id: caseId,
        event_type: transitionName,
        actor_auth_user_id: actorId,
        actor_role: roleVerified,
        metadata_json: pickAllowedMetadata(data ?? {}) as any,
      },
    })

    return {
      stage: nextStage,
      status: nextStatus,
      caseCode: caseRecord.case_code,
      fromStage: caseRecord.user_facing_stage,
      fromStatus: currentStatus,
    }
  })

  try {
    emitEvent({
      eventId: crypto.randomUUID(),
      type: DOMAIN_EVENTS.CASE_STAGE_CHANGED,
      actorId,
      occurredAt: new Date(),
      payload: {
        caseId,
        caseCode: result.caseCode,
        fromStage: result.fromStage,
        toStage: result.stage,
        transition: transitionName,
      },
    })
  } catch (err) {
    logger.error({ err, caseId, transition: transitionName },
      'L5 emit event failed — non-blocking')
  }

  logger.info({
    caseId,
    transition: transitionName,
    from: result.fromStatus,
    to: result.status,
    stage: result.stage,
  }, 'Transition executed')

  return { stage: result.stage, status: result.status }
}
