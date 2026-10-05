import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { uploadManagedDocumentFile } from "../../documents/application/upload-managed-document-file.js";
import { isAllowedDocumentExtension } from "../../documents/domain/document-upload-rules.js";
import { extractDocumentText, type ManagedUploadFile } from "../infrastructure/file-extraction.js";
import {
  CATALOG_VERSION,
  type ProposedItem,
  planImportAccept,
} from "../domain/authoring-domain.js";
import {
  importExtensionOf,
  loadAnswerRows,
  resolveAuthoringCheckpointId,
  toAnswerStateMap,
} from "./authoring-persistence.js";

// ---------------------------------------------------------------------------
// Import propose / accept (plan §6, clause 13). Review-before-accept: extraction
// stages a pending proposal; acceptance writes draft-only answers and never
// silently overwrites an existing answer.
// ---------------------------------------------------------------------------

const IMPORT_ALLOWED_EXTENSIONS = [".md", ".txt", ".docx", ".pdf"] as const;

export async function createImportProposal(
  caseId: string,
  file: ManagedUploadFile,
  userId: string,
) {
  const extension = importExtensionOf(file.name);
  if (!(IMPORT_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
    throw new AppError(
      400,
      "INVALID_FILE_TYPE",
      "Chỉ hỗ trợ import tệp .md, .txt, .docx, .pdf",
    );
  }
  if (!isAllowedDocumentExtension(extension)) {
    throw new AppError(400, "INVALID_FILE_TYPE", "Định dạng tệp không được hỗ trợ");
  }

  // Safe in-API extraction (plan §8): untrusted text, kept as a plain field.
  const { text } = await extractDocumentText(file);

  // Store the source document (provenance, clause 13) and stage the raw text.
  // AI mapping of raw text → per-question items is the P6 worker's job.
  const uploaded = await uploadManagedDocumentFile(file);
  const checkpointId = await resolveAuthoringCheckpointId(caseId);
  if (!checkpointId) {
    throw new AppError(409, "NO_CHECKPOINT", "Hồ sơ chưa có checkpoint để lưu tài liệu");
  }

  const record = await prisma.documentRecord.create({
    data: {
      case_id: caseId,
      checkpoint_id: checkpointId,
      lifecycle_unit_id: null,
      unit_code: null,
      direction: "inbound",
      doc_type: "generic",
      seq: 0,
      is_primary: true,
      source_kind: "cloudinary",
      canonical_name: null,
      original_name: uploaded.original_name,
      extension: uploaded.extension,
      mime_type: uploaded.mime_type,
      file_url: uploaded.file_url,
      download_url: uploaded.download_url,
      cloudinary_public_id: uploaded.cloudinary_public_id,
      uploaded_by_auth_user_id: userId,
    },
  });

  const stagedItems: ProposedItem[] = [
    { question_id: "", proposed_text: text, source_pointer: file.name },
  ];

  const proposal = await prisma.importProposal.create({
    data: {
      case_id: caseId,
      source_document_record_id: record.id,
      status: "pending",
      // SAFETY: stagedItems is a plain JSON-serializable array of string fields;
      // Prisma persists the Json column verbatim (shape re-validated at accept).
      proposed_items: stagedItems as unknown as Prisma.InputJsonValue,
      created_by: userId,
    },
  });

  return {
    id: proposal.id,
    status: proposal.status,
    proposed_items: stagedItems,
  };
}

export async function getImportProposal(caseId: string, importId: string) {
  const proposal = await prisma.importProposal.findFirst({
    where: { id: importId, case_id: caseId },
  });
  if (!proposal) {
    throw new AppError(404, "IMPORT_NOT_FOUND", "Không tìm thấy đề xuất import");
  }
  return {
    id: proposal.id,
    status: proposal.status,
    source_document_record_id: proposal.source_document_record_id,
    // SAFETY: proposed_items is written only by createImportProposal as a JSON
    // array of { question_id, proposed_text, source_pointer }.
    proposed_items: proposal.proposed_items as unknown as ProposedItem[],
    created_at: proposal.created_at,
  };
}

export async function acceptImportProposal(
  caseId: string,
  importId: string,
  acceptIds: string[],
  userId: string,
) {
  const proposal = await prisma.importProposal.findFirst({
    where: { id: importId, case_id: caseId },
  });
  if (!proposal) {
    throw new AppError(404, "IMPORT_NOT_FOUND", "Không tìm thấy đề xuất import");
  }
  if (proposal.status !== "pending") {
    throw new AppError(409, "IMPORT_ALREADY_RESOLVED", "Đề xuất import đã được xử lý");
  }

  // SAFETY: proposed_items is written only by createImportProposal as a JSON
  // array of { question_id, proposed_text, source_pointer }.
  const proposedItems = (proposal.proposed_items as unknown as ProposedItem[]).filter(
    (item) => item.question_id !== "",
  );
  const rows = await loadAnswerRows(caseId);
  const existing = toAnswerStateMap(rows);
  const plan = planImportAccept(proposedItems, acceptIds, existing);

  await prisma.$transaction(async (tx) => {
    for (const item of plan.applied) {
      const latest = await tx.answerRevision.findFirst({
        where: { case_id: caseId, question_id: item.question_id },
        orderBy: { revision_no: "desc" },
        select: { revision_no: true },
      });
      const revisionNo = (latest?.revision_no ?? 0) + 1;

      await tx.answerRevision.create({
        data: {
          case_id: caseId,
          question_id: item.question_id,
          revision_no: revisionNo,
          answer_text: item.proposed_text,
          status_after: "draft",
          source: "import",
          source_document_record_id: proposal.source_document_record_id,
          catalog_version: CATALOG_VERSION,
          created_by: userId,
        },
      });
      await tx.projectAnswer.create({
        data: {
          case_id: caseId,
          question_id: item.question_id,
          status: "draft",
          answer_text: item.proposed_text,
          needs_review: false,
          review_reason: null,
          catalog_version: CATALOG_VERSION,
        },
      });
    }
    await tx.importProposal.update({
      where: { id: proposal.id },
      data: { status: "accepted" },
    });
  });

  return {
    applied: plan.applied.map((item) => item.question_id),
    conflicts: plan.conflicts,
    skipped: plan.skipped,
  };
}
