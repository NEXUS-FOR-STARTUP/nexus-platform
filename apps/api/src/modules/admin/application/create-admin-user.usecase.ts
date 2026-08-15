import { auth } from "../../../auth.js";
import { emailService, renderEmailHtml } from "../../notifications/infrastructure/email.service.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function createAdminUserUseCase(
  email: string,
  name: string,
  role: string,
  headers: Headers,
) {
  const safeRole = (role === "admin" || role === "user") ? role : "user";
  // Auto-generate secure random password
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const password = "Nx@" + Array.from(bytes).map((b) => chars[b % chars.length]).join("");

  const newUser = await auth.api.createUser({
    body: { email, password, name, role: safeRole || "user" },
    headers,
  });

  // Send welcome email with credentials
  const emailBody = [
    `Chào ${name},`,
    "",
    "Tài khoản của bạn trên Nexus Platform đã được tạo bởi quản trị viên.",
    "",
    `Email: ${email}`,
    `Mật khẩu: ${password}`,
    "",
    "Vui lòng đăng nhập và đổi mật khẩu ngay sau khi đăng nhập lần đầu.",
  ].join("\n");

  const html = renderEmailHtml(
    "Tài khoản Nexus Platform của bạn đã được tạo",
    emailBody,
    "/auth",
  );

  await emailService.send(
    email,
    "Tài khoản Nexus Platform - Thông tin đăng nhập",
    html,
    `create-user-${newUser.user?.id ?? Date.now()}`,
  );

  logger.info({ userId: newUser.user?.id, email }, "Admin created user account");

  return { success: true, userId: newUser.user?.id };
}
