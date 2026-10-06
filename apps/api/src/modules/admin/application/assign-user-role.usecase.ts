import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import { auditLogger } from "../../../shared/infrastructure/audit-logger.js";
import logger from "../../../shared/infrastructure/logger.js";

const VALID_ROLES = ["user", "supporter", "writer", "admin"] as const;
export type AssignableRole = (typeof VALID_ROLES)[number];

export async function assignUserRoleUseCase(
  adminId: string,
  targetUserId: string,
  newRole: string,
) {
  const normalizedRole = (newRole || "").toLowerCase().trim();

  if (!VALID_ROLES.includes(normalizedRole as AssignableRole)) {
    throw new AppError(
      400,
      "INVALID_ROLE",
      `Vai trò không hợp lệ. Chỉ chấp nhận: ${VALID_ROLES.join(", ")}`,
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!targetUser) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy người dùng");
  }

  if (targetUser.role?.toLowerCase() === "system" || targetUser.email === "system@nexus.internal") {
    throw new AppError(403, "FORBIDDEN", "Không thể thay đổi vai trò của tài khoản hệ thống");
  }

  // Chặn tự hạ quyền admin của chính mình
  if (adminId === targetUserId && normalizedRole !== "admin") {
    throw new AppError(
      400,
      "CANNOT_DEMOTE_SELF",
      "Không thể tự hạ vai trò quản trị (Admin) của chính mình",
    );
  }

  const oldRole = targetUser.role || "user";

  // Nếu vai trò không thay đổi, trả về kết quả luôn
  if (oldRole === normalizedRole) {
    return {
      success: true,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    };
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      role: normalizedRole,
      updated_at: new Date(),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      updated_at: true,
    },
  });

  // Nếu bị hạ quyền từ admin xuống supporter hoặc user, thu hồi các session hiện tại để bắt đăng nhập lại
  if (oldRole === "admin" && normalizedRole !== "admin") {
    try {
      await prisma.session.deleteMany({
        where: { user_id: targetUserId },
      });
    } catch (sessionErr) {
      logger.warn({ targetUserId, error: sessionErr }, "Failed to revoke sessions on demotion");
    }
  }

  auditLogger.log({
    operation: "admin.assign_user_role",
    actor_id: adminId,
    actor_role: "admin",
    resource_type: "user",
    resource_id: targetUserId,
    action: "update",
    old_state: { role: oldRole },
    new_state: { role: normalizedRole },
    metadata: {
      target_email: targetUser.email,
      target_name: targetUser.name,
    },
  });

  logger.info(
    { adminId, targetUserId, oldRole, newRole: normalizedRole },
    "Admin assigned user role successfully",
  );

  return {
    success: true,
    user: updatedUser,
  };
}
