import type { Context } from "hono";
import { readJsonBody, handleError } from "../../../shared/infrastructure/http-helpers.js";
import { requireCaseAccess } from "../../../shared/infrastructure/authorization.js";
import { deleteManagedDocumentFile } from "../../documents/application/upload-managed-document-file.js";
import { deriveStageSummaries } from "../application/derive-stage-summaries.js";
import { uploadStageDocumentsUseCase } from "../application/upload-stage-documents.usecase.js";

// GET /api/cases/:id/stages
export async function getStageSummariesHandler(c: Context) {
  const access = await requireCaseAccess(c, c.req.param("id") || "");
  if (!access.ok) return access.response;
  try {
    return c.json(await deriveStageSummaries(access.caseRecord.id));
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

// POST /api/cases/:id/stages/:code/documents — owner uploads files into a stage, no case transition
export async function uploadStageDocumentsHandler(c: Context) {
  const access = await requireCaseAccess(c, c.req.param("id") || "");
  if (!access.ok) return access.response;

  const isOwner = access.caseRecord.owner_auth_user_id === access.session.user.id;
  let publicIds: string[] = [];
  try {
    const body = (await readJsonBody(c)) as { documents?: Array<{ cloudinary_public_id?: string }> } | null;
    publicIds = (body?.documents ?? []).flatMap((d) => (d?.cloudinary_public_id ? [d.cloudinary_public_id] : []));
    const result = await uploadStageDocumentsUseCase(
      access.session.user.id,
      access.caseRecord.id,
      c.req.param("code") || "",
      body?.documents ?? [],
    );
    return c.json(result, 201);
  } catch (error: unknown) {
    // Cloudinary ids come from the client: only the owner may trigger cleanup of them.
    if (isOwner) await Promise.all(publicIds.map((id) => deleteManagedDocumentFile(id)));
    return handleError(c, error);
  }
}
