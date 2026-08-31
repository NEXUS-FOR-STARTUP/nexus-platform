import { AppError } from "../../../shared/domain/app-error.js";
import type { Prisma } from "@prisma/client";
import { Cp1IntakeCaps } from "@repo/validation";
import { findCaseByIdWithMembersAndCheckpoints, findLatestCaseEventByType } from "../infrastructure/persistence/case.repository.js";
import { upsertDocumentRecordsForUnit } from "../../documents/infrastructure/persistence/document.repository.js";
import { prisma } from "../../../db.js";
import logger from "../../../shared/infrastructure/logger.js";
import type { IntakeRequest } from "./cases.dto.js";
import { transitionInTx } from "../../../services/case-transition.service.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";

type DbClient = Prisma.TransactionClient | typeof prisma

export function buildSupersedeUpdateArgs(
  caseId: string,
  newRecordIds: string[],
  now: Date = new Date(),
) {
  return {
    where: {
      case_id: caseId,
      unit_code: "v00",
      doc_type: "intake_document",
      superseded_at: null,
      id: { notIn: newRecordIds },
    },
    data: { superseded_at: now },
  };
}

async function updateIntakeDataOnly(
  client: DbClient,
  caseId: string,
  caseRecord: any,
  body: IntakeRequest,
) {
  const capsResult = Cp1IntakeCaps.safeParse(body);
  if (!capsResult.success) {
    throw new AppError(
      400,
      "INVALID_INTAKE",
      "Dữ liệu intake không hợp lệ",
      capsResult.error.issues.map((issue) => issue.message),
    );
  }

  let checkpointId = "";

  if (caseRecord.current_checkpoint) {
    const cp = caseRecord.checkpoints?.find(
      (c: any) => c.checkpoint_code === caseRecord.current_checkpoint,
    );
    if (cp) checkpointId = cp.id;
  }

  if (!checkpointId) {
    const cp = await client.checkpoint.create({
      data: {
        case_id: caseId,
        checkpoint_code: "CP1",
        checkpoint_status: "submitted",
        latest_version_no: 1,
      },
    });
    checkpointId = cp.id;
    await client.case.update({
      where: { id: caseId },
      data: { current_checkpoint: "CP1" },
    });
  }

  // D13: upsert v00 — không tạo unit trùng khi nộp lại
  const existingUnit = await client.lifecycleUnit.findFirst({
    where: {
      case_id: caseId,
      checkpoint_id: checkpointId,
      unit_code: "v00",
      unit_type: "version",
    },
    orderBy: { created_at: "asc" },
  });

  const unitContent = JSON.stringify(body);
  const unitFileUrl = body.documents?.[0]?.file_url || body.documents?.[0]?.drive_url || null;

  const intakeUnit = existingUnit
    ? await client.lifecycleUnit.update({
      where: { id: existingUnit.id },
      data: { content: unitContent, file_url: unitFileUrl },
    })
    : await client.lifecycleUnit.create({
      data: {
        case_id: caseId,
        checkpoint_id: checkpointId,
        unit_code: "v00",
        unit_type: "version",
        version_no: 1,
        content: unitContent,
        file_url: unitFileUrl,
      },
    });

  // D13 + immutability: upsert theo ID deterministic (file cùng identity → replace, khác → thêm)
  const createdRecords = await upsertDocumentRecordsForUnit(
    caseId,
    checkpointId,
    intakeUnit.id,
    "v00",
    body.documents || [],
    caseRecord.owner_auth_user_id,
    "intake_document",
    "inbound",
    client as any,
    (doc) =>
      typeof doc.document_type === "string" && doc.document_type.trim()
        ? doc.document_type
        : undefined,
  );

  const newRecordIds = createdRecords.map((record) => record.id);
  await client.documentRecord.updateMany(
    buildSupersedeUpdateArgs(caseId, newRecordIds),
  );

  await client.case.update({
    where: { id: caseId },
    data: {
      payment_status: caseRecord.payment_status === 'paid' ? 'paid' : 'unpaid',
      school: body.school || undefined,
      course_context: body.course_context || undefined,
      group_no: body.team_context?.group_no || undefined,
      team_name: body.team_context?.project_name || undefined,
    },
  });

  await client.caseEvent.create({
    data: {
      case: { connect: { id: caseId } },
      actor: { connect: { id: caseRecord.owner_auth_user_id } },
      event_type: "intake_submitted",
      metadata_json: {},
    },
  });

  return intakeUnit;
}

async function isVetoedCase(caseId: string): Promise<boolean> {
  const event = await findLatestCaseEventByType(caseId, "T13_VETO");
  return event !== null;
}

export async function submitIntakeUseCase(userId: string, caseId: string, body: IntakeRequest) {
  const startTime = Date.now();
  const caseRecord = await findCaseByIdWithMembersAndCheckpoints(caseId);
  if (!caseRecord) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  }

  // D18: owner-only
  const isOwner = caseRecord.owner_auth_user_id === userId;
  if (!isOwner) {
    throw new AppError(403, "FORBIDDEN", "Không có quyền nộp intake cho dự án này");
  }

  const status = caseRecord.internal_status;

  if (status === "waiting_user") {
    throw new AppError(
      409,
      "REVISION_REQUIRED",
      "Bạn cần nộp bản bổ sung qua luồng yêu cầu thông tin, không phải chỉnh hồ sơ",
    );
  }

  if (!["triage_pending", "cancelled"].includes(status)) {
    throw new AppError(400, "INVALID_CASE_STAGE", "Hồ sơ đang được xử lý, không thể chỉnh sửa");
  }

  try {
    if (status === "cancelled") {
      // D3: 1 action atomic — content + transition cùng 1 tx
      const transition = (await isVetoedCase(caseId))
        ? "T4_RESUBMIT_AFTER_VETO"
        : "T3_RESUBMIT_AFTER_REJECT";

      const result = await prisma.$transaction(async (tx) => {
        await updateIntakeDataOnly(tx, caseId, caseRecord, body);
        return transitionInTx(tx, {
          transition,
          caseId,
          actorId: userId,
          roleVerified: "CUSTOMER",
          data: {},
        });
      });

      emitEvent({
        eventId: crypto.randomUUID(),
        type: DOMAIN_EVENTS.CASE_STAGE_CHANGED,
        actorId: userId,
        occurredAt: new Date(),
        payload: {
          caseId,
          caseCode: caseRecord.case_code,
          fromStage: caseRecord.user_facing_stage,
          toStage: result.stage,
          transition,
        },
      });

      logger.info({ caseId, transition, actorId: userId, duration_ms: Date.now() - startTime }, 'case resubmitted');
      return { success: true, case_id: caseId, stage: result.stage, status: result.status };
    }

    // triage_pending: content + transition cùng 1 tx (M1 — tránh partial write).
    // GA-02: submit luôn T2_SUBMIT_INTAKE → user_facing_stage "submitted" (không kẹt intake_ready).
    const transition = "T2_SUBMIT_INTAKE";

    const result = await prisma.$transaction(async (tx) => {
      await updateIntakeDataOnly(tx, caseId, caseRecord, body);
      return transitionInTx(tx, {
        transition,
        caseId,
        actorId: userId,
        roleVerified: "CUSTOMER",
        data: {},
      });
    });

    emitEvent({
      eventId: crypto.randomUUID(),
      type: DOMAIN_EVENTS.CASE_STAGE_CHANGED,
      actorId: userId,
      occurredAt: new Date(),
      payload: {
        caseId,
        caseCode: caseRecord.case_code,
        fromStage: caseRecord.user_facing_stage,
        toStage: result.stage,
        transition,
      },
    });

    logger.info({ caseId, transition, actorId: userId, duration_ms: Date.now() - startTime }, 'intake submitted');
    return { success: true, case_id: caseId, stage: result.stage, status: result.status };
  } catch (error) {
    logger.error({ err: error, caseId, duration_ms: Date.now() - startTime }, 'intake submission failed');
    throw error;
  }
}
