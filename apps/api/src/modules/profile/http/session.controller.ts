import type { Context } from "hono";
import { handleError } from "../../../shared/infrastructure/http-helpers.js";
import type { AuthEnv } from "../../../shared/infrastructure/middlewares/auth.js";
import { listSessionsUseCase } from "../application/list-sessions.usecase.js";
import { revokeSessionUseCase } from "../application/revoke-session.usecase.js";
import { revokeOtherSessionsUseCase } from "../application/revoke-other-sessions.usecase.js";

export async function listSessionsHandler(c: Context<AuthEnv>) {
  try {
    const user = c.get("user");
    const session = c.get("session");
    const sessions = await listSessionsUseCase(user.id, session.id);
    return c.json({ data: sessions }, 200);
  } catch (error) {
    return handleError(c, error);
  }
}

export async function revokeSessionHandler(c: Context<AuthEnv>) {
  try {
    const user = c.get("user");
    const session = c.get("session");
    const targetSessionId = c.req.param("id") || "";
    const result = await revokeSessionUseCase(user.id, targetSessionId, session.id);
    return c.json(result, 200);
  } catch (error) {
    return handleError(c, error);
  }
}

export async function revokeOtherSessionsHandler(c: Context<AuthEnv>) {
  try {
    const user = c.get("user");
    const session = c.get("session");
    const result = await revokeOtherSessionsUseCase(user.id, session.id);
    return c.json(result, 200);
  } catch (error) {
    return handleError(c, error);
  }
}
