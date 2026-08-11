import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import {
  isFinalCaseStage,
  isValidCaseStage,
  isValidInternalStatus,
  isValidStageTransition,
} from "../domain/case.types.js";
import {
  findCaseById,
  createCaseEvent,
} from "../infrastructure/persistence/case.repository.js";
import logger from "../../../shared/infrastructure/logger.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { executeTransition } from "./case-transition.service.js";
import type { TransitionName } from "../domain/transition.types.js";

const XSTATE_TRANSITIONS: Record<string, TransitionName> = {
  'accepted_unassigned:assigned': 'T6_ASSIGN_SUPPORTER',
  'assigned:supporter_working': 'T7_START_WORK',
  'supporter_working:waiting_user': 'T8_REQUEST_INFO',
  'supporter_working:supporter_working': 'T10_START_REVIEW_REVISION',
  'report_ready_to_publish:done': 'T14_COMPLETE',
  'triage_pending:cancelled': 'T15_CANCEL',
  'accepted_unassigned:cancelled': 'T15_CANCEL',
  'assigned:cancelled': 'T15_CANCEL',
  'supporter_working:cancelled': 'T15_CANCEL',
  'waiting_user:cancelled': 'T15_CANCEL',
  'report_ready_to_publish:cancelled': 'T15_CANCEL',
}

function getXStateTransition(fromStatus: string, toStatus: string): TransitionName | null {
  return XSTATE_TRANSITIONS[`${fromStatus}:${toStatus}`] ?? null
}

export async function updateCaseStatusUseCase(
  userId: string,
  userRole: string,
  caseId: string,
  nextStage: unknown,
  nextStatus: unknown,
) {
  const caseObj = await findCaseById(caseId);

  if (!caseObj) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
  }

  const startTime = Date.now();
  const fromStatus = caseObj.internal_status;

  if (
    userRole === "supporter" &&
    caseObj.assigned_supporter_auth_user_id !== userId
  ) {
    throw new AppError(403, "FORBIDDEN", "Không được phân công quản lý dự án này");
  }

  // ── Route T6/T7/T8/T10 through XState gateway (F5: anti split-brain) ────
  if (typeof fromStatus === 'string' && typeof nextStatus === 'string') {
    const xt = getXStateTransition(fromStatus, nextStatus)
    if (xt) {
      return executeTransition({
        transition: xt,
        caseId,
        actorId: userId,
        roleVerified: userRole === 'admin' ? 'ADMIN' : userRole === 'supporter' ? 'SUPPORTER' : 'CUSTOMER',
      }).then(r => ({ stage: r.stage, status: r.status } as any))
    }
  }

  // ── user_facing_stage validation ──────────────────────────────────────────
  if (nextStage !== undefined && !isValidCaseStage(nextStage)) {
    throw new AppError(400, "VALIDATION_ERROR", "user_facing_stage không hợp lệ");
  }

  if (nextStage !== undefined && isFinalCaseStage(caseObj.user_facing_stage)) {
    throw new AppError(
      400,
      "INVALID_CASE_STAGE",
      "Dự án đã ở trạng thái cuối, không thể cập nhật trạng thái",
    );
  }

  if (
    nextStage !== undefined &&
    nextStage !== caseObj.user_facing_stage &&
    !isValidStageTransition(caseObj.user_facing_stage, nextStage)
  ) {
    throw new AppError(
      400,
      "INVALID_STAGE_TRANSITION",
      `Không thể chuyển trạng thái từ '${caseObj.user_facing_stage}' sang '${nextStage}'`,
    );
  }

  // ── internal_status validation ────────────────────────────────────────────
  if (nextStatus !== undefined && !isValidInternalStatus(nextStatus)) {
    throw new AppError(400, "VALIDATION_ERROR", "internal_status không hợp lệ");
  }

  if (nextStage === undefined && nextStatus === undefined) {
    throw new AppError(400, "VALIDATION_ERROR", "Thiếu trạng thái cần cập nhật");
  }

  if (
    nextStage === caseObj.user_facing_stage &&
    nextStatus === caseObj.internal_status
  ) {
    return caseObj;
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  try {
    const updateData: Record<string, unknown> = {};
    if (nextStage !== undefined) updateData.user_facing_stage = nextStage;
    if (nextStatus !== undefined) updateData.internal_status = nextStatus;

    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: updateData,
    });

    await createCaseEvent(caseId, userId, "status_updated", {
      user_facing_stage: nextStage,
      internal_status: nextStatus,
    });

    logger.info({ caseId, fromState: fromStatus, toState: nextStatus ?? nextStage, actorId: userId, actorRole: userRole, duration_ms: Date.now() - startTime }, 'case status updated');

    if (nextStage !== undefined && nextStage !== caseObj.user_facing_stage) {
      emitEvent({
        eventId: crypto.randomUUID(),
        type: DOMAIN_EVENTS.CASE_STAGE_CHANGED,
        actorId: userId,
        occurredAt: new Date(),
        payload: {
          caseId,
          caseCode: caseObj.case_code,
          fromStage: caseObj.user_facing_stage,
          toStage: updatedCase.user_facing_stage,
        },
      });
    }

    return updatedCase;
  } catch (error) {
    logger.error({ err: error, caseId, fromState: fromStatus, toState: nextStatus ?? nextStage, actorId: userId, actorRole: userRole, duration_ms: Date.now() - startTime }, 'case status update failed');
    throw error;
  }
}
