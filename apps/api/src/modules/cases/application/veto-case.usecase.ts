import { AppError } from "../../../shared/domain/app-error.js";
import { applyTransition, canTransition } from "../infrastructure/persistence/case-workflow-engine.js";
import { findCaseById } from "../infrastructure/persistence/case.repository.js";
import { getCreditBalanceForTx } from "../infrastructure/persistence/credit-ledger.repository.js";
import { prisma } from "../../../db.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function vetoCaseUseCase(adminId: string, caseId: string, reason: string) {
  const startTime = Date.now();
  const caseRecord = await findCaseById(caseId);
  if (!caseRecord) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  }

  // Check case is in a state that allows veto (submitted or under_review)
  if (!canTransition(caseRecord, 'veto')) {
    throw new AppError(400, "INVALID_STAGE", "Dự án không ở trạng thái có thể từ chối");
  }

  // Verify 48h window hasn't expired since case creation
  const createdAt = new Date(caseRecord.created_at).getTime();
  const now = Date.now();
  const fortyEightHours = 48 * 60 * 60 * 1000;
  if (now - createdAt > fortyEightHours) {
    throw new AppError(400, "VETO_WINDOW_EXPIRED", "Đã quá 48 giờ kể từ khi tạo dự án, không thể từ chối");
  }

  try {
    return await prisma.$transaction(async (tx: any) => {
      // Get current credit balance
      const currentBalance = await getCreditBalanceForTx(tx, caseId);

      // Apply symflow veto transition
      applyTransition(caseRecord, 'veto');

      // Insert refund ledger entry if credits exist
      if (currentBalance > 0) {
        await tx.creditLedger.create({
          data: {
            case_id: caseId,
            amount: -currentBalance,
            balance_after: 0,
            type: 'refund',
            idempotency_key: `veto_${caseId}_${Date.now()}`,
            metadata_json: { action: "admin_veto", admin_id: adminId, reason },
          },
        });
      }

      // Update case to rejected
      await tx.case.update({
        where: { id: caseId },
        data: {
          internal_status: 'rejected',
          user_facing_stage: 'rejected',
        },
      });

      // Create case event
      await tx.caseEvent.create({
        data: {
          case: { connect: { id: caseId } },
          event_type: "vetoed",
          actor_auth_user_id: adminId,
          metadata_json: { reason },
        },
      });

      logger.info({ caseId, transition: 'veto', fromState: caseRecord.internal_status, toState: 'rejected', actorId: adminId, actorRole: 'admin', duration_ms: Date.now() - startTime }, 'case transition: veto');

      return { success: true, case_id: caseId };
    });
  } catch (error) {
    logger.error({ err: error, caseId, transition: 'veto', actorId: adminId, actorRole: 'admin', duration_ms: Date.now() - startTime }, 'case transition failed: veto');
    throw error;
  }
}
