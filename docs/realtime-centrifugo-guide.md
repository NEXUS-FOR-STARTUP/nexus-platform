# Realtime Chat Centrifugo — Vận hành & Troubleshooting

> Tài liệu vận hành cho module realtime chat (Centrifugo v6). Research/đánh giá chi tiết xem `plans/260808-1030-realtime-chat-centrifugo/research/centrifugo-realtime-chat-2026-08-08.md`; plan implementation xem `plans/260808-1030-realtime-chat-centrifugo/plan.md`.

## Kiến trúc

```
Client (web-1) ──REST POST /cases/:id/messages──▶ API sendMessageUseCase
                                                     │  validate credit/stage/access
                                                     │  createCaseMessage (DB — source of truth)
                                                     ▼
                                               publishToChannel (HTTP API Centrifugo)
                                                     │  POST /api/publish {channel: "chat:{caseId}"}
                                                     ▼
                                        Centrifugo v6 (WebSocket pub/sub)
                                                     │  push publication
                                                     ▼
                                        Client (web-1) sub.on("publication")
                                                     │  setQueryData cache + dedupe theo message id
                                                     ▼
                                                UI cập nhật realtime
```

- **DB là source of truth.** Centrifugo chỉ là lớp transport realtime.
- **Client KHÔNG publish trực tiếp** — tin nhắn phải qua REST để giữ credit check + stage lock + access control.
- Fallback khi Centrifugo down: `useCaseChat` polling `refetchInterval: 60_000` (`apps/web-1/app/dashboard/case/[id]/hooks/useCaseChat.ts:15`).

## File liên quan

| Layer | File |
|---|---|
| Web hook | `apps/web-1/app/dashboard/case/[id]/hooks/useRealtimeChat.ts` |
| Web client singleton | `apps/web-1/lib/realtime/centrifuge-client.ts` |
| Web UI | `apps/web-1/app/dashboard/case/[id]/_components/TabDiscussionChat.tsx` |
| API publish | `apps/api/src/modules/realtime/infrastructure/centrifugo.service.ts` |
| API token routes | `apps/api/src/modules/realtime/http/realtime.routes.ts` |
| API JWT | `apps/api/src/modules/realtime/infrastructure/centrifugo-token.service.ts` |
| Channel helpers | `apps/api/src/modules/realtime/domain/realtime.types.ts` |
| Send hook | `apps/api/src/modules/cases/application/send-message.usecase.ts` (publish tại dòng ~46) |
| Config | `centrifugo/config.json` |
| Compose service | `docker-compose.prod.yml` (`centrifugo` service) |
| Test | `apps/api/src/shared/infrastructure/tests/phase-09-realtime-chat.test.ts` |

## Env vars (BẮT BUỘC khớp giữa API + Centrifugo)

| Var | Nơi dùng | Ghi chú |
|---|---|---|
| `CENTRIFUGO_URL` | API publish | Local: `http://localhost:8010` · Prod: `http://centrifugo:8000` (hostname Docker) |
| `CENTRIFUGO_TOKEN_SECRET` | API ký JWT **và** container `CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY` | Phải **giống hệt** 2 nơi, không thì WS connect/subscribe 401 |
| `CENTRIFUGO_API_KEY` | API HTTP publish **và** container `CENTRIFUGO_HTTP_API_KEY` | Phải khớp, không thì publish non-200 |
| `CENTRIFUGO_ALLOWED_ORIGINS` | container `CENTRIFUGO_CLIENT_ALLOWED_ORIGINS` | Local: `http://localhost:3001` · Prod: để trống → fallback `https://${DOMAIN}` |
| `CENTRIFUGO_EXPOSED_PORT` | container `ports` host bind | Local: mặc định `8010` · Prod: để trống để bỏ bind (`127.0.0.1:${CENTRIFUGO_EXPOSED_PORT:-8010}:8000`) |
| `NEXT_PUBLIC_CENTRIFUGO_URL` | Web client (build-time) | Local: `ws://localhost:8010/connection/websocket` · Prod: `wss://${DOMAIN}/connection/websocket` |

**Secret quản lý như JWT secret** — chia sẻ 2 nơi (API env + container env), không commit, không log.

## `CENTRIFUGO_ALLOWED_ORIGINS` — env-driven, KHÔNG hardcode https

`docker-compose.prod.yml` dùng fallback mặc định:

```yaml
CENTRIFUGO_CLIENT_ALLOWED_ORIGINS: ${CENTRIFUGO_ALLOWED_ORIGINS:-https://${DOMAIN}}
```

- **Local** `.env`: `CENTRIFUGO_ALLOWED_ORIGINS=http://localhost:3001`
- **Prod** `.env.prod`: không set → fallback `https://nexusforstartup.site` (giữ behavior cũ)

Lý do: browser dev gửi `Origin: http://localhost:3001`, nếu allow-list là `https://...` thì WS bị Centrifugo chặn.

> ⚠️ `centrifugo/config.json` hardcode `allowed_origins: ["http://localhost:3001"]` + secret `changeme`. Env container override config khi set. Nhớ set đủ env, không dựa vào file config.

## Port mapping

Centrifugo config server port `8000` (trong container). Host port do `CENTRIFUGO_EXPOSED_PORT` quyết định:

- **Local**: bind `127.0.0.1:8010` → container `8000`. API/web trên host truy cập qua `localhost:8010`.
- **Prod**: bỏ bind (Traefik route `/connection/*` → `centrifugo:8000` qua `proxy-net`).

## Deploy / Build lưu ý

- **`NEXT_PUBLIC_CENTRIFUGO_URL` là build-time arg** — Next.js inline vào JS bundle. Không build-arg → fallback `ws://localhost:8010/connection/websocket` → Web prod không kết nối được. Xem `docs/docker-build-push-guide.md`.
- Traefik route centrifugo: `Host(${DOMAIN}) && PathPrefix(/connection)` → port `8000`. SSE stream và centrifugo là 2 router riêng.
- Không cần migration DB (không đổi Prisma schema).

## Troubleshooting — "chat không realtime, phải refresh page"

Danh sách kiểm theo thứ tự (kinh nghiệm từ incident 2026-08-08):

1. **Container có expose host port?** `docker inspect nexus-centrifugo --format '{{json .HostConfig.PortBindings}}'` → `{}` nghĩa là API/web trên host không tới được → chỉ có polling 60s. Fix: set `CENTRIFUGO_EXPOSED_PORT` + `up -d --force-recreate centrifugo`.
2. **`allowed_origins` có chứa origin trình duyệt đang dùng?** Kiểm: `docker inspect nexus-centrifugo` → `CENTRIFUGO_CLIENT_ALLOWED_ORIGINS`. Dev phải có `http://localhost:3001`.
3. **API publish có fail không?** Log API dev (`apps/api/logs/combined.log`): tìm `centrifugo publish failed` / `ECONNREFUSED`. Sai host/port/`CENTRIFUGO_URL` hoặc thiếu `CENTRIFUGO_API_KEY`.
4. **Token secret khớp chưa?** `CENTRIFUGO_TOKEN_SECRET` (API) === container `CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY`. Lệch → WS 401, sub không bao giờ publication.
5. **Test publish thủ công**:
   ```bash
   curl -s http://localhost:8010/health
   curl -s -X POST http://localhost:8010/api/publish \
     -H "Content-Type: application/json" \
     -H "X-API-Key: <CENTRIFUGO_API_KEY>" \
     -d '{"channel":"chat:test","data":{"type":"message","message":{"id":"x"}}}'
   ```
   Trả `{"result":{"offset":1,...}}` = API hoạt động.

## Quy tắc chung

- Publish là fire-and-forget (`void publishToChannel(...).catch(log)`) — Centrifugo down không làm fail request chính, tin vẫn lưu DB, polling fallback tự bù.
- Payload publication **sanitize** — không leak full User row (email) vào history Centrifugo (lưu 600s). Xem `toPublishMessage` trong `send-message.usecase.ts`.
- Client dedupe theo `message.id` — tránh trùng khi publication + REST refetch cùng chạy.
- Chỉ dùng memory engine (single node, YAGNI). Redis engine khi multi-node.
