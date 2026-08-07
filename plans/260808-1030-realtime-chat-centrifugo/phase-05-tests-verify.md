# Phase 5 — Tests + verify + deploy checklist

- Priority: P1 | Status: In-Progress | Effort: 2h
- Depends: Phase 1-4 (mọi thứ)

> **Sync-back 2026-08-08:** Test file viết đủ 4 nhóm A-D + cleanup, type-check file PASS. **npm test BỊ SKIP theo quyết định user** (chưa có Centrifugo container — tránh treo). Verify chain đã chạy: check-types root 3/3 PASS, eslint file mới sạch, npm audit không vuln jose/centrifuge (17 pre-existing khác không liên quan). E2E manual + build api CHƯA làm. Deploy checklist VPS ngoài scope.

## Overview

Test API (phase-09-realtime-chat.test.ts): token sign/verify, publish helper (mock fetch), send-message integration, subscribe-token authz. Verify toàn hệ: check-types, lint, build, e2e manual. Deploy checklist cho VPS.

## Key Insights

- Test pattern project: `tsx --test src/shared/infrastructure/tests/*.test.ts`, DB thật local (khớp phase-03-messaging.test.ts, phase-08-notifications.test.ts)
- Token test không cần DB (jose pure)
- Publish test: mock global `fetch` — không gọi Centrifugo thật
- Authz test cần DB thật + case + 2 user (owner vs outsider) — copy pattern phase-03
- check-types root chạy cả 3 workspace

## Files

| File | Action | Nội dung |
|---|---|---|
| `apps/api/src/shared/infrastructure/tests/phase-09-realtime-chat.test.ts` | MỚI | 4 nhóm test |

## Implementation Steps

### 1. phase-09-realtime-chat.test.ts — cấu trúc

**Nhóm A — Token (không DB):**
```typescript
import { jwtVerify } from "jose";

const TEST_SECRET = "test-secret-64-hex-abcdef0123456789abcdef0123456789"; // ≥32 bytes (64 hex)
process.env.CENTRIFUGO_TOKEN_SECRET = TEST_SECRET;

// NOTE: module import phải sau khi set env (ESM import hoisted) — dùng dynamic import()
const { signConnectionToken, signSubscriptionToken } = await import("../../modules/realtime/infrastructure/centrifugo-token.service.js");

test("signConnectionToken: verifiable HS256, sub=userId, exp ~15m", async () => {
  const token = await signConnectionToken("user-1");
  const { payload } = await jwtVerify(token, new TextEncoder().encode(TEST_SECRET));
  assert.equal(payload.sub, "user-1");
  assert.ok((payload.exp as number) - Math.floor(Date.now() / 1000) <= 15 * 60 + 5);
});

test("signSubscriptionToken: channel claim = chat:{caseId}", async () => {
  const token = await signSubscriptionToken("user-1", "case-abc");
  const { payload } = await jwtVerify(token, new TextEncoder().encode(TEST_SECRET));
  assert.equal(payload.channel, "chat:case-abc");
});
```

**Nhóm B — publishToChannel (mock fetch):**
```typescript
test("publishToChannel: POST đúng channel + X-API-Key, success → true", async () => {
  let captured: any;
  vi/* hoặc gán */global.fetch = async (url: any, init: any) => {
    captured = { url, init };
    return { ok: true };
  };
  const ok = await publishToChannel("chat:case-abc", { type: "message" });
  assert.equal(ok, true);
  assert.match(captured.url, /\/api\/publish$/);
  assert.equal(captured.init.headers["X-API-Key"], ...);
  assert.deepEqual(JSON.parse(captured.init.body).channel, "chat:case-abc");
});

test("publishToChannel: fetch throw → false, không throw ra ngoài", async () => {
  global.fetch = async () => { throw new Error("conn refused"); };
  const ok = await publishToChannel("chat:case-abc", {});
  assert.equal(ok, false);
});

test("publishToChannel: thiếu API key → false + skip", async () => { ... });
```

Chú ý: test phải set/restore `process.env.CENTRIFUGO_URL`, `CENTRIFUGO_API_KEY` trong `before`/`after` hook. `publishToChannel` đọc env per-call (phase 3) nên set sau import vẫn OK — không cần dynamic import cho nhóm B.

**Nhóm C — send-message integration (DB thật, mock fetch):**
- Setup: tạo user + case (copy helper pattern phase-03)
- Spy fetch → gửi tin qua `sendMessageUseCase` → assert fetch gọi 1 lần, payload `message.id` = id DB trả về
- Assert tin lưu DB (caseMessage tồn tại)
- Case đóng (completed) → throw AppError, fetch KHÔNG gọi

**Nhóm D — subscribe-token authz (HTTP, DB thật):**
- Owner user → GET /api/realtime/cases/<case mình>/subscribe-token → 200 + token verify channel đúng
- Outsider → 403
- Không session → 401 (requireAuth)
- Case không tồn tại → 404
- **Clean test data** (skill testing): nhóm D tạo case/user riêng trong setup — không dùng chung data nhóm C; `after` hook xoá record tạo ra (hoặc dùng transaction rollback pattern phase-03 nếu có) — tránh leak giữa test run

Copy pattern từ phase-03-messaging.test.ts (cách tạo app + session + case).

### 2. Chạy toàn test API
```bash
npm test --workspace=apps/api
```
Xác nhận phase-09 pass; 19 test pre-existing fail như cũ (đã biết: env Cloudinary/DB) — không phải do feature.

### 3. Verify build chain
```bash
npm run check-types          # root — 3 workspace
npm run lint --workspace=nexus-platform-web-1
npm run build --workspace=apps/api
npm audit --workspace=apps/api --workspace=nexus-platform-web-1   # SCA (skill testing/security): jose + centrifuge không lỗ hổng đã biết
```

### 4. E2E manual (dev)
1. Chạy centrifugo container dev (phase 1)
2. `npm run dev` — API + web
3. 2 browser (hoặc incognito) cùng case → gửi tin cross-check <1s
4. DevTools → Network WS frame nhìn thấy publication
5. Tắt mạng 15s → bật → tin gửi trong lúc mất tự xuất hiện (recovery)
6. Role check: supporter khác case không thấy; admin thấy mọi case

### 5. Deploy checklist (VPS) — NGOÀI SCOPE (user tự deploy sau)
> Validation 2026-08-08: deploy không thuộc phạm vi thực thi. Checklist để tham khảo khi user deploy.
```bash
# 1. Commit config + code. Push image — GIỮ CẢ 2 build-arg (NEXT_PUBLIC_API_URL + NEXT_PUBLIC_CENTRIFUGO_URL)
docker build --no-cache -t lgdlong/nexus-api:latest .      # jose mới
docker build --no-cache -t lgdlong/nexus-web:latest \
  --build-arg NEXT_PUBLIC_API_URL="https://nexusforstartup.site" \
  --build-arg NEXT_PUBLIC_CENTRIFUGO_URL="wss://${DOMAIN}/connection/websocket" \
  -f apps/web-1/Dockerfile .   # THIẾU NEXT_PUBLIC_API_URL → apiClient fallback localhost:8000 prod — web chết im lặng
docker push lgdlong/nexus-api:latest lgdlong/nexus-web:latest

# 2. VPS: thêm 4 vars vào .env.prod + centrifugo/config.json copy lên server
# 3. KHÔNG migration (schema không đổi)
docker compose -f docker-compose.prod.yml up -d centrifugo
docker compose -f docker-compose.prod.yml up -d api web

# 4. Verify prod
curl https://${DOMAIN}/health
# WebSocket: mở app → chat → gửi tin → tab khác nhận tức thì
# Traefik log không error websocket
```

## Todo List

- [x] phase-09 test nhóm A (token)
- [x] phase-09 test nhóm B (publish mock)
- [x] phase-09 test nhóm C (send-message integration)
- [x] phase-09 test nhóm D (subscribe-token authz)
- [ ] npm test API pass (phase-09 sạch)   <!-- SKIP theo user 2026-08-08: chưa có Centrifugo container, tránh treo -->
- [ ] check-types root + lint web + build api   <!-- check-types + eslint PASS; build api chưa chạy -->
- [ ] E2E manual 2 tab + recovery
- [ ] Deploy checklist chạy VPS

## Success Criteria

- phase-09-realtime-chat.test.ts pass 100% (mọi nhóm)
- Không test cũ mới fail (chỉ 19 pre-existing đã biết)
- check-types root 3/3, lint 0 warning
- E2E: <1s delivery, recovery hoạt động, authz đúng 3 role
- Prod: 1 container mới, 4 env mới, 0 migration

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Test env dơ giữa các test | before/after set/restore env + mock fetch restore |
| DB test cần case/user helper | Copy từ phase-03 — không tự viết mới |
| Docker image thiếu jose | build --no-cache (npm ci đọc package-lock mới) |
| Quên push image trước up -d | pull_policy: always đã có — chú ý thứ tự push → up |
| allowed_origins chặn trình duyệt prod | Verify lần đầu bằng console log websocket 403 + sửa env override |

## Security Considerations

- Verify prod: WebSocket handshake không lộ token; X-API-Key không xuất hiện trong web bundle (grep `CENTRIFUGO_API_KEY` trong .next static)
- Traefik router `/connection` không compress — check log heartbeat ổn định

## Next Steps

→ Hoàn thành plan → `/ck:cook` hoặc implement theo phase
