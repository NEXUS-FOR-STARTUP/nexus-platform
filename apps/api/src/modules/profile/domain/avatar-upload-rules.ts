export const ALLOWED_AVATAR_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

export const MAX_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, readonly string[]> = {
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".png": ["image/png"],
  ".webp": ["image/webp"],
};

export function isAllowedAvatarExtension(extension: string): boolean {
  return (ALLOWED_AVATAR_EXTENSIONS as readonly string[]).includes(
    extension.toLowerCase(),
  );
}

export function isAllowedAvatarMime(extension: string, mimeType?: string): boolean {
  if (!mimeType?.trim()) return true;
  const allowed = MIME_BY_EXTENSION[extension.toLowerCase()];
  return Boolean(allowed?.includes(mimeType.trim().toLowerCase()));
}
