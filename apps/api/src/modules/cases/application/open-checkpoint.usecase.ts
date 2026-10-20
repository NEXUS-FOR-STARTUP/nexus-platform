import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import { ensureCheckpoint } from "../infrastructure/persistence/case.repository.js";
import { recordCaseEvent } from "../infrastructure/persistence/case-event.repository.js";

const OPENED_CHECKPOINT_STATUS = "draft";

/**
 * Open a checkpoint on demand (CP2 does not require CP1 to be finished).
 * Idempotent: repeated calls return the same row.
 *
 * `case.current_checkpoint` is intentionally left untouched: intake, revision,
 * version transitions and the document workspace all read it as the CP1 working
 * checkpoint, so moving it to CP2 would reroute CP1 flows. CP2 consumers address
 * the checkpoint by explicit code instead.
 */
export async function openCheckpointUseCase(
  userId: string,
  caseId: string,
  code: string,
) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: { id: true, owner_auth_user_id: true },
  });
  if (!caseRecord) {
    throw new AppError(404, "CASE_NOT_FOUND", "Không tìm thấy dự án");
  }
  if (caseRecord.owner_auth_user_id !== userId) {
    throw new AppError(403, "FORBIDDEN", "Chỉ chủ dự án mới được mở checkpoint");
  }

  const checkpoint = await prisma.$transaction(async (tx) => {
    const existing = await tx.checkpoint.findUnique({
      where: { case_id_checkpoint_code: { case_id: caseId, checkpoint_code: code } },
      select: { id: true },
    });
    const ensured = await ensureCheckpoint(tx, caseId, code, OPENED_CHECKPOINT_STATUS);
    // Only the first open is an activity; repeats are idempotent no-ops.
    if (!existing) {
      await recordCaseEvent(tx, { caseId, eventType: "stage_opened", actorUserId: userId, metadata: { checkpoint_code: code } });
    }
    return ensured;
  });
  logger.info({ caseId, code, checkpointId: checkpoint.id, actorId: userId }, "checkpoint opened");
  return { checkpoint_id: checkpoint.id, checkpoint_code: checkpoint.checkpoint_code };
}
