import { Hono } from "hono";
import {
  acceptImportHandler,
  createImportHandler,
  generateHandler,
  getDocumentHandler,
  getImportHandler,
  getJobHandler,
  getQuestionHandler,
  getTemplateQuestionsHandler,
  listTemplatesHandler,
  putQuestionHandler,
} from "./authoring.controller.js";

// ---------------------------------------------------------------------------
// Authoring routes (plan §6). Mounted at /api/authoring in apps/api/src/index.ts.
// casesRouter is NOT grown (ground truth row 14).
// ---------------------------------------------------------------------------

export const authoringRouter = new Hono();

authoringRouter.get("/cases/:caseId/templates", listTemplatesHandler);
authoringRouter.get(
  "/cases/:caseId/templates/:templateKey/questions",
  getTemplateQuestionsHandler,
);
authoringRouter.get("/cases/:caseId/questions/:questionId", getQuestionHandler);
authoringRouter.put("/cases/:caseId/questions/:questionId", putQuestionHandler);
authoringRouter.post("/cases/:caseId/imports", createImportHandler);
authoringRouter.get("/cases/:caseId/imports/:importId", getImportHandler);
authoringRouter.post("/cases/:caseId/imports/:importId/accept", acceptImportHandler);
authoringRouter.post("/cases/:caseId/templates/:templateKey/generate", generateHandler);
authoringRouter.get("/cases/:caseId/jobs/:jobId", getJobHandler);
authoringRouter.get("/cases/:caseId/documents/:unitId", getDocumentHandler);
