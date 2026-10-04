import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import { emailService, renderEmailHtml } from "../../notifications/infrastructure/email.service.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function unbanUserUseCase(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy người dùng");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { banned: false, ban_reason: null, ban_expires: null, updated_at: new Date() },
  });

  // Send email notification
  if (user.email) {
    const html = renderEmailHtml(
      "Tài khoản của bạn đã được mở khóa",
      "Tài khoản của bạn trên Nexus Platform đã được mở khóa. Bạn có thể đăng nhập và sử dụng bình thường.",
      null,
    );

    await emailService.send(
      user.email,
      "Tài khoản đã mở khóa - Nexus Platform",
      html,
      `unban-${userId}-${Date.now()}`,
    );
  }

  logger.info({ userId }, "Admin unbanned user");

  return { success: true };
}
