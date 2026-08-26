import { Hono } from "hono";
import { requireAuth } from "../../../shared/infrastructure/middlewares/auth.js";
import { uploadAvatarHandler } from "./avatar.controller.js";

export const profileRouter = new Hono();

profileRouter.post("/avatar", requireAuth, uploadAvatarHandler);
