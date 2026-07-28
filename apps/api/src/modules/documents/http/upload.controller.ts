import type { Context } from "hono";
import { handleError } from "../../../shared/infrastructure/http-helpers.js";
import { uploadManagedDocumentFile } from "../application/upload-managed-document-file.js";

// ---------------------------------------------------------------------------
// POST /api/documents/upload — Upload a document file to Cloudinary
// ---------------------------------------------------------------------------

export async function uploadDocumentHandler(c: Context) {
  try {
    const body = await c.req.parseBody();
    const file = body["file"] as any;

    if (!file) {
      return c.json(
        { code: "VALIDATION_ERROR", message: "Thiếu tệp tải lên" },
        400,
      );
    }

    // documentType is accepted as metadata but validated by the caller
    const _documentType = body["documentType"] as string | undefined;

    const result = await uploadManagedDocumentFile(file);

    return c.json(
      {
        url: result.file_url,
        publicId: result.cloudinary_public_id,
        originalName: result.original_name,
        extension: result.extension,
        mimeType: result.mime_type,
      },
      201,
    );
  } catch (error: any) {
    return handleError(c, error);
  }
}
