import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { auditLogger, type AuditLogEntry } from "../../../shared/infrastructure/audit-logger.js";

export interface RevokeSessionDeps {
  deleteSession?: (sessionId: string, userId: string) => Promise<{ count: number }>;
  logAudit?: (entry: Omit<AuditLogEntry, "timestamp" | "level">) => void;
}

export async function revokeSessionUseCase(
  userId: string,
  targetSessionId: string,
  currentSessionId: string,
  deps?: RevokeSessionDeps
): Promise<{ success: boolean; message: string }> {
  if (!userId || !userId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "User ID không hợp lệ");
  }
  if (!targetSessionId || !targetSessionId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Session ID không hợp lệ");
  }

  if (targetSessionId === currentSessionId) {
    throw new AppError(400, "CANNOT_REVOKE_CURRENT_SESSION", "Không thể thu hồi phiên đăng nhập hiện tại qua tính năng này");
  }

  const deleteFn = deps?.deleteSession ?? ((id, uId) => prisma.session.deleteMany({
    where: {
      id: id,
      user_id: uId,
    },
  }));

  const result = await deleteFn(targetSessionId, userId);

  if (result.count === 0) {
    throw new AppError(404, "SESSION_NOT_FOUND", "Phiên đăng nhập không tồn tại hoặc đã hết hạn");
  }

  const logFn = deps?.logAudit ?? ((entry) => auditLogger.log(entry));
  logFn({
    actor_id: userId,
    actor_role: "user",
    operation: "profile.revoke_session",
    action: "delete",
    resource_type: "session",
    resource_id: targetSessionId,
    metadata: {
      revoked_session_id: targetSessionId,
    },
  });

  return { success: true, message: "Đã thu hồi phiên đăng nhập thành công" };
}
