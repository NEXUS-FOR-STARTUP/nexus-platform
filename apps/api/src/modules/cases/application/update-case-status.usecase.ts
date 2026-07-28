import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import {
  isFinalCaseStage,
  isValidCaseStage,
  isValidInternalStatus,
  isValidStageTransition,
} from "../domain/case.types.js";
import { statusToPlace } from "../domain/case-workflow.js";
import {
  findCaseById,
  createCaseEvent,
} from "../infrastructure/persistence/case.repository.js";
import {
  applyTransition,
  canTransition,
} from "../infrastructure/persistence/case-workflow-engine.js";
import logger from "../../../shared/infrastructure/logger.js";

/** Maps internal_status targets to symflow transition names */
const SYMFLOW_TRANSITION_MAP: Record<string, string> = {
  supporter_working: "assign_supporter",
  completed: "complete",
  rejected: "reject",
};

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

  // ── Symflow transition validation + SLA trigger ───────────────────────────
  // Use symflow when current internal_status maps to a known place AND the
  // target has a mapped transition. Falls back to direct update otherwise.
  const isInSymflowState =
    typeof caseObj.internal_status === "string" &&
    caseObj.internal_status in statusToPlace;

  let transitionName: string | undefined;
  if (
    isInSymflowState &&
    typeof nextStatus === "string" &&
    nextStatus in SYMFLOW_TRANSITION_MAP
  ) {
    transitionName = SYMFLOW_TRANSITION_MAP[nextStatus];
    if (!canTransition(caseObj, transitionName)) {
      throw new AppError(
        409,
        "INVALID_TRANSITION",
        `Không thể chuyển từ '${caseObj.internal_status}' sang '${nextStatus}'`,
      );
    }
    // applyTransition mutates caseObj: sets internal_status + sla_deadline_at (middleware)
    applyTransition(caseObj, transitionName);
  }

  // SLA fallback: when entering supporter_working outside symflow states
  if (
    !isInSymflowState &&
    nextStatus === "supporter_working" &&
    !caseObj.sla_deadline_at
  ) {
    caseObj.sla_deadline_at = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }

  // ── Persist ───────────────────────────────────────────────────────────────
  try {
    const updateData: Record<string, unknown> = {};
    if (nextStage !== undefined) updateData.user_facing_stage = nextStage;
    if (nextStatus !== undefined) updateData.internal_status = nextStatus;
    if (caseObj.sla_deadline_at) {
      updateData.sla_deadline_at = caseObj.sla_deadline_at;
    }

    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: updateData,
    });

    await createCaseEvent(caseId, userId, "status_updated", {
      user_facing_stage: nextStage,
      internal_status: nextStatus,
    });

    if (transitionName && nextStatus) {
      logger.info({ caseId, transition: transitionName, fromState: fromStatus, toState: nextStatus, actorId: userId, actorRole: userRole, duration_ms: Date.now() - startTime }, `case transition: ${transitionName}`);
    } else {
      logger.info({ caseId, fromState: fromStatus, toState: nextStatus ?? nextStage, actorId: userId, actorRole: userRole, duration_ms: Date.now() - startTime }, 'case status updated');
    }

    return updatedCase;
  } catch (error) {
    logger.error({ err: error, caseId, transition: transitionName ?? 'status_update', fromState: fromStatus, toState: nextStatus ?? nextStage, actorId: userId, actorRole: userRole, duration_ms: Date.now() - startTime }, 'case transition failed: status_update');
    throw error;
  }
}
