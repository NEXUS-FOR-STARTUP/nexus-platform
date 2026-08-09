import { Hono } from "hono";
import { requireAuth } from "../../../shared/infrastructure/middlewares/auth.js";
import {
  connectionTokenHandler,
  subscriptionTokenHandler,
} from "./realtime.controller.js";

export const realtimeRouter = new Hono();

realtimeRouter.get("/connection-token", requireAuth, connectionTokenHandler);
realtimeRouter.get("/cases/:caseId/subscribe-token", requireAuth, subscriptionTokenHandler);
