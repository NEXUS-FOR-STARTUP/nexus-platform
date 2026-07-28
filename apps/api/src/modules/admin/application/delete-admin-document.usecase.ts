import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import type { Prisma } from "@prisma/client";
import { deleteManagedDocumentFile } from "../../documents/application/upload-managed-document-file.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function deleteAdminDocumentUseCase(adminId: string, documentId: string) {
  const doc = await prisma.documentRecord.findUnique({
    where: { id: documentId },
  });

  if (!doc) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy tài liệu này");
  }

  // If there's a Cloudinary public ID, delete the file from Cloudinary
  if (doc.cloudinary_public_id) {
    try {
      await deleteManagedDocumentFile(doc.cloudinary_public_id);
    } catch (err) {
      logger.error({ err, documentId }, 'Failed to delete Cloudinary file for document');
    }
  }

  // Delete document and log the case event in a database transaction
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Delete the database record
    await tx.documentRecord.delete({
      where: { id: documentId },
    });

    // Create a CaseEvent log entry
    await tx.caseEvent.create({
      data: {
        case: { connect: { id: doc.case_id } },
        actor: { connect: { id: adminId } },
        event_type: "document_deleted",
        metadata_json: {
          document_id: doc.id,
          original_name: doc.original_name,
          doc_type: doc.doc_type,
          uploaded_by_id: doc.uploaded_by_auth_user_id,
        },
      },
    });
  });

  return { success: true };
}
