import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import { ensureCheckpoint } from "../infrastructure/persistence/case.repository.js";

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

  const checkpoint = await ensureCheckpoint(prisma, caseId, code, OPENED_CHECKPOINT_STATUS);
  logger.info({ caseId, code, checkpointId: checkpoint.id, actorId: userId }, "checkpoint opened");
  return { checkpoint_id: checkpoint.id, checkpoint_code: checkpoint.checkpoint_code };
}
