import type { Context } from "hono";
import { handleError } from "../../../shared/infrastructure/http-helpers.js";
import {
  sepayWebhookUseCase,
  type SePayWebhookPayload,
} from "../application/sepay-webhook.usecase.js";

// ---------------------------------------------------------------------------
// POST /api/payments/sepay-webhook — Receive SePay transaction notifications
// ---------------------------------------------------------------------------

export async function sepayWebhookHandler(c: Context) {
  // Verify webhook API key
  const authHeader = c.req.header("authorization") || "";
  const expectedKey = process.env["SEPAY_WEBHOOK_API_KEY"];

  if (expectedKey && !authHeader.includes(expectedKey)) {
    return c.json({ success: false, error: "unauthorized" }, 401);
  }

  try {
    const body = await c.req.json<SePayWebhookPayload>();

    const result = await sepayWebhookUseCase(body);

    return c.json({ success: true, ...result });
  } catch (error: any) {
    // Always return 200 to SePay to prevent retry spam
    // Log the error internally
    handleError(c, error);
    return c.json({ success: true });
  }
}
