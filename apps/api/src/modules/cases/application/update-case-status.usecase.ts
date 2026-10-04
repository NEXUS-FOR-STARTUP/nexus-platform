import { AppError } from "../../../shared/domain/app-error.js";
import {
  findCaseById,
} from "../infrastructure/persistence/case.repository.js";
import logger from "../../../shared/infrastructure/logger.js";
import { executeTransition } from "../../../services/case-transition.service.js";
import type { TransitionName } from "../domain/transition.types.js";

const XSTATE_TRANSITIONS: Record<string, TransitionName> = {
  'accepted_unassigned:assigned': 'T6_ASSIGN_SUPPORTER',
  'assigned:assigned': 'T6_ASSIGN_SUPPORTER',
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

  // F11: 1 nguồn truth — cặp stage/status không có trong machine → chặn, không fallback ghi trực tiếp
  logger.warn({ caseId, fromState: fromStatus, toStatus: nextStatus, toStage: nextStage, actorId: userId, actorRole: userRole, duration_ms: Date.now() - startTime }, 'case status update rejected — invalid transition');
  throw new AppError(
    400,
    "INVALID_TRANSITION",
    `Không thể chuyển trạng thái từ '${fromStatus}' sang '${String(nextStatus)}'`,
  );
}
