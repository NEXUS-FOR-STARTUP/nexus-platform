import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import { emailService, renderEmailHtml, escapeHtml } from "../../notifications/infrastructure/email.service.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function banUserUseCase(userId: string, banReason?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy người dùng");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { banned: true, ban_reason: banReason ?? null, updated_at: new Date() },
  });

  // Revoke all active sessions
  await prisma.session.deleteMany({ where: { user_id: userId } });

  // Send email notification
  if (user.email) {
    const reasonText = banReason ? ` với lý do: <strong>${escapeHtml(banReason)}</strong>` : "";
    const html = renderEmailHtml(
      "Tài khoản của bạn đã bị khóa",
      `Tài khoản của bạn trên Nexus Platform đã bị khóa${reasonText}. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là sự nhầm lẫn.`,
      null,
    );

    await emailService.send(
      user.email,
      "Tài khoản bị khóa - Nexus Platform",
      html,
      `ban-${userId}-${Date.now()}`,
    );
  }

  logger.info({ userId, ban_reason: banReason }, "Admin banned user");

  return { success: true };
}
