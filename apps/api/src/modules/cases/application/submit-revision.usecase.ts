import { AppError } from "../../../shared/domain/app-error.js";
import {
  findActiveDocumentTypeByCode,
} from "../../documents/infrastructure/persistence/document-type.repository.js";
import {
  validateDocumentWriteInputs,
  validatePostIntakeDocumentInputs,
  validateExternalFeedbackMetadata,
} from "../../documents/application/validate-document-write.js";
import { toExternalFeedbackMetadataJson } from "../../documents/infrastructure/persistence/document.repository.js";
import {
  findCaseByIdWithMembersAndCheckpoints as defaultFindCaseByIdWithMembersAndCheckpoints,
  submitCaseRevisionInTx as defaultSubmitCaseRevisionInTx,
  createSupporterOutputDocs as defaultCreateSupporterOutputDocs,
  createExternalFeedback as defaultCreateExternalFeedback,
} from "../infrastructure/persistence/case.repository.js";
import logger from "../../../shared/infrastructure/logger.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { prisma } from "../../../db.js";
import type {
  SubmitRevisionRequest,
  SubmitRevisionUploadRequest,
  SupporterOutputUploadRequest,
  ExternalFeedbackUploadRequest,
} from "./cases.dto.js";
import { executeTransition, transitionInTx } from "../../../services/case-transition.service.js";

type SubmitRevisionDeps = {
  findCaseByIdWithMembersAndCheckpoints?: typeof defaultFindCaseByIdWithMembersAndCheckpoints;
  submitCaseRevisionInTx?: typeof defaultSubmitCaseRevisionInTx;
  createSupporterOutputDocs?: typeof defaultCreateSupporterOutputDocs;
  createExternalFeedback?: typeof defaultCreateExternalFeedback;
  findActiveDocumentTypeByCode?: typeof findActiveDocumentTypeByCode;
};

type CheckpointLike = {
  id: string;
  checkpoint_code: string;
  latest_version_no: number;
  latest_assessment_no?: number;
};

type CaseWithCheckpointsLike = {
  current_checkpoint?: string | null;
  checkpoints?: CheckpointLike[];
};

const defaultDeps = {
  findCaseByIdWithMembersAndCheckpoints: defaultFindCaseByIdWithMembersAndCheckpoints,
  submitCaseRevisionInTx: defaultSubmitCaseRevisionInTx,
  createSupporterOutputDocs: defaultCreateSupporterOutputDocs,
  createExternalFeedback: defaultCreateExternalFeedback,
  findActiveDocumentTypeByCode,
};

function selectCheckpoint(
  caseRecord: CaseWithCheckpointsLike,
): { id: string; latest_version_no: number } | null {
  if (!caseRecord?.checkpoints?.length) return null;
  const checkpoints = caseRecord.checkpoints;
  if (caseRecord.current_checkpoint) {
    const matched = checkpoints.find(
      (cp) => cp.checkpoint_code === caseRecord.current_checkpoint,
    );
    if (matched) return matched;
  }

  let selected = checkpoints[0] ?? null;
  for (const checkpoint of checkpoints) {
    if (!selected || checkpoint.latest_version_no > selected.latest_version_no) {
      selected = checkpoint;
      continue;
    }

    if (
      checkpoint.latest_version_no === selected.latest_version_no &&
      (checkpoint.latest_assessment_no ?? 0) > (selected.latest_assessment_no ?? 0)
    ) {
      selected = checkpoint;
    }
  }

  return selected;
}

async function validateDocumentsByFlow(
  documentTypeLookup: typeof findActiveDocumentTypeByCode,
  documents: Array<{ doc_type: string }>,
  flow: "revision" | "supporter_output" | "external_feedback",
  unitScope?: "version" | "assessment",
) {
  for (const document of documents) {
    const docType = await documentTypeLookup(document.doc_type);
    if (!docType || docType.flow !== flow || (unitScope && docType.unit_scope !== unitScope)) {
      throw new AppError(400, "VALIDATION_ERROR", `Loại tài liệu không hợp lệ cho luồng ${flow}: ${document.doc_type}`);
    }
  }
}

// @deprecated — bare endpoint /revisions, không còn FE gọi. Giữ nguyên behavior (T9 + data.files)
// để không đổi endpoint cũ. Upload mới đi qua submitRevisionUploadUseCase (/revisions/upload).
export async function submitRevisionUseCase(
  userId: string,
  caseId: string,
  body: SubmitRevisionRequest,
  _deps?: SubmitRevisionDeps,
) {
  if (typeof body.change_summary !== "string" || body.change_summary.trim().length < 10) {
    throw new AppError(400, "VALIDATION_ERROR", "Tóm tắt thay đổi tối thiểu phải 10 ký tự")
  }

  const documentValidation = validateDocumentWriteInputs(body.documents || [])
  if (!documentValidation.ok) {
    throw new AppError(400, "VALIDATION_ERROR", documentValidation.error)
  }

  return executeTransition({
    transition: 'T9_SUBMIT_REVISION',
    caseId,
    actorId: userId,
    roleVerified: 'CUSTOMER',
    data: { files: documentValidation.inputs.map(d => ({ ...d, doc_type: 'revision_document' })), reason: body.change_summary },
  })
}

export async function submitRevisionUploadUseCase(
  userId: string,
  caseId: string,
  body: SubmitRevisionUploadRequest,
  deps: SubmitRevisionDeps = {},
) {
  const startTime = Date.now();
  const {
    findCaseByIdWithMembersAndCheckpoints,
    submitCaseRevisionInTx,
    findActiveDocumentTypeByCode,
  } = {
    ...defaultDeps,
    ...deps,
  };

  const caseDetails = await findCaseByIdWithMembersAndCheckpoints(caseId);

  if (!caseDetails) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  }

  // D18: owner-only
  const isOwner = caseDetails.owner_auth_user_id === userId;
  if (!isOwner) {
    throw new AppError(403, "FORBIDDEN", "Không có quyền nộp sửa đổi cho dự án này");
  }

  if (typeof body.change_summary !== "string" || body.change_summary.trim().length < 10) {
    throw new AppError(400, "VALIDATION_ERROR", "Tóm tắt thay đổi tối thiểu phải 10 ký tự");
  }

  const uploadedDocuments = validatePostIntakeDocumentInputs(body.documents);
  await validateDocumentsByFlow(findActiveDocumentTypeByCode, uploadedDocuments, "revision", "version");

  const checkpoint = selectCheckpoint(caseDetails);
  if (!checkpoint) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy thông tin checkpoint");
  }

  const nextVersion = checkpoint.latest_version_no + 1;

  try {
    const result = await prisma.$transaction(async (tx) => {
      await submitCaseRevisionInTx(tx, {
        caseId,
        checkpointId: checkpoint.id,
        nextVersion,
        userId,
        changeSummary: body.change_summary,
        documents: uploadedDocuments,
        remainingBlockers: body.remaining_blockers,
      });
      return transitionInTx(tx, {
        transition: "T9_SUBMIT_REVISION",
        caseId,
        actorId: userId,
        roleVerified: "CUSTOMER",
        data: { reason: body.change_summary },
      });
    });
    // Emit sau commit — supporter nhận noti đã nộp bản sửa (case.stage_changed)
    emitEvent({
      eventId: crypto.randomUUID(),
      type: DOMAIN_EVENTS.CASE_STAGE_CHANGED,
      actorId: userId,
      occurredAt: new Date(),
      payload: {
        caseId,
        caseCode: caseDetails.case_code,
        fromStage: caseDetails.user_facing_stage,
        toStage: result.stage,
      },
    });
    logger.info({ caseId, transition: 'submit_revision', actorId: userId, duration_ms: Date.now() - startTime }, 'case transition: submit_revision');
    return result;
  } catch (error) {
    logger.error({ err: error, caseId, transition: 'submit_revision', actorId: userId, duration_ms: Date.now() - startTime }, 'case transition failed: submit_revision');
    throw error;
  }
}

export async function submitSupporterOutputUploadUseCase(
  userId: string,
  caseId: string,
  body: SupporterOutputUploadRequest,
  deps: SubmitRevisionDeps = {},
  userRole?: string,
) {
  const startTime = Date.now();
  const {
    findCaseByIdWithMembersAndCheckpoints,
    createSupporterOutputDocs,
    findActiveDocumentTypeByCode,
  } = {
    ...defaultDeps,
    ...deps,
  };

  const caseDetails = await findCaseByIdWithMembersAndCheckpoints(caseId);
  if (!caseDetails) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  }

  const isSupporter = caseDetails.assigned_supporter_auth_user_id === userId || userRole === "admin";
  if (!isSupporter) {
    throw new AppError(403, "FORBIDDEN", "Không có quyền tải output supporter cho dự án này");
  }

  const uploadedDocuments = validatePostIntakeDocumentInputs(body.documents);
  // Override ALL documents to supporter_output — the frontend no longer sends a
  // meaningful document_type_code after the merge-supporter-output-doc-types refactor.
  // This also protects against stale frontend clients still sending
  // doc_type: "supporter_attachment" after the DB deactivation (T3).
  const normalizedDocuments = uploadedDocuments.map(
    (d) => ({ ...d, doc_type: "supporter_output" as const }),
  );
  await validateDocumentsByFlow(findActiveDocumentTypeByCode, normalizedDocuments, "supporter_output", "version");

  const checkpoint = selectCheckpoint(caseDetails);
  if (!checkpoint) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy thông tin checkpoint");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const docs = await createSupporterOutputDocs(tx, {
        caseId,
        checkpointId: checkpoint.id,
        userId,
        note: body.note,
        documents: normalizedDocuments,
      });
      // D11: T11 trong cùng 1 tx — credit check + consume do machine lo (subtractCredit, idempotent)
      const transition = await transitionInTx(tx, {
        transition: "T11_SUBMIT_OUTPUT",
        caseId,
        actorId: userId,
        roleVerified: userRole === "admin" ? "ADMIN" : "SUPPORTER",
        data: { unitCode: docs.unit_code },
      });
      return { ...docs, stage: transition.stage, status: transition.status };
    });
    // Emit sau commit — báo cáo phản biện sẵn sàng → student nhận noti (report.published)
    emitEvent({
      eventId: crypto.randomUUID(),
      type: DOMAIN_EVENTS.REPORT_PUBLISHED,
      actorId: userId,
      occurredAt: new Date(),
      payload: {
        caseId,
        caseCode: caseDetails.case_code,
        reportId: null,
      },
    });
    logger.info({ caseId, transition: 'supporter_output', actorId: userId, actorRole: 'supporter', duration_ms: Date.now() - startTime }, 'case transition: supporter_output');
    return result;
  } catch (error) {
    logger.error({ err: error, caseId, transition: 'supporter_output', actorId: userId, actorRole: 'supporter', duration_ms: Date.now() - startTime }, 'case transition failed: supporter_output');
    throw error;
  }
}

export async function submitExternalFeedbackUploadUseCase(
  userId: string,
  caseId: string,
  body: ExternalFeedbackUploadRequest,
  deps: SubmitRevisionDeps = {},
) {
  const startTime = Date.now();
  const {
    findCaseByIdWithMembersAndCheckpoints,
    createExternalFeedback,
    findActiveDocumentTypeByCode,
  } = {
    ...defaultDeps,
    ...deps,
  };

  const caseDetails = await findCaseByIdWithMembersAndCheckpoints(caseId);
  if (!caseDetails) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  }

  // D18: owner-only
  const isOwner = caseDetails.owner_auth_user_id === userId;
  if (!isOwner) {
    throw new AppError(403, "FORBIDDEN", "Không có quyền tải đánh giá bên ngoài cho dự án này");
  }

  const uploadedDocuments = validatePostIntakeDocumentInputs(body.documents);
  await validateDocumentsByFlow(findActiveDocumentTypeByCode, uploadedDocuments, "external_feedback", "assessment");
  const metadata = validateExternalFeedbackMetadata(body);

  const checkpoint = selectCheckpoint(caseDetails);
  if (!checkpoint) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy thông tin checkpoint");
  }

  try {
    const result = await createExternalFeedback({
      caseId,
      checkpointId: checkpoint.id,
      userId,
      note: body.note,
      selectedVersionNo: metadata.selected_version_no,
      metadataJson: toExternalFeedbackMetadataJson(metadata),
      documents: uploadedDocuments,
    });
    logger.info({ caseId, transition: 'external_feedback', actorId: userId, duration_ms: Date.now() - startTime }, 'case transition: external_feedback');
    return result;
  } catch (error) {
    logger.error({ err: error, caseId, transition: 'external_feedback', actorId: userId, duration_ms: Date.now() - startTime }, 'case transition failed: external_feedback');
    throw error;
  }
}
