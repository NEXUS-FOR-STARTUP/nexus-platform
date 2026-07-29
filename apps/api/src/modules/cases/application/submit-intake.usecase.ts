import { AppError } from "../../../shared/domain/app-error.js";
import { requireCredits } from "../domain/case.types.js";
import { findCaseByIdWithMembersAndCheckpoints } from "../infrastructure/persistence/case.repository.js";
import { createDocumentRecordsForUnit } from "../../documents/infrastructure/persistence/document.repository.js";
import { prisma } from "../../../db.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { IntakeRequest } from "./cases.dto.js";

export async function submitIntakeUseCase(userId: string, caseId: string, body: IntakeRequest) {
  const startTime = Date.now();
  const caseRecord = await findCaseByIdWithMembersAndCheckpoints(caseId);
  if (!caseRecord) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  }

  const isOwner = caseRecord.owner_auth_user_id === userId;
  const isMember = caseRecord.members?.some((m: any) => m.auth_user_id === userId);
  if (!isOwner && !isMember) {
    throw new AppError(403, "FORBIDDEN", "Không có quyền nộp intake cho dự án này");
  }

  await requireCredits(caseId);

  try {
    return await prisma.$transaction(async (tx: any) => {
      let checkpointId: string = "";

      // Find/create CP1 checkpoint
      if (caseRecord.current_checkpoint) {
        const cp = caseRecord.checkpoints?.find((c: any) => c.checkpoint_code === caseRecord.current_checkpoint);
        if (cp) checkpointId = cp.id;
      }

      if (!checkpointId) {
        const cp = await tx.checkpoint.create({
          data: {
            case_id: caseId,
            checkpoint_code: "CP1",
            checkpoint_status: "submitted",
            latest_version_no: 1,
          },
        });
        checkpointId = cp.id;
        await tx.case.update({
          where: { id: caseId },
          data: { current_checkpoint: "CP1" },
        });
      }

      // Create intake lifecycle unit
      const intakeUnit = await tx.lifecycleUnit.create({
        data: {
          case_id: caseId,
          checkpoint_id: checkpointId,
          unit_code: "v00",
          unit_type: "version",
          version_no: 1,
          content: JSON.stringify(body),
          file_url: body.documents?.[0]?.file_url || body.documents?.[0]?.drive_url || null,
        },
      });

      // Create document records
      await createDocumentRecordsForUnit(
        caseId,
        checkpointId,
        intakeUnit.id,
        "intake",
        body.documents || [],
        userId,
        "intake_document",
        "inbound",
        tx,
      );

      // Update case record with intake data
      await tx.case.update({
        where: { id: caseId },
        data: {
          payment_status: caseRecord.payment_status === 'paid' ? 'paid' : 'unpaid',
          school: body.school || undefined,
          course_context: body.course_context || undefined,
          group_no: body.team_context?.group_no || undefined,
          team_name: body.team_context?.project_name || undefined,
        },
      });

      // Transition user_facing_stage to submitted for first-time intake
      // or re-submit after rejection. internal_status stays as-is (should already
      // be triage_pending from creation/rejection path).
      const isPreSubmitStage = ["intake_ready", "intake_pending", "rejected"].includes(
        caseRecord.user_facing_stage,
      );
      if (isPreSubmitStage) {
        await tx.case.update({
          where: { id: caseId },
          data: { user_facing_stage: "submitted" },
        });

        const eventType =
          caseRecord.user_facing_stage === "rejected" ? "case_resubmitted" : "case_submitted";
        await tx.caseEvent.create({
          data: {
            case: { connect: { id: caseId } },
            actor: { connect: { id: userId } },
            event_type: eventType,
          },
        });

        logger.info({ caseId, transition: 'submit', fromStage: caseRecord.user_facing_stage, toStage: 'submitted', actorId: userId, eventType }, 'case intake submitted');
      }

      await tx.caseEvent.create({
        data: {
          case: { connect: { id: caseId } },
          actor: { connect: { id: userId } },
          event_type: "intake_submitted",
          metadata_json: {},
        },
      });

      logger.info({ caseId, actorId: userId, duration_ms: Date.now() - startTime }, 'intake submitted');

      return { success: true, case_id: caseId, intake_unit_id: intakeUnit.id };
    });
  } catch (error) {
    logger.error({ err: error, caseId, duration_ms: Date.now() - startTime }, 'intake submission failed');
    throw error;
  }
}
