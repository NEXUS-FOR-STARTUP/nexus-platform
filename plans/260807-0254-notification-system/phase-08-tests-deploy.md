# Phase 08 — Tests + Env + Deploy (Traefik)

**Effort:** 3h

## 1. Tests — `apps/api/src/shared/infrastructure/tests/notifications.test.ts`

Pattern: `node:test` + `node:assert`, `NODE_ENV=test`, dynamic import.

| Test | Mục đích |
|---|---|
| listNotificationsUseCase - pagination & order | page/limit đúng, mới nhất trước, chỉ row của user |
| listNotificationsUseCase - invalid page | page=0 / limit>50 → VALIDATION_ERROR |
| getUnreadCountUseCase | chỉ đếm read_at null |
| markNotificationReadUseCase - không phải của user | trả `{ ok: false }`, không throw |
| markAllReadUseCase | chỉ update row của user |
| event-bus - emit không throw khi handler lỗi | handler throw → emitEvent không ném |
| listener - insert outbox idempotent | handleEvent 2 lần cùng event → 1 row |
| listener - skip actor | actorId = supporterId → supporter không có row |
| listener - recipients resolve | case.assigned → supporter + owner + members dedupe |
| wire - assign unassign không emit | unassign → 0 outbox row |
| wire - close-case emit stage_changed | closeCaseUseCase → 1 outbox row, toStage=closed |
| relay - claim atomic | 2 claim cùng lúc → không trùng row |
| relay - reclaim stale processing | row processing > 60s → claim lại như pending |
| relay - backoff schedule | fail attempt 1 → next_retry_at = now+2s; attempt 5 → failed |
| relay - in_app insert + sse ping | insertNotification + sseHub.ping được gọi |
| outbox - purge sent cũ | purgeSentOutbox chỉ xóa sent > cutoff; giữ pending/failed/processing |
| email service - Idempotency-Key header | send() truyền headers đúng outbox.id |
| sse-hub - cap connections | user mở > 5 connection → addConnection trả false (429) |
| email/telegram service - disabled khi thiếu key | không throw, không gọi API |

Test data: insert qua prisma (pattern hiện có). `relayTick` + `handleEvent` viết theo DI (`deps = {}`) — mock được.

## 2. Env — `.env` (local) + `.env.prod` (VPS, env_file compose), tất cả OPTIONAL — không crash khi thiếu

```env
RESEND_API_KEY=re_xxxx                 # thiếu → email disabled + log warning
RESEND_FROM_EMAIL=Nexus Platform <noreply@nexusforstartup.site>
TELEGRAM_BOT_TOKEN=xxxx                # thiếu → telegram disabled
TELEGRAM_ADMIN_CHAT_ID=xxxx
TELEGRAM_SUPPORTER_CHAT_ID=xxxx
NOTIFICATIONS_ENABLED=true             # "false" dev tắt relay
```

- KHÔNG thêm vào `env.ts` requiredEnv — đọc optional tại điểm dùng (pattern ENABLE_LOKI trong logger.ts)
- `.env.prod` qua `env_file` (compose L51) → container env → process.env. Không sửa Dockerfile

**SECURITY — `.env.prod` đang bị track trong git (audit 2026-08-07):**
```bash
git rm --cached .env.prod          # bỏ khỏi index, giữ file local
# thêm vào .gitignore: .env.prod
```
Đổ `RESEND_API_KEY` / `TELEGRAM_BOT_TOKEN` vào file tracked = secret vào git history. VPS giữ bản .env.prod local (scp), KHÔNG commit.

## 3. Deploy — Traefik (KHÔNG nginx)

| Nginx assumption (plan cũ — SAI) | Traefik reality |
|---|---|
| proxy_buffering off cần thiết | Traefik không buffer mặc định — không cần config |
| X-Accel-Buffering header | nginx-specific — vô dụng. Bỏ khỏi code |
| tăng proxy_read_timeout | Entrypoint-level timeout (external Traefik) — kiểm tra ≥ 60s |

**Vấn đề thật:** middleware `compress` trên router API (compose L80) — compress + SSE có rủi ro buffer/treo connection. **Fix: router riêng stream, không compress.**

### Sửa `docker-compose.prod.yml` — thêm labels vào service `api` (sau L90):

```yaml
      # SSE stream router — KHÔNG compress
      - "traefik.http.routers.nexus-api-stream.rule=Host(`${DOMAIN}`) && PathPrefix(`/api/notifications/stream`)"
      - "traefik.http.routers.nexus-api-stream.entrypoints=websecure"
      - "traefik.http.routers.nexus-api-stream.tls=true"
      - "traefik.http.routers.nexus-api-stream.tls.certresolver=letsencrypt"
      - "traefik.http.routers.nexus-api-stream.middlewares=security-headers"
      - "traefik.http.services.nexus-api-stream.loadbalancer.server.port=8000"
```

- Không cần `priority` — Traefik longest-rule-win, PathPrefix stream dài hơn `/api`
- Giữ security-headers, bỏ compress
- Router `nexus-api` lo `/api` còn lại — không đụng

### Deploy order (schema đổi → BẮT BUỘC `--no-cache` build, theo guide L80):

```bash
# 1. Local: migration create-only + review SQL + commit
npx prisma migrate dev --create-only --name add_notifications

# 2. Push API image (--no-cache — schema mới → prisma generate phải chạy trong build)
docker build --no-cache -t lgdlong/nexus-api:latest ...   # theo build-push guide
docker push lgdlong/nexus-api:latest

# 3. VPS: thêm env vào .env.prod + cập nhật labels docker-compose.prod.yml
# 4. VPS: apply migration (KHÔNG dùng `make migrate` — target hỏng, service 'migrate' không tồn tại)
docker compose -f docker-compose.prod.yml --env-file .env.prod exec api \
  npx prisma migrate deploy --schema prisma/schema.prisma

# 5. VPS: deploy API (up -d recreates container → labels + env mới)
make deploy-api

# 6. Verify SSE không gzip
curl -H "Accept: text/event-stream" -i https://${DOMAIN}/api/notifications/stream
# → không có header Content-Encoding: gzip

# 7. Verify CORS cho phép PATCH (fix phase 03 — trước đây allowMethods thiếu PATCH, preflight chặn mark-read)
curl -i -X OPTIONS https://${DOMAIN}/api/notifications/1/read \
  -H "Origin: https://${DOMAIN}" -H "Access-Control-Request-Method: PATCH" \
  -H "Access-Control-Request-Headers: content-type,idempotency-key"
# → Access-Control-Allow-Methods phải chứa PATCH
```

**SSE + restart:** `stop_grace_period: 30s` (L48) — restart rớt SSE → EventSource tự reconnect + onopen refetch → không mất. **Outbox rows sống trong DB — đây là lý do chọn outbox.**

**1 instance:** relay + SSE hub in-memory trong API container. Limits 512M/0.5cpu (L71-73) đủ — SSE vài KB, relay 2s nhẹ.

**Entrypoint timeout (external Traefik):** kiểm tra readTimeout entrypoint websecure ≥ 60s — nếu thấp, SSE bị cắt khi im lặng. Heartbeat 25s đã chống (phase 05).

## 4. Dependencies

```bash
npm i resend --workspace=apps/api
npm i grammy @grammyjs/auto-retry --workspace=apps/api
```

## 5. Docs update

- `plans/260807-0254-notification-system/reports/brainstorm-notifications-2026-08-07.md` — đánh dấu implemented
- `docs/docker-build-push-guide.md` — ghi chú labels stream router + `--no-cache` bắt buộc khi schema đổi
- `docs/db-migration-guide.md` — add_notifications đã apply

## 6. Pre-existing issue (ngoài scope)

`Makefile.prod` L143-148: target `migrate`/`migrate-status` reference service `migrate` KHÔNG tồn tại trong compose → chạy lỗi. Quy trình đúng: `docker compose exec api npx prisma migrate deploy` (docs L23). Sửa Makefile sau (optional).

## Verify

- [ ] `npm test` (apps/api) — toàn bộ pass, không regression
- [ ] `npm run check-types` root pass
- [ ] `npm run lint` pass
- [ ] Docker build API pass

## Chốt

- Test phủ: security (markRead cross-user), idempotency, retry backoff, skip-actor
- Traefik stream router + verify không gzip
