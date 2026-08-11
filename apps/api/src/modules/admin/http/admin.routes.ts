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
  listServiceTypesHandler,
  createServiceTypeHandler,
  updateServiceTypeHandler,
  getPricingHistoryHandler,
  setPricingHandler,
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

adminRouter.get("/service-types", listServiceTypesHandler);
adminRouter.post("/service-types", createServiceTypeHandler);
adminRouter.patch("/service-types/:id", updateServiceTypeHandler);

adminRouter.get("/packages/:id/pricing", getPricingHistoryHandler);
adminRouter.post("/packages/:id/pricing", setPricingHandler);
