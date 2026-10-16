import { Hono } from "hono";
import {
  createPaymentLinkHandler,
  createReceivableHandler,
  getPublicReceivableHandler,
  listReceivablesHandler,
  recordPaymentHandler,
  systemAccountHandler,
  writeOffHandler,
} from "./receivables.controller.js";

/** Mounted at /api/admin/receivables; every handler checks the admin session itself. */
export const receivablesAdminRouter = new Hono();
receivablesAdminRouter.get("/", listReceivablesHandler);
receivablesAdminRouter.get("/system-account", systemAccountHandler);
receivablesAdminRouter.post("/", createReceivableHandler);
receivablesAdminRouter.post("/:id/payments", recordPaymentHandler);
receivablesAdminRouter.post("/:id/write-off", writeOffHandler);
receivablesAdminRouter.post("/:id/payment-link", createPaymentLinkHandler);

/** Mounted at /api/public/receivables: no login, the unguessable token is the credential. */
export const receivablesPublicRouter = new Hono();
receivablesPublicRouter.get("/:token", getPublicReceivableHandler);
