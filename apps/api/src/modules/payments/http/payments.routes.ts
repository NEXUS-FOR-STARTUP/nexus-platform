import { Hono } from "hono";
import {
  listPaymentsHandler,
  listMyPaymentsHandler,
  createPaymentHandler,
  getPaymentHandler,
  uploadPaymentProofHandler,
  verifyPaymentHandler,
} from "./payments.controller.js";

export const paymentsRouter = new Hono();

paymentsRouter.get("/", listPaymentsHandler);
paymentsRouter.post("/", createPaymentHandler);
paymentsRouter.get("/my", listMyPaymentsHandler);
paymentsRouter.get("/:id", getPaymentHandler);
paymentsRouter.post("/proof", uploadPaymentProofHandler);
paymentsRouter.post("/:id/verify", verifyPaymentHandler);
