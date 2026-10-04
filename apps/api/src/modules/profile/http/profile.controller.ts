import type { Context } from "hono";
import { handleError } from "../../../shared/infrastructure/http-helpers.js";
import type { AuthEnv } from "../../../shared/infrastructure/middlewares/auth.js";
import { deleteAccountUseCase } from "../application/delete-account.usecase.js";

export async function deleteAccountHandler(c: Context<AuthEnv>) {
  try {
    const user = c.get("user");
    const result = await deleteAccountUseCase(user.id);
    return c.json(result, 200);
  } catch (error) {
    return handleError(c, error);
  }
}
