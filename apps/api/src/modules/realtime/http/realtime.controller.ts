import type { Context } from "hono";
import type { AuthEnv } from "../../../shared/infrastructure/middlewares/auth.js";
import { requireCaseAccess } from "../../../shared/infrastructure/authorization.js";
import { handleError } from "../../../shared/infrastructure/http-helpers.js";
import logger from "../../../shared/infrastructure/logger.js";
import {
  signConnectionToken,
  signSubscriptionToken,
  hasCentrifugoSecret,
} from "../infrastructure/centrifugo-token.service.js";

export async function connectionTokenHandler(c: Context<AuthEnv>) {
  const user = c.get("user");
  if (!hasCentrifugoSecret()) {
    logger.error("CENTRIFUGO_TOKEN_SECRET missing — realtime disabled");
    return c.json({ error: "Dịch vụ realtime chưa cấu hình" }, 503);
  }
  try {
    const token = await signConnectionToken(user.id);
    logger.info({ userId: user.id, scope: "connect" }, "realtime token issued");
    return c.json({ token });
  } catch (e) {
    return handleError(c, e);
  }
}

export async function subscriptionTokenHandler(c: Context<AuthEnv>) {
  const caseId = c.req.param("caseId") ?? "";
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) return access.response;
  if (!hasCentrifugoSecret()) {
    logger.error("CENTRIFUGO_TOKEN_SECRET missing — realtime disabled");
    return c.json({ error: "Dịch vụ realtime chưa cấu hình" }, 503);
  }
  try {
    const token = await signSubscriptionToken(access.session.user.id, caseId);
    logger.info({ userId: access.session.user.id, scope: "subscribe", caseId }, "realtime token issued");
    return c.json({ token });
  } catch (e) {
    return handleError(c, e);
  }
}
