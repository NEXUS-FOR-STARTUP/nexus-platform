import { generateObject } from 'ai'
import type { z } from 'zod'
import logger from '../shared/infrastructure/logger.js'
import type { StartModelChoice } from './start-model.js'

// One retry, primary then fallback. Retry only provider/transport failures:
// a bad prompt or content filter must surface instead of silently costing a second call.

// Primary and fallback use different credentials, so an auth failure on the primary must fall back.
const RETRYABLE_STATUS_CODES = new Set([401, 403, 404, 408, 409, 425, 429, 500, 502, 503, 504])
/** An upstream that cannot honour structured output is a capability gap, not a bad prompt. */
const FORMAT_MISMATCH = /response_format|json_schema|structured output|not supported/i
/** Provider answered with nothing at all (not with invalid JSON): a transport-level failure. */
const EMPTY_PROVIDER_RESPONSE = /did not return a response|empty response/i
const TRANSPORT_FAILURE = /ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|fetch failed|socket hang up|network error|aborted|timed out|timeout/i

export function isRetryableAiError(error: unknown): boolean {
  const { statusCode, name, message } = error as { statusCode?: number; name?: string; message?: string }
  const text = message ?? ''

  if (typeof statusCode === 'number') {
    if (RETRYABLE_STATUS_CODES.has(statusCode)) return true
    return statusCode === 400 && FORMAT_MISMATCH.test(text)
  }
  if (name === 'AbortError' || name === 'TimeoutError') return true
  if (name === 'AI_NoObjectGeneratedError') return EMPTY_PROVIDER_RESPONSE.test(text)
  return TRANSPORT_FAILURE.test(text)
}

export interface FallbackGenerateParams<T> {
  kind: string
  choice: StartModelChoice
  schema: z.ZodType<T>
  system: string
  prompt: string
  temperature?: number
  maxOutputTokens?: number
  /** Per attempt, not shared between attempts. */
  timeoutMs: number
  /** Optional shorter budget for the fallback, so a slow primary plus fallback still fits the client. */
  fallbackTimeoutMs?: number
}

export async function generateObjectWithFallback<T>(
  params: FallbackGenerateParams<T>,
): Promise<{ object: T; provider: string }> {
  const { kind, choice, schema, system, prompt, temperature, maxOutputTokens, timeoutMs, fallbackTimeoutMs } = params
  const factories = choice.primary ? [choice.primary, choice.fallback] : [choice.fallback]
  const startedAt = Date.now()
  let lastError: unknown

  for (const [index, factory] of factories.entries()) {
    const candidate = factory()
    const attemptTimeoutMs = index === 0 ? timeoutMs : (fallbackTimeoutMs ?? timeoutMs)

    try {
      const { object } = await generateObject({
        model: candidate.model,
        schema,
        system,
        prompt,
        temperature,
        maxOutputTokens,
        abortSignal: AbortSignal.timeout(attemptTimeoutMs),
      })

      logger.info(
        { kind, provider: candidate.label, fellBack: index > 0, duration_ms: Date.now() - startedAt },
        'AI call succeeded',
      )
      return { object, provider: candidate.label }
    } catch (error) {
      lastError = error
      const retryable = isRetryableAiError(error)
      logger.warn(
        { kind, provider: candidate.label, retryable, err: error, duration_ms: Date.now() - startedAt },
        'AI call failed',
      )
      if (!retryable || index === factories.length - 1) throw error
    }
  }

  throw lastError
}
