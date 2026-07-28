import { Hono } from "hono";
import {
  approveReportHandler,
  editReportHandler,
  getDraftReportHandler,
  getLatestReportHandler,
} from "./reports.controller.js";

export const reportsRouter = new Hono();

reportsRouter.get("/:caseId/draft", getDraftReportHandler);
reportsRouter.put("/:id", editReportHandler);
reportsRouter.post("/:id/approve", approveReportHandler);
reportsRouter.get("/:caseId/latest", getLatestReportHandler);
