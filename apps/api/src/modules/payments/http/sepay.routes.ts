import { Hono } from "hono";
import { sepayWebhookHandler } from "./sepay.controller.js";

export const sepayRouter = new Hono();

// SePay webhook endpoint — no auth middleware, verified by API key in handler
sepayRouter.post("/sepay-webhook", sepayWebhookHandler);
