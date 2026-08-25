import type { Context } from "hono";
import { handleError } from "../../../shared/infrastructure/http-helpers.js";
import type { AuthEnv } from "../../../shared/infrastructure/middlewares/auth.js";
import { MAX_AVATAR_FILE_SIZE_BYTES } from "../domain/avatar-upload-rules.js";
import { uploadAvatarUseCase } from "../application/upload-avatar.usecase.js";

const MAX_AVATAR_MULTIPART_BYTES = MAX_AVATAR_FILE_SIZE_BYTES + 64 * 1024;

export async function uploadAvatarHandler(c: Context<AuthEnv>) {
  try {
    const user = c.get("user");
    const contentLength = Number(c.req.header("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_AVATAR_MULTIPART_BYTES) {
      return c.json(
        { code: "FILE_TOO_LARGE", message: "Dung lượng ảnh tối đa là 2MB" },
        400,
      );
    }

    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || typeof file === "string") {
      return c.json(
        { code: "VALIDATION_ERROR", message: "Thiếu tệp tải lên" },
        400,
      );
    }

    const result = await uploadAvatarUseCase(user.id, file);
    return c.json({ url: result.url, publicId: result.publicId }, 201);
  } catch (error) {
    return handleError(c, error);
  }
}
