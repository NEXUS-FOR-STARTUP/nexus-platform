import { auth } from "../../auth.js";
import { AppError } from "../domain/app-error.js";
import logger from "./logger.js";

/**
 * Get the authenticated session from the request context.
 * Returns null if not authenticated or on error.
 */
export async function getSession(c: any) {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    return session;
  } catch (error) {
    logger.error({ err: error }, 'getSession failed');
    return null;
  }
}

/**
 * Safely parse the request body as JSON.
 * Returns null if the body is missing or malformed.
 */
export async function readJsonBody(c: any) {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}

/**
 * Trims a string value and returns it only if it meets a minimum length.
 * Otherwise returns an empty string.
 */
export function asNonEmptyString(value: unknown, min = 1): string {
  return typeof value === "string" && value.trim().length >= min
    ? value.trim()
    : "";
}

/**
 * Shared error handler for controllers.
 * Maps AppErrors to RESTful JSON responses, and logs/returns 500 for unhandled errors.
 */
export function handleError(c: any, e: unknown) {
  if (e instanceof AppError) {
    logger.warn({ err: e, code: e.code, status: e.status }, 'handleError: app error');
    return c.json(
      {
        code: e.code,
        message: e.message,
        ...(e.details ? { details: e.details } : {}),
      },
      e.status,
    );
  }
  const msg = e instanceof Error ? e.message : String(e);
  const stack = e instanceof Error ? e.stack : undefined;
  logger.error({ err: e, code: 'INTERNAL_ERROR' }, `handleError: unhandled controller error — ${msg}`);
  console.error('[handleError]', msg, stack ?? '');
  return c.json({ code: "INTERNAL_ERROR", message: "Lỗi hệ thống" }, 500);
}
