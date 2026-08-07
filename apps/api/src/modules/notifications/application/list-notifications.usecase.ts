import { AppError } from "../../../shared/domain/app-error.js";
import { countNotifications, listNotifications } from "../infrastructure/persistence/notification.repository.js";

export async function listNotificationsUseCase(userId: string, page = 1, limit = 20) {
  const safePage = Math.floor(page);
  const safeLimit = Math.floor(limit);

  if (!Number.isFinite(safePage) || safePage < 1) {
    throw new AppError(400, "VALIDATION_ERROR", "page phải >= 1");
  }
  if (!Number.isFinite(safeLimit) || safeLimit < 1 || safeLimit > 50) {
    throw new AppError(400, "VALIDATION_ERROR", "limit phải trong khoảng 1-50");
  }

  const [items, total] = await Promise.all([
    listNotifications(userId, safePage, safeLimit),
    countNotifications(userId),
  ]);

  return {
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      read_at: n.read_at?.toISOString() ?? null,
      created_at: n.created_at.toISOString(),
    })),
    total,
    page: safePage,
    limit: safeLimit,
  };
}
