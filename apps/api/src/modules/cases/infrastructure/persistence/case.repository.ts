import { prisma } from "../../../../db.js";
import { createDocumentRecordsForUnit } from "../../../documents/infrastructure/persistence/document.repository.js";
import { AppError } from "../../../../shared/domain/app-error.js";


export async function findManyCasesByRole(userId: string, role: string) {
  if (role === "admin") {
    return await prisma.case.findMany({
      include: {
        owner: true,
        assigned_supporter: true,
        package: true,
      },
      orderBy: { created_at: "desc" },
    });
  } else if (role === "supporter") {
    return await prisma.case.findMany({
      where: {
        assigned_supporter_auth_user_id: userId,
      },
      include: {
        owner: true,
        package: true,
      },
      orderBy: { created_at: "desc" },
    });
  } else {
    return await prisma.case.findMany({
      where: {
        OR: [
          { owner_auth_user_id: userId },
          { members: { some: { auth_user_id: userId } } },
        ],
      },
      include: {
        assigned_supporter: true,
        package: true,
      },
      orderBy: { created_at: "desc" },
    });
  }
}

export async function findManyCasesAdmin(where: any, take?: number) {
  return await prisma.case.findMany({
    where,
    include: {
      owner: true,
      assigned_supporter: true,
      package: true,
      lifecycle_units: {
        where: { unit_type: "version" },
        take: 1,
      },
    },
    orderBy: { created_at: "desc" },
    take,
  });
}

export async function findCaseById(id: string) {
  return await prisma.case.findUnique({
    where: { id },
  });
}

export async function findCaseByIdWithAllRelations(id: string) {
  return await prisma.case.findUnique({
    where: { id },
    include: {
      owner: true,
      assigned_supporter: true,
      package: true,
      checkpoints: {
        include: {
          lifecycle_units: true,
        },
      },
      members: {
        include: {
          user: true,
        },
      },
      events: {
        include: {
          actor: true,
        },
        orderBy: { created_at: "desc" },
      },
      payments: {
        orderBy: { created_at: "desc" },
      },
      reports: {
        orderBy: { created_at: "desc" },
      },
      team_fit_report: true,
    },
  });
}

export async function findCaseByIdWithLifecycleUnitsAndEvents(id: string) {
  return await prisma.case.findUnique({
    where: { id },
    include: {
      owner: true,
      assigned_supporter: true,
      package: true,
      lifecycle_units: true,
      events: {
        include: { actor: true },
        orderBy: { created_at: "desc" },
      },
    },
  });
}

export async function findCaseByIdWithMembers(id: string) {
  return await prisma.case.findUnique({
    where: { id },
    include: { members: true },
  });
}

export async function findCaseByIdWithMembersAndCheckpoints(id: string) {
  return await prisma.case.findUnique({
    where: { id },
    include: {
      members: true,
      checkpoints: true,
    },
  });
}

export async function findCaseByCode(case_code: string) {
  return await prisma.case.findUnique({
    where: { case_code },
  });
}

export async function createCaseWithCheckpointAndIntake(data: {
  caseCode: string;
  userId: string;
  teamName: string | null;
  school: string | null;
  courseContext: string | null;
  groupNo: string | null;
  packageId: string;
  lockedPrice: number;
  deadline: Date | null;
  isFree: boolean;
  rawBody: any;
}) {
  const {
    caseCode,
    userId,
    teamName,
    school,
    courseContext,
    groupNo,
    packageId,
    lockedPrice,
    deadline,
    isFree,
    rawBody,
  } = data;

  return await prisma.$transaction(async (tx: any) => {
    const newCase = await tx.case.create({
      data: {
        case_code: caseCode,
        owner_auth_user_id: userId,
        team_name: teamName,
        school,
        course_context: courseContext,
        group_no: groupNo,
        package_id: packageId,
        locked_price: lockedPrice,
        deadline,
        user_facing_stage: isFree ? "submitted" : "intake_pending",
        internal_status: "triage_pending",
        payment_status: isFree ? "paid" : "unpaid",
        current_checkpoint: "CP1",
      },
    });

    const checkpoint = await tx.checkpoint.create({
      data: {
        case_id: newCase.id,
        checkpoint_code: "CP1",
        checkpoint_status: "submitted",
        latest_version_no: 1,
      },
    });

    const intakeUnit = await tx.lifecycleUnit.create({
      data: {
        case_id: newCase.id,
        checkpoint_id: checkpoint.id,
        unit_code: "v00",
        unit_type: "version",
        version_no: 1,
        content: JSON.stringify(rawBody),
        file_url: rawBody.documents?.[0]?.drive_url || rawBody.documents?.[0]?.file_url || null,
      },
    });

    const intakeDocs = Array.isArray(rawBody.documents) ? rawBody.documents : [];
    await createDocumentRecordsForUnit(
      newCase.id,
      checkpoint.id,
      intakeUnit.id,
      intakeUnit.unit_code,
      intakeDocs,
      userId,
      "intake_document",
      "inbound",
      tx,
    );

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: newCase.id } },
        actor: { connect: { id: userId } },
        event_type: "case_submitted",
        metadata_json: { case_code: caseCode },
      },
    });

    return newCase;
  });
}

export async function acceptCase(caseId: string, adminId: string, nextStatus: string, nextStage?: string) {
  return await prisma.$transaction(async (tx: any) => {
    const updated = await tx.case.update({
      where: { id: caseId },
      data: {
        user_facing_stage: nextStage || "under_review",
        internal_status: nextStatus,
      },
    });

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        actor: { connect: { id: adminId } },
        event_type: "case_accepted",
      },
    });

    return updated;
  });
}

export async function deleteCase(caseId: string) {
  return await prisma.case.delete({
    where: { id: caseId },
  });
}

export async function rejectCase(caseId: string, adminId: string, reason: string, nextStatus?: string, nextStage?: string) {
  return await prisma.$transaction(async (tx: any) => {
    const updated = await tx.case.update({
      where: { id: caseId },
      data: {
        user_facing_stage: nextStage || "rejected",
        internal_status: nextStatus || "cancelled",
      },
    });

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        event_type: "case_rejected",
        actor: { connect: { id: adminId } },
        metadata_json: { reason },
      },
    });

    return updated;
  });
}

export async function resubmitCase(caseId: string, userId: string) {
  return await prisma.$transaction(async (tx: any) => {
    const updated = await tx.case.update({
      where: { id: caseId },
      data: {
        user_facing_stage: "submitted",
        internal_status: "triage_pending",
      },
    });

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        event_type: "case_resubmitted",
        actor: { connect: { id: userId } },
      },
    });

    return updated;
  });
}

export async function requestCaseMoreInfo(caseId: string, actorId: string, eventType: string, query: string, nextStage: string, nextStatus: string) {
  return await prisma.$transaction(async (tx: any) => {
    const updated = await tx.case.update({
      where: { id: caseId },
      data: {
        user_facing_stage: nextStage,
        internal_status: nextStatus,
      },
    });

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        event_type: eventType,
        actor: { connect: { id: actorId } },
        metadata_json: { query },
      },
    });

    return updated;
  });
}

export async function assignCaseSupporter(caseId: string, adminId: string, supporterId: string | null, nextStatus: string, supporterName?: string, nextStage?: string) {
  return await prisma.$transaction(async (tx: any) => {
    const updated = await tx.case.update({
      where: { id: caseId },
      data: {
        assigned_supporter_auth_user_id: supporterId,
        internal_status: nextStatus,
        user_facing_stage: nextStage || "under_review",
      },
    });

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        event_type: "supporter_assigned",
        actor: { connect: { id: adminId } },
        metadata_json: {
          supporter_id: supporterId,
          ...(supporterName ? { supporter_name: supporterName } : {}),
        },
      },
    });

    return updated;
  });
}

export async function findFirstIntakeUnit(caseId: string) {
  return await prisma.lifecycleUnit.findFirst({
    where: {
      case_id: caseId,
      unit_type: "version",
      unit_code: "v00",
    },
  });
}

export async function findLatestIntakeUnit(caseId: string) {
  return await prisma.lifecycleUnit.findFirst({
    where: {
      case_id: caseId,
      unit_code: "intake",
    },
    orderBy: { version_no: "desc" },
  });
}

export async function findFirstUserEvent(caseId: string) {
  return await prisma.caseEvent.findFirst({
    where: {
      case_id: caseId,
      actor: {
        role: "user",
      },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function findLifecycleUnits(caseId: string) {
  return await prisma.lifecycleUnit.findMany({
    where: { case_id: caseId },
    orderBy: { created_at: "desc" },
  });
}

export async function findOpenRequestsForMoreInfo(caseId: string) {
  return await prisma.caseEvent.findMany({
    where: {
      case_id: caseId,
      event_type: "more_info_requested",
    },
    orderBy: { created_at: "desc" },
  });
}

function buildVersionUnitCode(versionNo: number) {
  return `v${String(versionNo).padStart(2, "0")}`;
}

function buildAssessmentUnitCode(assessmentNo: number, linkedVersionNo: number) {
  return `a${String(assessmentNo).padStart(2, "0")}-v${String(linkedVersionNo).padStart(2, "0")}`;
}

export async function submitCaseRevision(data: {
  caseId: string;
  checkpointId: string;
  nextVersion: number;
  userId: string;
  changeSummary: string;
  documents: any[];
  remainingBlockers: any;
}) {
  const {
    caseId,
    checkpointId,
    nextVersion,
    userId,
    changeSummary,
    documents,
    remainingBlockers,
  } = data;

  return await prisma.$transaction(async (tx: any) => {
    await tx.checkpoint.update({
      where: { id: checkpointId },
      data: { latest_version_no: nextVersion },
    });

    const revisionUnit = await tx.lifecycleUnit.create({
      data: {
        case_id: caseId,
        checkpoint_id: checkpointId,
        unit_code: buildVersionUnitCode(nextVersion),
        unit_type: "version",
        version_no: nextVersion,
        content: JSON.stringify({
          change_summary: changeSummary,
          documents,
          remaining_blockers: remainingBlockers,
        }),
        file_url: documents[0]?.drive_url || documents[0]?.file_url || null,
      },
    });

    await createDocumentRecordsForUnit(
      caseId,
      checkpointId,
      revisionUnit.id,
      revisionUnit.unit_code,
      documents,
      userId,
      "revision_document",
      "outbound",
      tx,
    );

    await tx.case.update({
      where: { id: caseId },
      data: {
        user_facing_stage: "revision_submitted",
      },
    });

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        event_type: "revision_submitted",
        actor: { connect: { id: userId } },
        metadata_json: { version_no: nextVersion, change_summary: changeSummary },
      },
    });

    return revisionUnit;
  });
}

export async function createSupporterOutput(data: {
  caseId: string;
  checkpointId: string;
  userId: string;
  note?: string;
  documents: any[];
}) {
  const { caseId, checkpointId, userId, note, documents } = data;

  return await prisma.$transaction(async (tx: any) => {
    const checkpoint = await tx.checkpoint.findUnique({
      where: { id: checkpointId },
      select: { latest_version_no: true },
    });

    if (!checkpoint) {
      throw new AppError(404, "CHECKPOINT_NOT_FOUND", "Không tìm thấy checkpoint");
    }

    const versionNo = checkpoint.latest_version_no;
    const unitCode = buildVersionUnitCode(versionNo);
    const versionUnit = await tx.lifecycleUnit.findFirst({
      where: {
        case_id: caseId,
        checkpoint_id: checkpointId,
        unit_type: "version",
        version_no: versionNo,
      },
      orderBy: { created_at: "desc" },
    });

    if (!versionUnit) {
      throw new AppError(404, "VERSION_UNIT_NOT_FOUND", "Không tìm thấy phiên bản");
    }

    const balResult = await tx.creditLedger.aggregate({
      where: { case_id: caseId },
      _sum: { amount: true },
    });
    const currentBalance = balResult._sum.amount ?? 0;
    if (currentBalance < 1) {
      throw new AppError(402, 'NO_CREDITS', 'Hết credit. Vui lòng mua thêm.');
    }

    await createDocumentRecordsForUnit(
      caseId,
      checkpointId,
      versionUnit.id,
      unitCode,
      documents,
      userId,
      "supporter_output",
      "outbound",
      tx,
    );

    await tx.case.update({
      where: { id: caseId },
      data: {
        user_facing_stage: "report_ready",
        internal_status: "report_ready_to_publish",
      },
    });

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        event_type: "supporter_output_uploaded",
        actor: { connect: { id: userId } },
        metadata_json: {
          unit_code: unitCode,
          document_count: documents.length,
          note: note || null,
        },
      },
    });

    const newBalance = currentBalance - 1;
    await tx.creditLedger.create({
      data: {
        case_id: caseId,
        amount: -1,
        balance_after: newBalance,
        type: 'consumption',
        reference_id: unitCode,
        idempotency_key: `consume-${unitCode}-${caseId}`,
      },
    });

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        event_type: 'credit_used',
        actor: { connect: { id: userId } },
        metadata_json: { new_balance: newBalance },
      },
    });

    return {
      unit_code: unitCode,
      version_no: versionNo,
      document_count: documents.length,
    };
  });
}

export async function createExternalFeedback(data: {
  caseId: string;
  checkpointId: string;
  userId: string;
  note?: string;
  selectedVersionNo: number;
  metadataJson: any;
  documents: any[];
}) {
  const { caseId, checkpointId, userId, note, selectedVersionNo, metadataJson, documents } = data;

  return await prisma.$transaction(async (tx: any) => {
    const checkpoint = await tx.checkpoint.findUnique({
      where: { id: checkpointId },
      select: { latest_assessment_no: true },
    });

    if (!checkpoint) {
      throw new AppError(404, "CHECKPOINT_NOT_FOUND", "Không tìm thấy checkpoint");
    }

    const versionUnit = await tx.lifecycleUnit.findFirst({
      where: {
        case_id: caseId,
        checkpoint_id: checkpointId,
        unit_type: "version",
        version_no: selectedVersionNo,
      },
      orderBy: { created_at: "desc" },
    });

    if (!versionUnit) {
      throw new AppError(404, "VERSION_UNIT_NOT_FOUND", "Không tìm thấy phiên bản");
    }

    const nextAssessmentNo = (checkpoint.latest_assessment_no ?? 0) + 1;
    const assessmentUnit = await tx.lifecycleUnit.create({
      data: {
        case_id: caseId,
        checkpoint_id: checkpointId,
        unit_code: buildAssessmentUnitCode(nextAssessmentNo, selectedVersionNo),
        unit_type: "assessment",
        version_no: selectedVersionNo,
        assessment_no: nextAssessmentNo,
        linked_version_no: selectedVersionNo,
        content: JSON.stringify({
          source: metadataJson.source,
          source_other_text: metadataJson.source_other_text ?? null,
          timing: metadataJson.timing,
          note: note || null,
        }),
        file_url: documents[0]?.file_url || null,
      },
    });

    await tx.checkpoint.update({
      where: { id: checkpointId },
      data: { latest_assessment_no: nextAssessmentNo },
    });

    await createDocumentRecordsForUnit(
      caseId,
      checkpointId,
      assessmentUnit.id,
      assessmentUnit.unit_code,
      documents,
      userId,
      "external_feedback",
      "inbound",
      tx,
      () => metadataJson,
    );

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        event_type: "external_feedback_uploaded",
        actor: { connect: { id: userId } },
        metadata_json: {
          unit_code: assessmentUnit.unit_code,
          selected_version_no: selectedVersionNo,
          document_count: documents.length,
          note: note || null,
        },
      },
    });

    return {
      unit_code: assessmentUnit.unit_code,
      version_no: selectedVersionNo,
      assessment_no: nextAssessmentNo,
      document_count: documents.length,
    };
  });
}

export async function updateCaseStatus(caseId: string, userId: string, nextStage?: string, nextStatus?: string) {
  return await prisma.case.update({
    where: { id: caseId },
    data: {
      user_facing_stage: nextStage !== undefined ? nextStage : undefined,
      internal_status: nextStatus !== undefined ? nextStatus : undefined,
    },
  });
}

export async function createCaseEvent(caseId: string, userId: string, eventType: string, metadataJson?: any) {
  return await prisma.caseEvent.create({
    data: {
      case: { connect: { id: caseId } },
      actor: { connect: { id: userId } },
      event_type: eventType,
      metadata_json: metadataJson,
    },
  });
}

export async function listCaseMessages(caseId: string) {
  try {
    return await prisma.caseMessage.findMany({
      where: { case_id: caseId },
      include: {
        sender: true,
      },
      orderBy: { created_at: "asc" },
    });
  } catch (error) {
    console.error("[listCaseMessages] Failed to fetch case messages:", error);
    return [];
  }
}

export async function createCaseMessage(data: {
  caseId: string;
  userId: string;
  userRole: string;
  content: string;
}) {
  const { caseId, userId, userRole, content } = data;
  return await prisma.$transaction(async (tx: any) => {
    const newMessage = await tx.caseMessage.create({
      data: {
        case_id: caseId,
        sender_auth_user_id: userId,
        sender_role_snapshot: userRole ?? null,
        content,
      },
      include: {
        sender: true,
      },
    });

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        actor: { connect: { id: userId } },
        event_type: "message_sent",
        metadata_json: { message_id: newMessage.id },
      },
    });

    return newMessage;
  });
}

export async function updateCaseSettings(caseId: string, data: {
  team_name: string | null;
  school: string | null;
  course_context: string | null;
  group_no: string | null;
}) {
  return await prisma.case.update({
    where: { id: caseId },
    data,
  });
}

// User-related functional persistence methods (meaningful DDD isolation)
export async function findSupporterById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, name: true },
  });
}

export async function listAllSupporters() {
  return await prisma.user.findMany({
    where: {
      role: "supporter",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function upgradeCasePackage(
  caseId: string,
  packageId: string,
  lockedPrice: number,
) {
  return await prisma.case.update({
    where: { id: caseId },
    data: {
      package_id: packageId,
      locked_price: lockedPrice,
      payment_status: "unpaid",
    },
  });
}
