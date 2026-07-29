import { Hono } from "hono";
import {
  listCasesHandler,
  createCaseHandler,
  listSupportersHandler,
  getCaseDetailHandler,
  getCaseDocumentsHandler,
  listDocumentTypesHandler,
  uploadManagedDocumentHandler,
  submitRevisionHandler,
  submitRevisionUploadHandler,
  submitSupporterOutputUploadHandler,
  submitExternalFeedbackUploadHandler,
  assignSupporterHandler,
  updateCaseStatusHandler,
  listMessagesHandler,
  sendMessageHandler,
  updateCaseSettingsHandler,
  deleteCaseHandler,
  intakeHandler,
  vetoHandler,
  completeCaseHandler,
  upgradePackageHandler,
  resubmitCaseHandler,
} from "./cases.controller.js";

export const casesRouter = new Hono();

casesRouter.get("/", listCasesHandler);
casesRouter.post("/", createCaseHandler);
casesRouter.get("/supporters", listSupportersHandler);
casesRouter.get("/document-types", listDocumentTypesHandler);
casesRouter.post("/uploads/managed-document", uploadManagedDocumentHandler);
casesRouter.get("/:id", getCaseDetailHandler);
casesRouter.get("/:id/documents", getCaseDocumentsHandler);
casesRouter.post("/:id/revisions", submitRevisionHandler);
casesRouter.post("/:id/revisions/upload", submitRevisionUploadHandler);
casesRouter.post("/:id/supporter-outputs/upload", submitSupporterOutputUploadHandler);
casesRouter.post("/:id/external-feedback/upload", submitExternalFeedbackUploadHandler);
casesRouter.post("/:id/assign", assignSupporterHandler);
casesRouter.post("/:id/status", updateCaseStatusHandler);
casesRouter.get("/:id/messages", listMessagesHandler);
casesRouter.post("/:id/messages", sendMessageHandler);
casesRouter.put("/:id/settings", updateCaseSettingsHandler);
casesRouter.delete("/:id", deleteCaseHandler);
casesRouter.post("/:id/intake", intakeHandler);
casesRouter.post("/:id/veto", vetoHandler);
casesRouter.post("/:id/complete", completeCaseHandler);
casesRouter.post("/:id/upgrade-package", upgradePackageHandler);
casesRouter.post("/:id/resubmit", resubmitCaseHandler);
