import { getUnreadCount } from "../infrastructure/persistence/notification.repository.js";

export async function getUnreadCountUseCase(userId: string) {
  return await getUnreadCount(userId);
}
