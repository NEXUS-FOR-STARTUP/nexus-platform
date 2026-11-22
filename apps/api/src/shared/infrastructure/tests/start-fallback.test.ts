import test from "node:test";
import assert from "node:assert/strict";

import { isRetryableAiError } from "../../../services/generate-with-fallback.js";

test("retryable: provider and transport failures fall back to Gemini", () => {
  assert.equal(isRetryableAiError({ statusCode: 429, message: "rate limited" }), true);
  assert.equal(isRetryableAiError({ statusCode: 401, message: "invalid api key" }), true);
  assert.equal(isRetryableAiError({ statusCode: 403, message: "upgrade_required" }), true);
  assert.equal(isRetryableAiError({ statusCode: 404, message: "model not found" }), true);
  assert.equal(isRetryableAiError({ statusCode: 503, message: "upstream down" }), true);
  assert.equal(isRetryableAiError({ statusCode: 400, message: "response_format json_schema not supported" }), true);
  assert.equal(isRetryableAiError({ name: "AbortError", message: "aborted" }), true);
  assert.equal(isRetryableAiError({ name: "AI_NoObjectGeneratedError", message: "No object generated: the model did not return a response." }), true);
  assert.equal(isRetryableAiError({ message: "fetch failed: ECONNRESET" }), true);
});

test("not retryable: bad prompt, content filter, invalid model output", () => {
  assert.equal(isRetryableAiError({ statusCode: 400, message: "content blocked by safety filter" }), false);
  assert.equal(isRetryableAiError({ name: "AI_NoObjectGeneratedError", message: "could not parse response" }), false);
  assert.equal(isRetryableAiError({ name: "ZodError", message: "invalid ids" }), false);
  assert.equal(isRetryableAiError(new Error("unexpected")), false);
});
