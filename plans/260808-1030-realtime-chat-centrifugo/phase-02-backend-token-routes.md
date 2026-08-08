# Phase 2 — Backend: realtime module + token routes

- Priority: P1 | Status: Completed | Effort: 3h
- Depends: Phase 1 (env `CENTRIFUGO_TOKEN_SECRET`)

> **Sync-back 2026-08-08:** Done — realtime module + jose 6.2.8, mount `/api/realtime`, check-types PASS. Deviation: `c.req.param("caseId") ?? ""`. Smoke test 2 endpoints chưa chạy (gom vào phase 5 E2E).

## Overview

Module `realtime` mới trong apps/api: domain types (channel naming), token sign service (jose HS256), 2 HTTP routes:
- `GET /api/realtime/connection-token` — connect token (sub=userId, exp 15m)
- `GET /api/realtime/cases/:caseId/subscribe-token` — subscription token per channel (exp 15m, gate qua `requireCaseAccess`)

Auth pattern: `requireAuth` middleware (đã có, dùng cho AI Engine/Documents) + `requireCaseAccess` (đã có, admin/supporter-assigned/owner+members).

## API Design (đối chiếu backend skill + conventions repo)

| Quyết định | Lý do |
|---|---|
| Route action-style kebab-case (`/connection-token`, `/cases/:caseId/subscribe-token`) | Token issuance = action không phải CRUD resource. Precedent repo: `/api/notifications/unread-count`, `/api/payments/:id/verify` |
| Path param `:caseId` thay vì `?case=` query | Skill REST: tránh `?id=123` RPC-style; khớp repo `/api/payments/:id/verify`. Query param leak vào access log |
| `GET` (không `POST`) | Idempotent, không mutate state. Centrifugo docs cũng dùng GET token endpoint |
| Success `{ token }` | Khớp DTO pattern repo (`{ payments: [...] }`) |
| Error `{ error: string }` | KHỚP repo: `requireAuth` → `{error:'Unauthorized'}`, `requireCaseAccess` → `{error:"..."}`. KHÔNG dùng `{code, message}` envelope lạ |
| Không version prefix `/api/v1` | Repo chưa version API — giữ nhất quán |
| Rate limiting | KHÔNG có trong scope: repo chưa có rate limit infra; token sign HS256 rẻ; endpoint sau `requireAuth`. Risk chấp nhận + ghi risk table. Centrifugo bù bằng `connection_rate_limit` mặc định off — không bật (single-node MVP) |

## Key Insights

- API **không có JWT lib** — thêm `jose` (ESM-native, zero-dep, HS256; chuẩn cho Centrifugo JWT)
- **HS256 (không RS256)**: skill backend khuyên RS256 cho public API, nhưng Centrifugo `hmac_secret_key` chỉ hỗ trợ HMAC — HS256 bắt buộc, không lựa chọn. Secret 64-hex đủ mạnh bù cho symmetric signing; secret không bao giờ ra khỏi server
- Connect token: SDK gọi `getToken` lại khi exp gần hết → exp 15m an toàn (khớp skill: access token 15m)
- Subscription token per channel — KHÔNG nhồi hết case vào connect token (admin có thể access mọi case, token phình vô hạn). SDK gọi `getToken` khi subscribe (lazy)
- Channel name: `chat:{caseId}` — namespace `chat` + boundary `:`
- JWT claims Centrifugo v6:
  - Connect: `{ "sub": "<userId>", "exp": <unixSeconds> }`
  - Subscribe: `{ "sub": "<userId>", "channel": "chat:<caseId>", "exp": <unixSeconds> }`
- **Log issuance** (skill security: "log authentication events"): `logger.info({userId, scope: "connect"|"subscribe", caseId}, "realtime token issued")` — KHÔNG log token value (secret, skill: don't log session tokens)

## Files

| File | Action | Nội dung |
|---|---|---|
| `apps/api/package.json` | SỬA | + `"jose": "^6.x"` |
| `apps/api/src/modules/realtime/domain/realtime.types.ts` | MỚI | `chatChannel(caseId)`, token TTL const |
| `apps/api/src/modules/realtime/infrastructure/centrifugo-token.service.ts` | MỚI | sign 2 loại token |
| `apps/api/src/modules/realtime/http/realtime.controller.ts` | MỚI | 2 handlers |
| `apps/api/src/modules/realtime/http/realtime.routes.ts` | MỚI | mount routes |
| `apps/api/src/index.ts` | SỬA | import + `app.route("/api/realtime", realtimeRouter)` |

## Implementation Steps

### 1. Cài jose
```bash
npm install jose --workspace=nexus-platform-api
```

### 2. realtime.types.ts
```typescript
export const REALTIME_CHANNEL_PREFIX = "chat";
export const REALTIME_CHANNEL_NAMESPACE = "chat";
export const TOKEN_TTL_SECONDS = 15 * 60;

export function chatChannel(caseId: string): string {
  return `${REALTIME_CHANNEL_NAMESPACE}:${caseId}`;
}
```

### 3. centrifugo-token.service.ts
```typescript
import { SignJWT } from "jose";
import { TOKEN_TTL_SECONDS, chatChannel } from "../domain/realtime.types.js";
import logger from "../../../shared/infrastructure/logger.js";

const encoder = new TextEncoder();
const secretKey = () => encoder.encode(process.env.CENTRIFUGO_TOKEN_SECRET || "");

export async function signConnectionToken(userId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL_SECONDS)
    .sign(secretKey());
}

export async function signSubscriptionToken(userId: string, caseId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ sub: userId, channel: chatChannel(caseId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + TOKEN_TTL_SECONDS)
    .sign(secretKey());
}

export function hasCentrifugoSecret(): boolean {
  return Boolean(process.env.CENTRIFUGO_TOKEN_SECRET);
}
```

Quan trọng: sign fail (thiếu secret) phải log rõ — không sign token rỗng lén lút.

### 4. realtime.controller.ts
```typescript
export async function connectionTokenHandler(c: Context<AuthEnv>) {
  const user = c.get("user");
  if (!hasCentrifugoSecret()) {
    logger.error("CENTRIFUGO_TOKEN_SECRET missing — realtime disabled");
    return c.json({ error: "Dịch vụ realtime chưa cấu hình" }, 503);
  }
  try {
    const token = await signConnectionToken(user.id);
    logger.info({ userId: user.id, scope: "connect" }, "realtime token issued");
    return c.json({ token });
  } catch (e) {
    return handleError(c, e);
  }
}

export async function subscriptionTokenHandler(c: Context<AuthEnv>) {
  const caseId = c.req.param("caseId");
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) return access.response;
  if (!hasCentrifugoSecret()) {
    logger.error("CENTRIFUGO_TOKEN_SECRET missing — realtime disabled");
    return c.json({ error: "Dịch vụ realtime chưa cấu hình" }, 503);
  }
  try {
    const token = await signSubscriptionToken(access.session.user.id, caseId);
    logger.info({ userId: access.session.user.id, scope: "subscribe", caseId }, "realtime token issued");
    return c.json({ token });
  } catch (e) {
    return handleError(c, e);
  }
}
```

`c.get("user")` từ `requireAuth` middleware — check type `AuthEnv` từ `middlewares/auth.ts` (mẫu: notifications.routes.ts). `requireCaseAccess` nhận `c` — lấy session từ cookie, KHÔNG cần user từ middleware (khớp mẫu cases.controller).

503 rõ ràng (thiếu secret) thay vì 500 generic — client hiểu là feature chưa cấu hình, không phải bug. Envelope `{ error }` khớp repo (requireAuth dùng `{error:'Unauthorized'}`).

### 5. realtime.routes.ts
```typescript
export const realtimeRouter = new Hono();

realtimeRouter.get("/connection-token", requireAuth, connectionTokenHandler);
realtimeRouter.get("/cases/:caseId/subscribe-token", requireAuth, subscriptionTokenHandler);
```

### 6. index.ts
Thêm import + mount cạnh các router khác (sau `notificationsRouter`, trước `app.get('/')`):
```typescript
import { realtimeRouter } from './modules/realtime/http/realtime.routes.js'
...
app.route('/api/realtime', realtimeRouter)
```

## Todo List

- [x] jose cài vào apps/api
- [x] realtime.types.ts + chatChannel helper
- [x] centrifugo-token.service.ts (2 sign + hasCentrifugoSecret)
- [x] realtime.controller.ts + realtime.routes.ts
- [x] index.ts mount `/api/realtime`
- [ ] Smoke test: curl 2 endpoints với cookie → `{token}` / 401

## Success Criteria

- `curl /api/realtime/connection-token` (có session) → `{"token":"eyJ..."}`
- `curl /api/realtime/connection-token` (KHÔNG session) → 401 `{error}`
- `curl /api/realtime/cases/<caseKhac>/subscribe-token` (không access) → 403 `{error}`
- Token verify được bằng secret qua https://jwt.io hoặc jose `jwtVerify`
- `npm run check-types --workspace=apps/api` pass

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Thiếu CENTRIFUGO_TOKEN_SECRET → sign fail | hasCentrifugoSecret + log error rõ; route trả 503 qua envelope `{error}` |
| `:caseId` param trống/không hợp lệ | requireCaseAccess xử lý → 404 "Không tìm thấy dự án" |
| `jose` chưa có trong Docker image | `npm ci` sau khi package.json sửa; build image không-cache phase 5 |
| Clock skew (JWT iat/exp) | setIssuedAt + exp relative — Centrifugo dung sai mặc định |
| Rate limit token endpoint | KHÔNG áp (repo chưa có infra; authed; sign rẻ). Revisit khi đưa rate limit chung vào |

## Security Considerations

- Exp 15m — token dùng 1 lần subscribe/connect, ngắn hạn, SDK refresh tự động
- Subscription token KHÔNG cache public — mỗi request sign mới (vô hại, HS256 nhanh)
- Không include caseId trong connect token — giảm attack surface (channel claim chỉ trong sub token)
- Secret từ env duy nhất — không hardcode

## Next Steps

→ Phase 3 (publish) reuse `chatChannel` + env từ phase 1; mount `realtimeRouter` là tiền đề test E2E phase 5
