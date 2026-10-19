export const ALLOWED_AVATAR_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
export const MAX_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024;
export const AVATAR_LIMIT_NOTE = "Tối đa 2MB (.jpg, .jpeg, .png, .webp)";

export function validateAvatarFile(file: File) {
  const dot = file.name.lastIndexOf(".");
  const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
  if (!ALLOWED_AVATAR_EXTENSIONS.includes(extension)) {
    throw new Error("Chỉ hỗ trợ ảnh .jpg, .jpeg, .png hoặc .webp");
  }
  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    throw new Error("Dung lượng ảnh tối đa là 2MB");
  }
}
