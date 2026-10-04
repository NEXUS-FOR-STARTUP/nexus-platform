import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { auditLogger, type AuditLogEntry } from "../../../shared/infrastructure/audit-logger.js";

export interface RevokeOtherSessionsDeps {
  deleteOtherSessions?: (userId: string, currentSessionId: string) => Promise<{ count: number }>;
  logAudit?: (entry: Omit<AuditLogEntry, "timestamp" | "level">) => void;
}

export async function revokeOtherSessionsUseCase(
  userId: string,
  currentSessionId: string,
  deps?: RevokeOtherSessionsDeps
): Promise<{ success: boolean; count: number; message: string }> {
  if (!userId || !userId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "User ID không hợp lệ");
  }
  if (!currentSessionId || typeof currentSessionId !== "string" || !currentSessionId.trim()) {
    throw new AppError(500, "INVALID_SESSION_CONTEXT", "Không xác định được phiên đăng nhập hiện tại");
  }

  const deleteFn = deps?.deleteOtherSessions ?? ((uId, currId) => prisma.session.deleteMany({
    where: {
      user_id: uId,
      id: { not: currId },
    },
  }));

  const result = await deleteFn(userId, currentSessionId);

  const logFn = deps?.logAudit ?? ((entry) => auditLogger.log(entry));
  logFn({
    actor_id: userId,
    actor_role: "user",
    operation: "profile.revoke_other_sessions",
    action: "delete",
    resource_type: "session",
    metadata: {
      current_session_id: currentSessionId,
      revoked_count: result.count,
    },
  });

  return {
    success: true,
    count: result.count,
    message: `Đã đăng xuất khỏi ${result.count} thiết bị khác thành công`,
  };
}
