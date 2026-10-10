import type { Context } from "hono";
import { OpenCheckpointParamsSchema } from "@repo/validation";
import { getSession, handleError } from "../../../shared/infrastructure/http-helpers.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { openCheckpointUseCase } from "../application/open-checkpoint.usecase.js";

// POST /api/cases/:id/checkpoints/:code/open — owner opens CP2 (idempotent)
export async function openCheckpointHandler(c: Context) {
  const session = await getSession(c);
  if (!session) {
    return c.json({ code: "UNAUTHORIZED", message: "Chưa đăng nhập" }, 401);
  }

  try {
    const params = OpenCheckpointParamsSchema.safeParse({ code: c.req.param("code") });
    if (!params.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Checkpoint không hợp lệ");
    }
    const result = await openCheckpointUseCase(session.user.id, c.req.param("id") || "", params.data.code);
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}
