import type { Context } from "hono";
import { handleError } from "../../../shared/infrastructure/http-helpers.js";
import { listNotificationsUseCase } from "../application/list-notifications.usecase.js";
import { getUnreadCountUseCase } from "../application/get-unread-count.usecase.js";
import { markNotificationReadUseCase } from "../application/mark-notification-read.usecase.js";
import { markAllReadUseCase } from "../application/mark-all-read.usecase.js";

// GET /api/notifications?page=&limit=
export async function listNotificationsHandler(c: Context) {
  const user = c.get("user");
  try {
    const page = Number(c.req.query("page") ?? "1");
    const limit = Number(c.req.query("limit") ?? "20");
    const result = await listNotificationsUseCase(user.id, page, limit);
    return c.json(result);
  } catch (error) {
    return handleError(c, error);
  }
}

// GET /api/notifications/unread-count
export async function getUnreadCountHandler(c: Context) {
  const user = c.get("user");
  try {
    const count = await getUnreadCountUseCase(user.id);
    return c.json({ count });
  } catch (error) {
    return handleError(c, error);
  }
}

// PATCH /api/notifications/:id/read
export async function markReadHandler(c: Context) {
  const user = c.get("user");
  try {
    const id = c.req.param("id") ?? "";
    const result = await markNotificationReadUseCase(user.id, id);
    if (!result.ok) return c.json({ ok: false }, 404);
    return c.json({ ok: true });
  } catch (error) {
    return handleError(c, error);
  }
}

// PATCH /api/notifications/read-all
export async function markAllReadHandler(c: Context) {
  const user = c.get("user");
  try {
    const result = await markAllReadUseCase(user.id);
    return c.json(result);
  } catch (error) {
    return handleError(c, error);
  }
}
