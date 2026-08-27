import { Hono } from "hono";
import { requireAuth } from "../../../shared/infrastructure/middlewares/auth.js";
import { uploadAvatarHandler } from "./avatar.controller.js";
import { deleteAccountHandler } from "./profile.controller.js";
import {
  listSessionsHandler,
  revokeSessionHandler,
  revokeOtherSessionsHandler,
} from "./session.controller.js";

export const profileRouter = new Hono();

profileRouter.post("/avatar", requireAuth, uploadAvatarHandler);
profileRouter.delete("/account", requireAuth, deleteAccountHandler);

profileRouter.get("/sessions", requireAuth, listSessionsHandler);
profileRouter.delete("/sessions/:id", requireAuth, revokeSessionHandler);
profileRouter.post("/sessions/revoke-others", requireAuth, revokeOtherSessionsHandler);
