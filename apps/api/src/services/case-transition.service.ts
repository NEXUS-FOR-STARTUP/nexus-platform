import { Prisma, type PrismaClient } from '@prisma/client'
import { prisma } from '../db.js'
import { tryTransition } from '../modules/cases/domain/case-machine.js'
import {
  TARGET_STAGE,
  type TransitionName, type TransitionEvent, type CaseStage, type InternalStatus,
  type ActionDescriptor,
} from '../modules/cases/domain/transition.types.js'
import { isPaymentComplete } from '../modules/cases/domain/case.types.js'
import { upsertDocumentRecordsForUnit } from '../modules/documents/infrastructure/persistence/document.repository.js'
import { AppError } from '../shared/domain/app-error.js'
import { emitEvent } from '../shared/infrastructure/event-bus.js'
import { DOMAIN_EVENTS } from '../shared/domain/domain-events.js'
import logger from '../shared/infrastructure/logger.js'
import { walletService } from '../modules/wallet/application/wallet.service.js'
import { refundRemainingCreditInTx } from './credit-refund.js'

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
      const lockedPrice = context.data?.lockedPrice as number | undefined
      if ((lockedPrice ?? 0) === 0) break
      const unitCode = context.unitCode ?? `case-${caseId}`
      const key = `consume-${unitCode}-${caseId}`
      const balResult = await tx.creditLedger.aggregate({
        where: { case_id: caseId },
        _sum: { amount: true },
      })
      const currentBalance = balResult._sum.amount ?? 0
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
          reference_type: 'audit_round',
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
      const key = `refund-${caseId}`
      await walletService.refund(ownerId, lockedPrice, 'admin_veto', caseId, key, tx)
      break
    }

    case 'refundRemainingCredit': {
      await refundRemainingCreditInTx(
        tx,
        caseId,
        context.data?.caseOwnerId as string | undefined,
      )
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

    case 'resetSlaIfOverdue': {
      const row = await tx.case.findUniqueOrThrow({
        where: { id: caseId },
        select: { sla_deadline_at: true },
      })
      if (!row.sla_deadline_at) break
      if (row.sla_deadline_at.getTime() > Date.now()) break
      await tx.case.update({
        where: { id: caseId },
        data: { sla_deadline_at: new Date(Date.now() + 48 * 3600_000) },
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

interface TransitionResult {
  stage: CaseStage
  status: InternalStatus
  caseCode: string
  fromStage: CaseStage
  fromStatus: InternalStatus
}

export async function transitionInTx(
  tx: Prisma.TransactionClient,
  params: TransitionParams,
): Promise<TransitionResult> {
  const { transition: transitionName, caseId, actorId, roleVerified, data } = params

  const caseRecord = await tx.case.findUniqueOrThrow({
    where: { id: caseId },
  })
  const currentStatus = caseRecord.internal_status as InternalStatus

  const creditBalance = ['T11_SUBMIT_OUTPUT', 'T5_ACCEPT', 'T3_RESUBMIT_AFTER_REJECT'].includes(transitionName)
    ? await getCreditBalanceInTx(tx, caseId)
    : 0

  const creditGated = transitionName === 'T11_SUBMIT_OUTPUT' || transitionName === 'T3_RESUBMIT_AFTER_REJECT'
  if (creditGated && (caseRecord.locked_price ?? 0) !== 0 && creditBalance < 1) {
    throw new AppError(402, 'NO_CREDITS',
      'Hết credit. Vui lòng mua thêm credit để tiếp tục.')
  }

  if (transitionName === 'T5_ACCEPT' && !isPaymentComplete(caseRecord.payment_status)) {
    throw new AppError(402, 'PAYMENT_REQUIRED',
      'Hồ sơ chưa hoàn tất thanh toán')
  }
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
      paymentStatus: caseRecord.payment_status,
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
  const isAssignReassign =
    transitionName === 'T6_ASSIGN_SUPPORTER' && nextStatus === currentStatus
  const nextStage = isAssignReassign
    ? caseRecord.user_facing_stage as CaseStage
    : targetStageFor(transitionName)

  try {
    for (const action of actions) {
      await executeAction(action, tx, caseId, {
        unitCode: (data as any)?.unitCode,
        versionNo: (data as any)?.versionNo,
        actorId,
        nextStage,
        data: {
          ...(data as Record<string, unknown>),
          caseOwnerId: caseRecord.owner_auth_user_id,
          lockedPrice: caseRecord.locked_price ?? 0,
        },
      })
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'DUPLICATE_CREDIT_CONSUMPTION', 'Lượt đánh giá này đã được xử lý')
    }
    throw error
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
    fromStage: caseRecord.user_facing_stage as CaseStage,
    fromStatus: currentStatus,
  }
}

export async function executeTransition(
  params: TransitionParams,
  client?: Prisma.TransactionClient | PrismaClient,
): Promise<{ stage: CaseStage; status: InternalStatus }> {
  const { transition: transitionName, caseId, actorId } = params

  const result = client
    ? await transitionInTx(client as Prisma.TransactionClient, params)
    : await prisma.$transaction((tx) => transitionInTx(tx, params))

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
