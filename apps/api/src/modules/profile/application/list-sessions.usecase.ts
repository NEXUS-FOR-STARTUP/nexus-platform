import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import type { ActiveSessionDto } from "@repo/validation";

export interface ListSessionsDeps {
  findSessions?: (userId: string) => Promise<Array<{
    id: string;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
    expires_at: Date;
  }>>;
}

export async function listSessionsUseCase(
  userId: string,
  currentSessionId: string,
  deps?: ListSessionsDeps
): Promise<ActiveSessionDto[]> {
  if (!userId || !userId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "User ID không hợp lệ");
  }

  const sessions = deps?.findSessions
    ? await deps.findSessions(userId)
    : await prisma.session.findMany({
        where: {
          user_id: userId,
          expires_at: { gt: new Date() },
        },
        take: 100,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          ip_address: true,
          user_agent: true,
          created_at: true,
          expires_at: true,
        },
      });

  return sessions.map((s) => ({
    id: s.id,
    ipAddress: s.ip_address,
    userAgent: s.user_agent,
    createdAt: s.created_at,
    expiresAt: s.expires_at,
    isCurrent: s.id === currentSessionId,
  }));
}
