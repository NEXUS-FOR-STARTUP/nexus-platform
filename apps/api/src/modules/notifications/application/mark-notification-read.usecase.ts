import { markRead } from "../infrastructure/persistence/notification.repository.js";

export async function markNotificationReadUseCase(userId: string, notificationId: string) {
  if (!notificationId || typeof notificationId !== "string" || !notificationId.trim()) {
    return { ok: false };
  }

  const count = await markRead(userId, notificationId.trim());
  // false khi không phải của user — không throw, tránh leak existence
  return { ok: count > 0 };
}
