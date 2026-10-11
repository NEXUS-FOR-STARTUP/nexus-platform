/** @deprecated Supporter flow frozen 2026-10-11; not mounted. See plans/261011-1454-ux-redesign-hanh-trinh. */
import { Hono } from "hono";
import {
  getDraftReportHandler,
  editDraftReportHandler,
  publishReportHandler,
  supporterRequestMoreInfoHandler,
} from "./supporter.controller.js";

export const supporterRouter = new Hono();

supporterRouter.get("/cases/:caseId/reports/draft", getDraftReportHandler);
supporterRouter.put("/reports/:reportId", editDraftReportHandler);
supporterRouter.post("/reports/:reportId/publish", publishReportHandler);
supporterRouter.post("/cases/:caseId/request-more-info", supporterRequestMoreInfoHandler);
