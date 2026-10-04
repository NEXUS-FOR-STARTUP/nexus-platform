# Phase 03 — Notifications Module Core

**Effort:** 3h

## Việc

Module `notifications` theo clean architecture (domain/application/infrastructure/http).

Phase này: inbox API (đọc + mark-read). Phase 04: phần ghi (listener/relay).

## Files

### 1. `apps/api/src/modules/notifications/domain/notification.types.ts`

```ts
export const VALID_NOTIFICATION_TYPES = [
  "case_assigned", "case_approved", "case_rejected",
  "payment_proof_uploaded", "payment_verified", "payment_rejected",
  "case_stage_changed", "report_published", "request_more_info",
] as const;

export type NotificationType = (typeof VALID_NOTIFICATION_TYPES)[number];
export type NotificationChannel = "in_app" | "email" | "telegram";
export const OUTBOX_STATUS = ["pending", "processing", "sent", "failed"] as const;
export type OutboxStatus = (typeof OUTBOX_STATUS)[number];
```

### 2. `apps/api/src/modules/notifications/infrastructure/persistence/notification.repository.ts`

Flat exported functions (pattern `payment.repository.ts`):

```ts
listNotifications(userId, { page, limit })   // where user_id, orderBy created_at desc, skip/take
getUnreadCount(userId)                        // count where user_id + read_at null
markRead(userId, notificationId)              // updateMany where id + user_id → count; 0 = không phải của user
markAllRead(userId)                           // updateMany where user_id + read_at null
insertNotification(data)                      // relay dùng — { userId, type, title, body, link, caseId, metadataJson }
```

**Security:** Mọi query filter `user_id` từ session. Không nhận userId từ body/param. Không cho user đọc của người khác.

### 3. `apps/api/src/modules/notifications/application/notifications.dto.ts`

```ts
export interface ListNotificationsResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
}
export interface NotificationItem {
  id: string; type: string; title: string; body: string | null;
  link: string | null; readAt: string | null; createdAt: string;
}
```

### 4. Usecases (4 file)

- `list-notifications.usecase.ts` — `(userId, page = 1, limit = 20)`; page ≥1, limit ≤50
- `get-unread-count.usecase.ts` — `(userId) → number`
- `mark-notification-read.usecase.ts` — `(userId, notificationId)`; trả `{ ok }` — false nếu không phải của user, KHÔNG throw (tránh leak existence)
- `mark-all-read.usecase.ts` — `(userId) → { updated }`

Không cần DI. Test qua DB (pattern codebase: usecase không deps → test DB thật).

### 5. `apps/api/src/modules/notifications/http/notifications.routes.ts` + `notifications.controller.ts`

```ts
export const notificationsRouter = new Hono();

notificationsRouter.get("/", listNotificationsHandler);              // ?page=&limit=
notificationsRouter.get("/unread-count", getUnreadCountHandler);
notificationsRouter.patch("/:id/read", markReadHandler);
notificationsRouter.patch("/read-all", markAllReadHandler);
// GET /stream — phase 05
```

Auth: `requireAuth` middleware (pattern ai-engine.routes). Controller: `getSession(c)` + `handleError(c, e)` từ `http-helpers.ts`.

Mount ở `apps/api/src/index.ts`:
```ts
import { notificationsRouter } from './modules/notifications/http/notifications.routes.js'
...
app.route('/api/notifications', notificationsRouter)
```

**Route order:** `/read-all` static vs `/:id/read` param — Hono ưu tiên static route. Không cần sắp xếp.

**SECURITY — bắt buộc (audit 2026-08-07):** CORS `allowMethods` (index.ts:40) đang thiếu `'PATCH'` — browser preflight từ web-1 sẽ chặn mọi PATCH. Sửa trong phase này:
```ts
allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
```
(Codebase hiện chưa dùng PATCH ở đâu — 2 route này là PATCH đầu tiên.)

## Verify

- [ ] `npm run check-types --workspace=apps/api` pass
- [ ] GET /api/notifications trả [] khi không có data — không 500
- [ ] unread-count = 0

## Chốt

- 4 endpoint inbox, auth đúng
- Không leak notification của user khác
