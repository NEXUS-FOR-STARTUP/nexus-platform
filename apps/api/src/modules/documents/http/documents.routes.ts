import { Hono } from "hono";
import { requireAuth } from "../../../shared/infrastructure/middlewares/auth.js";
import { uploadDocumentHandler } from "./upload.controller.js";

export const documentsRouter = new Hono();

documentsRouter.post("/upload", requireAuth, uploadDocumentHandler);
