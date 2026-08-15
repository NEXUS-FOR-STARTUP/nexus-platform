import { Hono } from "hono";
import {
  uploadPaymentProofHandler,
} from "./payments.controller.js";

export const paymentsRouter = new Hono();

paymentsRouter.post("/proof", uploadPaymentProofHandler);
