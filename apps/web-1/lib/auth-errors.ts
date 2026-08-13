// Better Auth English → Vietnamese error translation (shared by auth pages).
// Chuyển nguyên `translateError` từ profile page cũ sang đây để tái dùng.
export function translateAuthError(message?: string): string {
  if (!message) return "";
  const map: Record<string, string> = {
    "invalid password": "Mật khẩu hiện tại không đúng.",
    "password is too weak": "Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn.",
    "user not found": "Không tìm thấy người dùng.",
    "invalid email or password": "Email hoặc mật khẩu không đúng.",
    "too many requests": "Bạn thao tác quá nhanh. Vui lòng thử lại sau giây lát.",
    "rate limit": "Bạn thao tác quá nhanh. Vui lòng thử lại sau giây lát.",
  };
  const lower = message.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (lower.includes(key)) return value;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
