import { AppError } from "../../../shared/domain/app-error.js";
import { applyTransition, canTransition } from "../infrastructure/persistence/case-workflow-engine.js";
import { findCaseById } from "../infrastructure/persistence/case.repository.js";
import { prisma } from "../../../db.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function completeCaseUseCase(userId: string, role: string, caseId: string) {
  const startTime = Date.now();
  const caseRecord = await findCaseById(caseId);
  if (!caseRecord) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  }

  // Check user is the assigned supporter (admins can also complete)
  if (role === "supporter" && caseRecord.assigned_supporter_auth_user_id !== userId) {
    throw new AppError(403, "FORBIDDEN", "Bạn không phải là supporter được phân công cho dự án này");
  }

  // Check symflow transition is valid
  if (!canTransition(caseRecord, 'complete_case')) {
    throw new AppError(400, "INVALID_STAGE", "Dự án không ở trạng thái có thể hoàn thành");
  }

  try {
    return await prisma.$transaction(async (tx: any) => {
      // Apply symflow complete transition
      applyTransition(caseRecord, 'complete_case');

      // Update case to completed
      await tx.case.update({
        where: { id: caseId },
        data: {
          internal_status: caseRecord.internal_status, // "done" from symflow
          user_facing_stage: 'completed',
        },
      });

      // Create case event
      await tx.caseEvent.create({
        data: {
          case: { connect: { id: caseId } },
          actor: { connect: { id: userId } },
          event_type: "case_completed",
          metadata_json: {},
        },
      });

      logger.info({ caseId, transition: 'complete_case', fromState: caseRecord.internal_status, toState: 'done', actorId: userId, actorRole: role, duration_ms: Date.now() - startTime }, 'case transition: complete_case');

      return { success: true, case_id: caseId };
    });
  } catch (error) {
    logger.error({ err: error, caseId, transition: 'complete_case', actorId: userId, actorRole: role, duration_ms: Date.now() - startTime }, 'case transition failed: complete_case');
    throw error;
  }
}
