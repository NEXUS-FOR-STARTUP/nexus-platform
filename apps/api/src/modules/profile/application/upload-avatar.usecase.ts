import path from "node:path";
import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import { prisma } from "../../../db.js";
import {
  uploadFile,
  deleteFile,
  extractPublicId,
} from "../../../services/cloudinary.js";
import {
  MAX_AVATAR_FILE_SIZE_BYTES,
  isAllowedAvatarExtension,
  isAllowedAvatarMime,
} from "../domain/avatar-upload-rules.js";

export type AvatarFile = {
  name: string;
  size: number;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type UploadAvatarResult = {
  url: string;
  publicId: string;
};

type UploadAvatarDeps = {
  uploadFile?: typeof uploadFile;
  deleteFile?: typeof deleteFile;
  extractPublicId?: typeof extractPublicId;
  findUserImage?: (userId: string) => Promise<string | null>;
  updateUserImage?: (userId: string, image: string) => Promise<void>;
};

const CLOUDINARY_FOLDER = "nexus-platform/avatars";
const AVATAR_RESOURCE_TYPE = "image";
const AVATAR_PUBLIC_ID_EXT = /\.(jpe?g|png|webp)$/i;

function normalizeAvatarPublicId(publicId: string | null): string | null {
  if (!publicId) return null;
  return publicId.replace(AVATAR_PUBLIC_ID_EXT, "");
}

function normalizeExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

export function validateAvatarFile(file: AvatarFile) {
  const extension = normalizeExtension(file.name);
  if (!isAllowedAvatarExtension(extension)) {
    throw new AppError(
      400,
      "INVALID_FILE_TYPE",
      "Chỉ hỗ trợ ảnh .jpg, .jpeg, .png hoặc .webp",
    );
  }

  if (!isAllowedAvatarMime(extension, file.type)) {
    throw new AppError(
      400,
      "INVALID_FILE_TYPE",
      "Định dạng ảnh không khớp với phần mở rộng tệp",
    );
  }

  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    throw new AppError(400, "FILE_TOO_LARGE", "Dung lượng ảnh tối đa là 2MB");
  }

  return extension;
}

function generateAvatarPublicId(userId: string): string {
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "user";
  const randomChars = crypto.randomBytes(3).toString("hex");
  return `user-${safeUserId}-${randomChars}`;
}

async function defaultFindUserImage(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy người dùng");
  }
  return user.image;
}

async function defaultUpdateUserImage(userId: string, image: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { image },
  });
}

export async function uploadAvatarUseCase(
  userId: string,
  file: AvatarFile,
  deps: UploadAvatarDeps = {},
): Promise<UploadAvatarResult> {
  validateAvatarFile(file);

  const upload = deps.uploadFile ?? uploadFile;
  const remove = deps.deleteFile ?? deleteFile;
  const extract = deps.extractPublicId ?? extractPublicId;
  const findUserImage = deps.findUserImage ?? defaultFindUserImage;
  const updateUserImage = deps.updateUserImage ?? defaultUpdateUserImage;

  const previousImage = await findUserImage(userId);
  const buffer = Buffer.from(await file.arrayBuffer());
  const publicId = generateAvatarPublicId(userId);

  const uploaded = await upload(buffer, CLOUDINARY_FOLDER, publicId, AVATAR_RESOURCE_TYPE);

  try {
    await updateUserImage(userId, uploaded.fileUrl);
  } catch (error) {
    await remove(uploaded.publicId, AVATAR_RESOURCE_TYPE);
    if (error instanceof AppError) throw error;
    logger.error({ err: error, userId }, "Avatar DB update failed after Cloudinary upload");
    throw new AppError(500, "AVATAR_UPDATE_ERROR", "Không thể cập nhật ảnh đại diện");
  }

  const previousPublicId = normalizeAvatarPublicId(
    previousImage ? extract(previousImage) : null,
  );
  if (previousPublicId && previousPublicId !== uploaded.publicId) {
    await remove(previousPublicId, AVATAR_RESOURCE_TYPE);
  }

  return { url: uploaded.fileUrl, publicId: uploaded.publicId };
}
