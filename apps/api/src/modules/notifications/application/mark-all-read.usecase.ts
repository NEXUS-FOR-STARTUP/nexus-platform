import { markAllRead } from "../infrastructure/persistence/notification.repository.js";

export async function markAllReadUseCase(userId: string) {
  const updated = await markAllRead(userId);
  return { updated };
}
