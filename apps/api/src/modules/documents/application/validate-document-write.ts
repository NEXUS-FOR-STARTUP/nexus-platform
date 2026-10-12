import { AppError } from "../../../shared/domain/app-error.js";
import { DOCUMENT_CATEGORY_CODES, canonicalizeDocCategory } from "@repo/validation";
import { validateDocumentUrl } from "../application/document-dto.js";
import type { DocumentWriteInput } from "../application/document-dto.js";
import {
  DOCUMENT_TYPE_FLOWS,
  DOCUMENT_UNIT_SCOPES,
  EXTERNAL_FEEDBACK_SOURCES,
  EXTERNAL_FEEDBACK_TIMINGS,
  deriveSourceKindFromUrl,
} from "../domain/document-types.js";
import type {
  DocumentSourceKind,
  DocumentTypeFlow,
  DocumentUnitScope,
  ExternalFeedbackSource,
  ExternalFeedbackTiming,
} from "../domain/document-types.js";
import { getCloudName } from "../../../services/cloudinary.js";

export interface ValidatedDocumentWriteInput {
  original_name?: string;
  file_url?: string;
  drive_url?: string;
  doc_type?: string;
  document_type?: string;
  extension?: string;
  mime_type?: string;
  /** Server-derived source kind from the validated URL. */
  source_kind: DocumentSourceKind;
}

export type PostIntakeDocumentInput = {
  original_name: string;
  file_url: string;
  download_url: string;
  cloudinary_public_id: string;
  extension: string;
  mime_type: string;
  doc_type: string;
  /**
   * Student-facing category (shared `DOCUMENT_CATEGORY_CODES` catalog, the same
   * list the intake step offers). Stored in `metadata_json.category`, kept apart
   * from `doc_type` which stays the stored kind.
   */
  category?: string;
};

export type ExternalFeedbackMetadata = {
  source: ExternalFeedbackSource;
  source_other_text?: string;
  timing: ExternalFeedbackTiming;
  selected_version_no: number;
};

export function validateDocumentWriteInputs(
  documents: unknown[],
): { ok: true; inputs: DocumentWriteInput[] } | { ok: false; error: string } {
  if (!Array.isArray(documents)) {
    return { ok: false, error: "Phải cung cấp ít nhất một tài liệu" };
  }

  if (documents.length === 0) {
    return { ok: true, inputs: [] };
  }

  const inputs: DocumentWriteInput[] = [];
  for (const doc of documents) {
    if (typeof doc !== "object" || doc === null) {
      return { ok: false, error: "Tài liệu không hợp lệ" };
    }
    const d = doc as Record<string, unknown>;
    const url =
      typeof d.file_url === "string" ? d.file_url.trim() : typeof d.drive_url === "string" ? d.drive_url.trim() : "";
    if (!url) {
      return { ok: false, error: "Tài liệu phải có file_url hoặc drive_url" };
    }

    const sourceKind = deriveSourceKindFromUrl(url);
    try {
      validateDocumentUrl(url, sourceKind, {
        cloudinaryCloudName: sourceKind === "cloudinary" ? getCloudName() : "",
      });
    } catch {
      return { ok: false, error: `URL tài liệu không hợp lệ: ${url}` };
    }

    inputs.push({
      original_name: typeof d.original_name === "string" ? d.original_name : undefined,
      file_url: url,
      drive_url: typeof d.drive_url === "string" ? d.drive_url.trim() : undefined,
      doc_type: typeof d.doc_type === "string" ? d.doc_type : undefined,
      document_type: typeof d.document_type === "string" ? d.document_type : undefined,
      extension: typeof d.extension === "string" ? d.extension : undefined,
      mime_type: typeof d.mime_type === "string" ? d.mime_type : undefined,
    });
  }

  return { ok: true, inputs };
}

export function validateDocumentTypeQuery(filters: {
  flow?: string;
  unit_scope?: string;
}) {
  if (
    filters.flow &&
    !(DOCUMENT_TYPE_FLOWS as readonly string[]).includes(filters.flow)
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Flow loại tài liệu không hợp lệ");
  }

  if (
    filters.unit_scope &&
    !(DOCUMENT_UNIT_SCOPES as readonly string[]).includes(filters.unit_scope)
  ) {
    throw new AppError(400, "VALIDATION_ERROR", "Unit scope loại tài liệu không hợp lệ");
  }

  return {
    flow: filters.flow as DocumentTypeFlow | undefined,
    unit_scope: filters.unit_scope as DocumentUnitScope | undefined,
  };
}

export function validatePostIntakeDocumentInputs(documents: unknown[]): PostIntakeDocumentInput[] {
  if (!Array.isArray(documents) || documents.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Phải cung cấp ít nhất một tệp tài liệu");
  }

  return documents.map((doc, index) => {
    if (typeof doc !== "object" || doc === null) {
      throw new AppError(400, "VALIDATION_ERROR", `Tệp tài liệu #${index + 1} không hợp lệ`);
    }

    const input = doc as Record<string, unknown>;
    const originalName = typeof input.original_name === "string" ? input.original_name.trim() : "";
    const fileUrl = typeof input.file_url === "string" ? input.file_url.trim() : "";
    const downloadUrl = typeof input.download_url === "string" ? input.download_url.trim() : "";
    const publicId = typeof input.cloudinary_public_id === "string" ? input.cloudinary_public_id.trim() : "";
    const extension = typeof input.extension === "string" ? input.extension.trim() : "";
    const mimeType = typeof input.mime_type === "string" ? input.mime_type.trim() : "";
    const docType = typeof input.doc_type === "string" ? input.doc_type.trim() : "";
    const rawCategory = typeof input.category === "string" ? input.category.trim() : "";
    const category = rawCategory ? canonicalizeDocCategory(rawCategory) : "";

    if (rawCategory && !(DOCUMENT_CATEGORY_CODES as readonly string[]).includes(category)) {
      throw new AppError(400, "VALIDATION_ERROR", `Loại tài liệu không hợp lệ: ${rawCategory}`);
    }

    if (!originalName || !fileUrl || !downloadUrl || !publicId || !extension || !mimeType || !docType) {
      throw new AppError(400, "VALIDATION_ERROR", `Thiếu metadata tệp tải lên #${index + 1}`);
    }

    const sourceKind = deriveSourceKindFromUrl(fileUrl);
    if (sourceKind !== "cloudinary") {
      throw new AppError(400, "VALIDATION_ERROR", "Tài liệu hậu intake phải là tệp Cloudinary hợp lệ");
    }

    validateDocumentUrl(fileUrl, sourceKind, {
      cloudinaryCloudName: sourceKind === "cloudinary" ? getCloudName() : "",
    });

    const downloadSourceKind = deriveSourceKindFromUrl(downloadUrl);
    validateDocumentUrl(downloadUrl, downloadSourceKind, {
      cloudinaryCloudName: downloadSourceKind === "cloudinary" ? getCloudName() : "",
    });

    return {
      original_name: originalName,
      file_url: fileUrl,
      download_url: downloadUrl,
      cloudinary_public_id: publicId,
      extension,
      mime_type: mimeType,
      doc_type: docType,
      category: category || undefined,
    };
  });
}

export function validateExternalFeedbackMetadata(input: unknown): ExternalFeedbackMetadata {
  if (typeof input !== "object" || input === null) {
    throw new AppError(400, "VALIDATION_ERROR", "Metadata đánh giá bên ngoài không hợp lệ");
  }

  const metadata = input as Record<string, unknown>;
  const source = typeof metadata.source === "string" ? metadata.source.trim() : "";
  const sourceOtherText = typeof metadata.source_other_text === "string" ? metadata.source_other_text.trim() : "";
  const timing = typeof metadata.timing === "string" ? metadata.timing.trim() : "";
  const selectedVersionNo = Number(metadata.selected_version_no);

  if (!(EXTERNAL_FEEDBACK_SOURCES as readonly string[]).includes(source)) {
    throw new AppError(400, "VALIDATION_ERROR", "Nguồn đánh giá bên ngoài không hợp lệ");
  }

  if (!(EXTERNAL_FEEDBACK_TIMINGS as readonly string[]).includes(timing)) {
    throw new AppError(400, "VALIDATION_ERROR", "Thời điểm đánh giá bên ngoài không hợp lệ");
  }

  if (!Number.isInteger(selectedVersionNo) || selectedVersionNo < 1) {
    throw new AppError(400, "VALIDATION_ERROR", "Phiên bản gắn với đánh giá bên ngoài không hợp lệ");
  }

  if (source === "other" && sourceOtherText.length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Phải nhập nguồn khác khi chọn nguồn đánh giá là 'other'");
  }

  return {
    source: source as ExternalFeedbackSource,
    source_other_text: source === "other" ? sourceOtherText : undefined,
    timing: timing as ExternalFeedbackTiming,
    selected_version_no: selectedVersionNo,
  };
}
