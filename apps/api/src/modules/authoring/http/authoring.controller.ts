import type { Context } from "hono";
import { requireCaseAccess } from "../../../shared/infrastructure/authorization.js";
import { handleError, readJsonBody } from "../../../shared/infrastructure/http-helpers.js";
import {
  getQuestionDetail,
  getTemplateQuestions,
  listTemplates,
  saveAnswer,
} from "../application/answer.service.js";
import {
  acceptImportProposal,
  createImportProposal,
  getImportProposal,
} from "../application/import.service.js";
import {
  dispatchGenerate,
  getAuthoringJob,
  getGeneratedDocument,
} from "../application/generate.service.js";

// ---------------------------------------------------------------------------
// Authoring HTTP handlers (plan §6). Every handler starts with the case access
// check (reused `requireCaseAccess`), so the import upload route is authorized
// against the case — not merely session-authenticated (plan §8, ground truth
// row 10).
// ---------------------------------------------------------------------------

function requireParam(c: Context, name: string): string {
  const value = c.req.param(name) || "";
  if (!value) {
    throw new Error(`missing route param: ${name}`);
  }
  return value;
}

// GET /api/authoring/cases/:caseId/templates
export async function listTemplatesHandler(c: Context) {
  const caseId = requireParam(c, "caseId");
  try {
    const access = await requireCaseAccess(c, caseId);
    if (!access.ok) return access.response;
    return c.json(await listTemplates(caseId));
  } catch (e) {
    return handleError(c, e);
  }
}

// GET /api/authoring/cases/:caseId/templates/:templateKey/questions
export async function getTemplateQuestionsHandler(c: Context) {
  const caseId = requireParam(c, "caseId");
  const templateKey = requireParam(c, "templateKey");
  try {
    const access = await requireCaseAccess(c, caseId);
    if (!access.ok) return access.response;
    return c.json(await getTemplateQuestions(caseId, templateKey));
  } catch (e) {
    return handleError(c, e);
  }
}

// GET /api/authoring/cases/:caseId/questions/:questionId
export async function getQuestionHandler(c: Context) {
  const caseId = requireParam(c, "caseId");
  const questionId = requireParam(c, "questionId");
  try {
    const access = await requireCaseAccess(c, caseId);
    if (!access.ok) return access.response;
    return c.json(await getQuestionDetail(caseId, questionId));
  } catch (e) {
    return handleError(c, e);
  }
}

// PUT /api/authoring/cases/:caseId/questions/:questionId
export async function putQuestionHandler(c: Context) {
  const caseId = requireParam(c, "caseId");
  const questionId = requireParam(c, "questionId");
  try {
    const access = await requireCaseAccess(c, caseId);
    if (!access.ok) return access.response;
    const body = await readJsonBody(c);
    const action = body?.action;
    if (action !== "save_draft" && action !== "complete") {
      return c.json(
        { code: "INVALID_INPUT", message: "action phải là save_draft hoặc complete" },
        400,
      );
    }
    const text = typeof body?.text === "string" ? body.text : "";
    const result = await saveAnswer(caseId, questionId, action, text, access.session.user.id);
    return c.json(result, 200);
  } catch (e) {
    return handleError(c, e);
  }
}

// POST /api/authoring/cases/:caseId/imports (multipart)
export async function createImportHandler(c: Context) {
  const caseId = requireParam(c, "caseId");
  try {
    const access = await requireCaseAccess(c, caseId);
    if (!access.ok) return access.response;
    const body = await c.req.parseBody();
    const file = body["file"];
    if (!file || typeof (file as { arrayBuffer?: unknown }).arrayBuffer !== "function") {
      return c.json({ code: "VALIDATION_ERROR", message: "Thiếu tệp import" }, 400);
    }
    const result = await createImportProposal(
      caseId,
      file as { name: string; size: number; type?: string; arrayBuffer: () => Promise<ArrayBuffer> },
      access.session.user.id,
    );
    return c.json(result, 201);
  } catch (e) {
    return handleError(c, e);
  }
}

// GET /api/authoring/cases/:caseId/imports/:importId
export async function getImportHandler(c: Context) {
  const caseId = requireParam(c, "caseId");
  const importId = requireParam(c, "importId");
  try {
    const access = await requireCaseAccess(c, caseId);
    if (!access.ok) return access.response;
    return c.json(await getImportProposal(caseId, importId));
  } catch (e) {
    return handleError(c, e);
  }
}

// POST /api/authoring/cases/:caseId/imports/:importId/accept
export async function acceptImportHandler(c: Context) {
  const caseId = requireParam(c, "caseId");
  const importId = requireParam(c, "importId");
  try {
    const access = await requireCaseAccess(c, caseId);
    if (!access.ok) return access.response;
    const body = await readJsonBody(c);
    const accept = Array.isArray(body?.accept)
      ? body.accept.filter((x: unknown): x is string => typeof x === "string")
      : [];
    const result = await acceptImportProposal(caseId, importId, accept, access.session.user.id);
    return c.json(result, 200);
  } catch (e) {
    return handleError(c, e);
  }
}

// POST /api/authoring/cases/:caseId/templates/:templateKey/generate
export async function generateHandler(c: Context) {
  const caseId = requireParam(c, "caseId");
  const templateKey = requireParam(c, "templateKey");
  try {
    const access = await requireCaseAccess(c, caseId);
    if (!access.ok) return access.response;
    const result = await dispatchGenerate(caseId, templateKey);
    return c.json(result, 202);
  } catch (e) {
    return handleError(c, e);
  }
}

// GET /api/authoring/cases/:caseId/jobs/:jobId
export async function getJobHandler(c: Context) {
  const caseId = requireParam(c, "caseId");
  const jobId = requireParam(c, "jobId");
  try {
    const access = await requireCaseAccess(c, caseId);
    if (!access.ok) return access.response;
    return c.json(await getAuthoringJob(caseId, jobId));
  } catch (e) {
    return handleError(c, e);
  }
}

// GET /api/authoring/cases/:caseId/documents/:unitId
export async function getDocumentHandler(c: Context) {
  const caseId = requireParam(c, "caseId");
  const unitId = requireParam(c, "unitId");
  try {
    const access = await requireCaseAccess(c, caseId);
    if (!access.ok) return access.response;
    return c.json(await getGeneratedDocument(caseId, unitId));
  } catch (e) {
    return handleError(c, e);
  }
}
