import { Hono } from "hono";
import {
  listAdminCasesHandler,
  getAdminCaseDetailHandler,
  acceptCaseHandler,
  rejectCaseHandler,
  adminRequestMoreInfoHandler,
  adminAssignSupporterHandler,
  listAdminDocumentsHandler,
  deleteAdminDocumentHandler,
  listAdminPackagesHandler,
  updatePackagePriceHandler,
  updatePackageStatusHandler,
  getAdminStatsHandler,
} from "./admin.controller.js";

export const adminRouter = new Hono();

adminRouter.get("/cases", listAdminCasesHandler);
adminRouter.get("/cases/:id", getAdminCaseDetailHandler);
adminRouter.post("/cases/:id/accept", acceptCaseHandler);
adminRouter.post("/cases/:id/reject", rejectCaseHandler);
adminRouter.post("/cases/:id/request-more-info", adminRequestMoreInfoHandler);
adminRouter.post("/cases/:id/assign", adminAssignSupporterHandler);

adminRouter.get("/documents", listAdminDocumentsHandler);
adminRouter.delete("/documents/:id", deleteAdminDocumentHandler);

adminRouter.get("/stats", getAdminStatsHandler);

adminRouter.get("/packages", listAdminPackagesHandler);
adminRouter.put("/packages/:id/price", updatePackagePriceHandler);
adminRouter.put("/packages/:id/status", updatePackageStatusHandler);
