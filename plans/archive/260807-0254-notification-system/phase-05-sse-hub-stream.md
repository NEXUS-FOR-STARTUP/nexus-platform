# Phase 05 — SSE Hub + Stream

**Effort:** 2.5h

## Việc

SSE hub (in-memory, 1 instance) + `GET /api/notifications/stream`. Ping client khi có notification mới → client refetch. Heartbeat chống timeout.

## Files

### 1. `apps/api/src/modules/notifications/infrastructure/sse-hub.ts`

```ts
import type { SSEStreamingApi } from "hono/streaming";

type Client = { stream: SSEStreamingApi; userId: string };

const MAX_CONNECTIONS_PER_USER = 5;  // chống DoS — mở vô hạn connection

// Map<userId, Set<Client>> — 1 user nhiều tab
const connections = new Map<string, Set<Client>>();

export function hasCapacity(userId: string): boolean {
  return (connections.get(userId)?.size ?? 0) < MAX_CONNECTIONS_PER_USER;
}
export function addConnection(userId: string, stream: SSEStreamingApi): boolean {
  const userConns = connections.get(userId) ?? new Set<Client>();
  if (userConns.size >= MAX_CONNECTIONS_PER_USER) return false;  // quá cap → từ chối
  userConns.add({ stream, userId });
  connections.set(userId, userConns);
  return true;
}
export function removeConnection(userId: string, stream: SSEStreamingApi): void  // cleanup 2 chiều

export async function ping(userId: string): Promise<void> {
  const userConns = connections.get(userId);
  if (!userConns) return;
  for (const client of userConns) {
    try {
      await client.stream.writeSSE({ event: "ping", data: JSON.stringify({ at: Date.now() }) });
    } catch {
      removeConnection(userId, client.stream);  // write fail = connection chết
    }
  }
}
```

`stream.writeSSE` ném khi client mất kết nối — catch + cleanup ngay.

### 2. Route `GET /api/notifications/stream` — `notifications.routes.ts`

```ts
notificationsRouter.get("/stream", requireAuth, async (c) => {
  const user = c.get("user");
  // KHÔNG set X-Accel-Buffering — nginx-specific, hệ dùng Traefik (không buffer mặc định)
  c.header("Cache-Control", "no-cache, no-transform");
  c.header("Content-Type", "text/event-stream");

  // Cap 5/user — chống DoS. Check TRƯỚC streamSSE (không thể trả JSON trong streaming callback)
  if (!hasCapacity(user.id)) return c.json({ error: "Quá nhiều kết nối" }, 429);

  return streamSSE(c, async (stream) => {
    if (!addConnection(user.id, stream)) return;  // race hiếm — 2 mở cùng lúc vượt cap 1: bỏ qua, không đăng ký
    try {
      await stream.writeSSE({ event: "connected", data: "{}", retry: 5000 });  // retry field
      while (!stream.aborted) {
        await stream.writeSSE({ event: "", data: "hb" });  // heartbeat mỗi 25s
        await stream.sleep(25_000);
      }
    } finally {
      removeConnection(user.id, stream);
    }
  });
});
```

**Heartbeat:** dòng comment (data "hb") — browser bỏ qua, proxy coi là traffic. Client onmessage check `e.data === "hb"` → ignore.

**Chuẩn (điều chỉnh theo Traefik — không nginx):**
- Heartbeat 25s — chống entrypoint timeout Traefik external nếu < 60s
- `retry: 5000` — EventSource tự reconnect sau 5s
- Traefik không buffer mặc định — không cần config chống buffer. Nhưng phải tách router stream khỏi middleware `compress` (phase 08)
- `stream.aborted` check — dừng loop khi client thoát
- Không cần Last-Event-ID replay — client refetch REST sau ping

**Auth:** `requireAuth` — đọc session qua cookie (EventSource không gửi được header Authorization). CORS `credentials: true` đã có. Client dùng `EventSource(url, { withCredentials: true })`.

**Import:** `streamSSE`, `SSEStreamingApi` từ `hono/streaming` — codebase đã dùng.

## Verify

- [ ] `npm run check-types --workspace=apps/api` pass
- [ ] Local: 2 tab cùng user → ping nhận ở cả 2; đóng tab → cleanup
- [ ] Deploy: curl stream → không có Content-Encoding gzip (phase 08)

## Chốt

- Ping đúng user, không gửi user khác
- Heartbeat mỗi 25s giữ connection
- Cleanup khi client mất kết nối
