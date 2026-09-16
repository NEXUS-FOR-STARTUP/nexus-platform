import { Hono } from "hono";
import {
  approveReportHandler,
  downloadCaseReportPdfHandler,
  downloadReportPdfByIdHandler,
  editReportHandler,
  getDraftReportHandler,
  getLatestReportHandler,
} from "./reports.controller.js";

export const reportsRouter = new Hono();

// NOTE (intentional ordering, do not reorder/rename lightly): `/:reportId/download`
// must come before the `/:caseId/*` routes. Single-segment paths overlap, and
// Hono matches top-down — moving `/:caseId/pdf` (or similar) above would route
// report downloads into the case handler. Renames must update both handlers.
reportsRouter.get("/:reportId/download", downloadReportPdfByIdHandler);
reportsRouter.get("/:caseId/draft", getDraftReportHandler);
reportsRouter.put("/:id", editReportHandler);
reportsRouter.post("/:id/approve", approveReportHandler);
reportsRouter.get("/:caseId/latest", getLatestReportHandler);
reportsRouter.get("/:caseId/pdf", downloadCaseReportPdfHandler);
reportsRouter.get("/:caseId/report.pdf", downloadCaseReportPdfHandler);
reportsRouter.get("/:caseId/:filename", downloadCaseReportPdfHandler);
