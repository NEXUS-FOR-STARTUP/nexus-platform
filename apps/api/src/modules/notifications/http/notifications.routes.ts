import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { requireAuth, type AuthEnv } from "../../../shared/infrastructure/middlewares/auth.js";
import { streamSSE } from "hono/streaming";
import { hasCapacity, addConnection, removeConnection } from "../infrastructure/sse-hub.js";
import {
  listNotificationsHandler,
  getUnreadCountHandler,
  markReadHandler,
  markAllReadHandler,
  getPreferencesHandler,
  updatePreferencesHandler,
} from "./notifications.controller.js";

export const notificationsRouter = new Hono();

notificationsRouter.get("/", requireAuth, listNotificationsHandler);
notificationsRouter.get("/unread-count", requireAuth, getUnreadCountHandler);
notificationsRouter.get("/preferences", requireAuth, getPreferencesHandler);
notificationsRouter.put("/preferences", requireAuth, updatePreferencesHandler);
notificationsRouter.patch("/:id/read", requireAuth, markReadHandler);
notificationsRouter.patch("/read-all", requireAuth, markAllReadHandler);

// GET /api/notifications/stream — SSE (phase 05)
notificationsRouter.get("/stream", requireAuth, async (c: HonoContext<AuthEnv>) => {
  const user = c.get("user");
  // Traefik không buffer mặc định — không cần X-Accel-Buffering (nginx-specific)
  c.header("Cache-Control", "no-cache, no-transform");
  c.header("Content-Type", "text/event-stream");

  // Cap 5/user — chống DoS. Check TRƯỚC streamSSE (không thể trả JSON trong streaming callback)
  if (!hasCapacity(user.id)) return c.json({ error: "Quá nhiều kết nối" }, 429);

  return streamSSE(c, async (stream) => {
    if (!addConnection(user.id, stream)) return; // race hiếm — vượt cap: không đăng ký
    try {
      await stream.writeSSE({ event: "connected", data: "{}", retry: 5000 });
      while (!stream.aborted) {
        await stream.writeSSE({ event: "", data: "hb" }); // heartbeat mỗi 25s
        await stream.sleep(25_000);
      }
    } finally {
      removeConnection(user.id, stream);
    }
  });
});
