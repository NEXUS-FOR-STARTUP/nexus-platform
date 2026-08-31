// Better Auth English → Vietnamese error translation (shared by auth pages).
// Chuyển nguyên `translateError` từ profile page cũ sang đây để tái dùng.
export function translateAuthError(message?: string): string {
  if (!message) return "Đã có lỗi xảy ra. Vui lòng thử lại.";
  if (message.startsWith("ACCOUNT_LOCKED_TEMPORARY")) {
    const seconds = message.split(":")[1];
    return seconds
      ? `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${seconds} giây.`
      : "Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ít phút.";
  }
  const map: Record<string, string> = {
    "invalid password": "Mật khẩu hiện tại không đúng.",
    "password is too weak": "Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn.",
    "password is too short": "Mật khẩu phải có ít nhất 8 ký tự.",
    "password_too_short": "Mật khẩu phải có ít nhất 8 ký tự.",
    "password_already_set": "Tài khoản đã có mật khẩu.",
    "email_not_verified": "Email chưa xác minh. Quay lại và chọn Đăng nhập OTP.",
    "email not verified": "Email chưa xác minh. Quay lại và chọn Đăng nhập OTP.",
    "password_auth_disabled": "Đăng ký mật khẩu trực tiếp đã tắt. Dùng Đăng nhập OTP.",
    "user not found": "Không tìm thấy người dùng.",
    "invalid email or password": "Email hoặc mật khẩu không đúng.",
    "email_already_verified": "Email đã được xác minh. Vui lòng đăng nhập.",
    "already verified": "Email đã được xác minh. Vui lòng đăng nhập.",
    "invalid otp": "Mã xác minh không đúng. Vui lòng kiểm tra lại.",
    "otp expired": "Mã xác minh đã hết hạn. Vui lòng gửi lại mã mới.",
    "too many attempts": "Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.",
    "too many requests": "Bạn thao tác quá nhanh. Vui lòng thử lại sau giây lát.",
    "rate limit": "Bạn thao tác quá nhanh. Vui lòng thử lại sau giây lát.",
  };
  const lower = message.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (lower.includes(key)) return value;
  }
  return "Đã có lỗi xảy ra. Vui lòng thử lại.";
}
