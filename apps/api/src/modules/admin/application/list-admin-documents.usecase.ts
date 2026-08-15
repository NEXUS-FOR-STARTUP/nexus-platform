import { prisma } from "../../../db.js";

export async function listAdminDocumentsUseCase() {
  const docs = await prisma.documentRecord.findMany({
    orderBy: {
      created_at: "desc",
    },
    include: {
      case: {
        select: {
          case_code: true,
          team_name: true,
        },
      },
      uploaded_by: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return docs.map((doc) => ({
    id: doc.id,
    case_id: doc.case_id,
    case_code: doc.case?.case_code || "N/A",
    team_name: doc.case?.team_name || "N/A",
    checkpoint_id: doc.checkpoint_id,
    lifecycle_unit_id: doc.lifecycle_unit_id,
    unit_code: doc.unit_code,
    direction: doc.direction,
    doc_type: doc.doc_type,
    seq: doc.seq,
    is_primary: doc.is_primary,
    source_kind: doc.source_kind,
    canonical_name: doc.canonical_name,
    original_name: doc.original_name,
    extension: doc.extension,
    mime_type: doc.mime_type,
    file_url: doc.file_url,
    download_url: doc.download_url,
    cloudinary_public_id: doc.cloudinary_public_id,
    uploaded_by: doc.uploaded_by?.name || "N/A",
    uploaded_by_email: doc.uploaded_by?.email || "N/A",
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    superseded_at: doc.superseded_at,
  }));
}
