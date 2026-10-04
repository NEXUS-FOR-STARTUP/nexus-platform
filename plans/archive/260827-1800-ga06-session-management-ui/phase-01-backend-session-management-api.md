# Phase 01: Backend Session Management API & Validation

## Context Links
- **Plan Tổng quan**: [plan.md](./plan.md)
- **Task Gốc**: `tasks/bugs/ga-06-session-management-ui.md`
- **Báo cáo Khảo sát**: [reports/backend-auth-scout.md](./reports/backend-auth-scout.md), [reports/security-edge-cases.md](./reports/security-edge-cases.md)
- **Files liên quan**:
  - `packages/validation/src/index.ts`
  - `apps/api/src/modules/profile/http/profile.routes.ts`
  - `apps/api/src/modules/profile/http/session.controller.ts`
  - `apps/api/src/modules/profile/application/list-sessions.usecase.ts`
  - `apps/api/src/modules/profile/application/revoke-session.usecase.ts`
  - `apps/api/src/modules/profile/application/revoke-other-sessions.usecase.ts`

---

## Overview
- **Mục tiêu**: Xây dựng bộ API quản lý phiên đăng nhập ở tầng Profile Module (`/api/profile/sessions`), đảm bảo bảo mật OWASP, lọc phiên hết hạn, xác định phiên hiện tại bất biến trên server (bằng `session.id`), áp dụng snake_case schema chuẩn của Prisma và ghi nhật ký kiểm toán (Audit Log).
- **Trạng thái**: Completed
- **Ước lượng**: 1.5h

---

## Key Insights & Fixes từ Red Team Review
1. **Zod Schema cho Session ID**: Better Auth sinh ID dạng chuỗi ngẫu nhiên (base62/nanoid), không phải UUID v4. Do đó dùng `z.string().min(1)` cho `id` trong `ActiveSessionDtoSchema` và `RevokeSessionParamsSchema`.
2. **Bảo mật Token**: Tuyệt đối không trả chuỗi `token` bí mật ra ngoài DTO của client. Client chỉ nhận `id`, `ipAddress`, `userAgent`, `createdAt`, `expiresAt`, `isCurrent`.
3. **Server-side `isCurrent` Bất biến**: So sánh khóa chính `s.id === currentSessionId` trên backend. Điều này ngăn chặn hoàn toàn lỗi lệch phiên khi Better Auth thực hiện rolling session update (`updateAge: 24h`).
4. **Chuẩn Prisma Snake_Case**: Cơ sở dữ liệu sử dụng `user_id`, `expires_at`, `created_at`, `ip_address`, `user_agent`. Mọi truy vấn Prisma phải dùng đúng tên cột snake_case này và map sang camelCase ở tầng DTO.
5. **Giới hạn Phòng thủ Query**: Thêm `take: 100` vào `listSessionsUseCase` để tránh tải vô hạn bộ nhớ nếu user có nhiều phiên cũ.
6. **Guard An toàn trong Revoke Others**: Kiểm tra nghiêm ngặt `currentSessionId` hợp lệ (chuỗi không rỗng) trước khi chạy `deleteMany` để tránh việc vô tình xóa nhầm phiên hiện tại.
7. **Ngăn chặn Self-Revoke qua API đơn lẻ**: `revokeSessionUseCase` ném lỗi `AppError(400, "CANNOT_REVOKE_CURRENT_SESSION")` nếu `targetSessionId === currentSessionId`.

---

## Architecture & Data Flow

```
[Web Client] 
     │ (Cookie session)
     ▼
[GET /api/profile/sessions] ──> [requireAuth Middleware] (Sets c.var.user, c.var.session)
     │
     ▼
[session.controller.ts: listSessionsHandler]
     │
     ▼
[list-sessions.usecase.ts]
     │
     ├──> Prisma query: findMany({ where: { user_id: userId, expires_at: { gt: now } }, take: 100, orderBy: { created_at: 'desc' } })
     │
     └──> Map to ActiveSessionDto[]:
          - id: s.id
          - ipAddress: s.ip_address
          - userAgent: s.user_agent
          - createdAt: s.created_at
          - expiresAt: s.expires_at
          - isCurrent: s.id === currentSessionId
          (EXCLUDES token)
```

---

## Related Code Files

### Files to Modify:
1. `packages/validation/src/index.ts`: Bổ sung `ActiveSessionDtoSchema`, `ActiveSessionsResponseSchema`, `RevokeSessionParamsSchema`.
2. `apps/api/src/modules/profile/http/profile.routes.ts`: Đăng ký 3 routes:
   - `GET /sessions` -> `listSessionsHandler`
   - `DELETE /sessions/:id` -> `revokeSessionHandler`
   - `POST /sessions/revoke-others` -> `revokeOtherSessionsHandler`

### Files to Create:
1. `apps/api/src/modules/profile/application/list-sessions.usecase.ts`: Lấy danh sách session còn hạn, map `isCurrent`.
2. `apps/api/src/modules/profile/application/revoke-session.usecase.ts`: Thu hồi 1 session cụ thể (chặn current session, bảo vệ IDOR).
3. `apps/api/src/modules/profile/application/revoke-other-sessions.usecase.ts`: Thu hồi tất cả session khác an toàn.
4. `apps/api/src/modules/profile/http/session.controller.ts`: Các controller handler tương ứng.

---

## Implementation Steps

### Bước 1: Khai báo Zod Schemas trong `@repo/validation`
Trong `packages/validation/src/index.ts`:
```typescript
export const ActiveSessionDtoSchema = z.object({
  id: z.string().min(1),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
  isCurrent: z.boolean(),
});
export type ActiveSessionDto = z.infer<typeof ActiveSessionDtoSchema>;

export const ActiveSessionsResponseSchema = z.object({
  data: z.array(ActiveSessionDtoSchema),
});
export type ActiveSessionsResponse = z.infer<typeof ActiveSessionsResponseSchema>;

export const RevokeSessionParamsSchema = z.object({
  id: z.string().min(1),
});
export type RevokeSessionParams = z.infer<typeof RevokeSessionParamsSchema>;
```

### Bước 2: Tạo `list-sessions.usecase.ts`
Trong `apps/api/src/modules/profile/application/list-sessions.usecase.ts`:
```typescript
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
```

### Bước 3: Tạo `revoke-session.usecase.ts`
Trong `apps/api/src/modules/profile/application/revoke-session.usecase.ts`:
```typescript
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { auditLogger, type AuditLogEntry } from "../../../shared/infrastructure/audit-logger.js";

export interface RevokeSessionDeps {
  deleteSession?: (sessionId: string, userId: string) => Promise<{ count: number }>;
  logAudit?: (entry: Omit<AuditLogEntry, "timestamp" | "level">) => void;
}

export async function revokeSessionUseCase(
  userId: string,
  targetSessionId: string,
  currentSessionId: string,
  deps?: RevokeSessionDeps
): Promise<{ success: boolean; message: string }> {
  if (!userId || !userId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "User ID không hợp lệ");
  }
  if (!targetSessionId || !targetSessionId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "Session ID không hợp lệ");
  }

  if (targetSessionId === currentSessionId) {
    throw new AppError(400, "CANNOT_REVOKE_CURRENT_SESSION", "Không thể thu hồi phiên đăng nhập hiện tại qua tính năng này");
  }

  const deleteFn = deps?.deleteSession ?? ((id, uId) => prisma.session.deleteMany({
    where: {
      id: id,
      user_id: uId,
    },
  }));

  const result = await deleteFn(targetSessionId, userId);

  if (result.count === 0) {
    throw new AppError(404, "SESSION_NOT_FOUND", "Phiên đăng nhập không tồn tại hoặc đã hết hạn");
  }

  const logFn = deps?.logAudit ?? ((entry) => auditLogger.log(entry));
  logFn({
    actor_id: userId,
    actor_role: "user",
    operation: "profile.revoke_session",
    action: "delete",
    resource_type: "session",
    resource_id: targetSessionId,
    metadata: {
      revoked_session_id: targetSessionId,
    },
  });

  return { success: true, message: "Đã thu hồi phiên đăng nhập thành công" };
}
```

### Bước 4: Tạo `revoke-other-sessions.usecase.ts`
Trong `apps/api/src/modules/profile/application/revoke-other-sessions.usecase.ts`:
```typescript
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
```

### Bước 5: Tạo `session.controller.ts` & Đăng ký Routes
Trong `apps/api/src/modules/profile/http/session.controller.ts`:
```typescript
import type { Context } from "hono";
import { handleError } from "../../../shared/infrastructure/http-helpers.js";
import type { AuthEnv } from "../../../shared/infrastructure/middlewares/auth.js";
import { listSessionsUseCase } from "../application/list-sessions.usecase.js";
import { revokeSessionUseCase } from "../application/revoke-session.usecase.js";
import { revokeOtherSessionsUseCase } from "../application/revoke-other-sessions.usecase.js";

export async function listSessionsHandler(c: Context<AuthEnv>) {
  try {
    const user = c.get("user");
    const session = c.get("session");
    const sessions = await listSessionsUseCase(user.id, session.id);
    return c.json({ data: sessions }, 200);
  } catch (error) {
    return handleError(c, error);
  }
}

export async function revokeSessionHandler(c: Context<AuthEnv>) {
  try {
    const user = c.get("user");
    const session = c.get("session");
    const targetSessionId = c.req.param("id");
    const result = await revokeSessionUseCase(user.id, targetSessionId, session.id);
    return c.json(result, 200);
  } catch (error) {
    return handleError(c, error);
  }
}

export async function revokeOtherSessionsHandler(c: Context<AuthEnv>) {
  try {
    const user = c.get("user");
    const session = c.get("session");
    const result = await revokeOtherSessionsUseCase(user.id, session.id);
    return c.json(result, 200);
  } catch (error) {
    return handleError(c, error);
  }
}
```

Cập nhật `apps/api/src/modules/profile/http/profile.routes.ts`:
```typescript
import { Hono } from "hono";
import { requireAuth } from "../../../shared/infrastructure/middlewares/auth.js";
import { uploadAvatarHandler } from "./avatar.controller.js";
import { deleteAccountHandler } from "./profile.controller.js";
import {
  listSessionsHandler,
  revokeSessionHandler,
  revokeOtherSessionsHandler,
} from "./session.controller.js";

export const profileRouter = new Hono();

profileRouter.post("/avatar", requireAuth, uploadAvatarHandler);
profileRouter.delete("/account", requireAuth, deleteAccountHandler);

// GA-06: Session Management
profileRouter.get("/sessions", requireAuth, listSessionsHandler);
profileRouter.delete("/sessions/:id", requireAuth, revokeSessionHandler);
profileRouter.post("/sessions/revoke-others", requireAuth, revokeOtherSessionsHandler);
```

---

## Todo List
- [x] Bổ sung Zod schemas (`string().min(1)`) trong `packages/validation/src/index.ts`
- [x] Viết `list-sessions.usecase.ts` (dùng snake_case `user_id`, `expires_at`, `created_at`, `take: 100`, so sánh `s.id === currentSessionId`)
- [x] Viết `revoke-session.usecase.ts` (chặn self-revoke, bảo vệ IDOR qua `user_id: userId`)
- [x] Viết `revoke-other-sessions.usecase.ts` (guard `currentSessionId`, xóa `id: { not: currentSessionId }`)
- [x] Viết `session.controller.ts`
- [x] Đăng ký routes vào `profile.routes.ts`
- [x] Kiểm tra type safety qua `npm run check-types`

---

## Success Criteria
1. `GET /api/profile/sessions` trả về 200 OK cùng mảng session đã lọc `expires_at > now`, có `isCurrent: true` cho đúng session ID của thiết bị hiện tại.
2. Tuyệt đối không xuất hiện trường `token` trong payload trả về.
3. `DELETE /api/profile/sessions/:id` từ chối nếu `:id` là phiên hiện tại (400) hoặc không thuộc user (404).
4. `POST /api/profile/sessions/revoke-others` xóa sạch tất cả phiên khác nhưng giữ nguyên phiên hiện tại.
5. Không có lỗi typecheck nào trên monorepo.
