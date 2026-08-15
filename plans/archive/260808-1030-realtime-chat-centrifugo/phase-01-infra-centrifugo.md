# Phase 1 — Infra: Centrifugo + Docker + Traefik + env

- Priority: P1 | Status: Completed | Effort: 2h
- Dependencies: none. Base cho mọi phase (định nghĩa env names + channel contract)

## Overview

Thêm service Centrifugo v6 vào `docker-compose.prod.yml`, config.json commit vào repo, Traefik router cho WebSocket, 4 env vars mới. **Không expose port ra host** — Traefik route theo path `/connection/*`, API gọi internal qua docker network.

## Key Insights

- Centrifugo v6 config **nested**: `client.token.hmac_secret_key`, `http_api.key` (KHÔNG phải flat `token_hmac_secret_key` như v5)
- Env vars override config file: prefix `CENTRIFUGO_` + nhánh config (`CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY`). Dùng để inject secret từ .env.prod, config.json giữ cấu trúc
- Client publish default tắt → namespace chat chỉ cần history/presence, không bật publish
- Port default 8000 xung đột API → giữ internal 8000 (docker network riêng, không publish host port)
- Traefik: WebSocket cần router riêng, KHÔNG compress (giống bài học SSE stream router — compress treo connection)
- **Dev origin**: web-1 dev = `http://localhost:3001` (http, port 3001) → allowed_origins mặc định phải đúng scheme, không là https
- **Secret single source**: dev container `-e` values PHẢI khớp `.env` — lệch ký tự = token sign sai / publish 401
- **Không phụ thuộc DB**: centrifugo không cần `depends_on: db` — db healthcheck flap không được kéo restart

## CẢNH BÁO — tài liệu tham khảo cũ (dự án hoidn) viết cho v5, KHÔNG hợp lệ v6

Lưu ý dưới đây chắt lọc từ tài liệu reference của dự án khác (hoidn, đã xoá — nội dung sai v5). Config mẫu, env name, syntax trong đó **KHÔNG hợp lệ v6**. Đừng copy. Cụ thể:

| hoidn doc (v5) | Thực tế v6 | Hậu quả nếu copy |
|---|---|---|
| Config flat: `token_hmac_secret_key`, `api_key`, `namespaces` | Nested: `client.token.hmac_secret_key`, `http_api.key`, `channel.namespaces` | Config invalid → **exit code 1** (startup fail) |
| Env `CENTRIFUGO_TOKEN_HMAC_SECRET_KEY` | `CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY` | Env v5 bị coi unknown key → **WARN**, secret không set → client verify fail |
| `$CENTRIFUGO_TOKEN_SECRET` interpolate trong config.json | KHÔNG hỗ trợ `$VAR` trong config file (chỉ env override; `CENTRIFUGO_VAR_` prefix chỉ cho MapStringString, v6.3+) | Secret rỗng → dùng "changeme" placeholder |
| `subscribe_to_publish` | `allow_publish_for_subscriber` | Unknown key → WARN/exit |
| Config v5 converter | Dùng converter online: paste v5 → v6 | — |

Nguồn verify: https://centrifugal.dev/docs/getting-started/migration_v6 + /docs/server/configuration (đã đọc 2026-08-08).

**Empty env var = unset**: nếu `${CENTRIFUGO_TOKEN_SECRET}` không resolve được lúc compose up → biến coi như unset → fallback config file ("changeme") → publish 401 / token verify fail **im lặng**. Compose interpolate từ `.env` root hoặc `--env-file .env.prod` — pattern y hệt `${DOMAIN}` đang chạy ổn trong compose.

## Config chuẩn

### centrifugo/config.json (MỚI — root repo)

```json
{
  "client": {
    "token": {
      "hmac_secret_key": "changeme"
    },
    "allowed_origins": ["http://localhost:3001"],
    "user_connection_limit": 5,
    "connection_limit": 1000,
    "connection_rate_limit": 50
  },
  "http_api": {
    "key": "changeme"
  },
  "channel": {
    "namespaces": [
      {
        "name": "chat",
        "history_size": 300,
        "history_ttl": "600s",
        "force_recovery": true,
        "presence": true,
        "join_leave": false
      }
    ]
  },
  "http_server": {
    "port": 8000
  },
  "health": {
    "enabled": true
  },
  "log": {
    "level": "info"
  },
  "admin": {
    "enabled": false
  }
}
```

- `history_size 300` + `history_ttl 600s` + `force_recovery` — recovery reconnect mất mạng
- `presence: true` — bật sẵn (scope sau), không tốn đáng kể
- `user_connection_limit: 5` — 1 user max 5 connection (chống 1 user mở hàng trăm tab)
- `connection_limit: 1000` — max connection 1 node (chống WebSocket flood)
- `connection_rate_limit: 50` — max 50 connection mới/giây (DoS mitigation — skill backend security: rate limiting). Over → 503, SDK tự backoff reconnect
- Secret giữ "changeme" — prod override bằng env (dưới)

### docker-compose.prod.yml (SỬA — thêm service)

```yaml
  centrifugo:
    image: centrifugo/centrifugo:v6   # implement: đổi sang exact minor (vd :v6.8.3) sau khi verify — repo pin exact (postgres:18.4, node:24.18.0-alpine)
    container_name: nexus-centrifugo
    restart: unless-stopped
    stop_grace_period: 10s
    # KHÔNG env_file .env.prod — Centrifugo parse mọi var prefix CENTRIFUGO_ thành config keys:
    # CENTRIFUGO_URL/CENTRIFUGO_API_KEY/CENTRIFUGO_TOKEN_SECRET = unknown keys → WARN noise khi start.
    # Chỉ inject đúng 3 var override (đủ bí mật cần thiết), interpolate từ .env/--env-file như ${DOMAIN}.
    environment:
      CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY: ${CENTRIFUGO_TOKEN_SECRET}
      CENTRIFUGO_HTTP_API_KEY: ${CENTRIFUGO_API_KEY}
      CENTRIFUGO_CLIENT_ALLOWED_ORIGINS: "https://${DOMAIN}"
    volumes:
      - ./centrifugo/config.json:/centrifugo/config.json:ro
    command: centrifugo -c /centrifugo/config.json
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8000/health || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
    networks:
      - nexus-network
      - proxy-net
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
        reservations:
          cpus: "0.1"
          memory: 128M
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=proxy-net"
      - "traefik.http.routers.nexus-centrifugo.rule=Host(`${DOMAIN}`) && PathPrefix(`/connection`)"
      - "traefik.http.routers.nexus-centrifugo.entrypoints=websecure"
      - "traefik.http.routers.nexus-centrifugo.tls=true"
      - "traefik.http.routers.nexus-centrifugo.tls.certresolver=letsencrypt"
      - "traefik.http.routers.nexus-centrifugo.middlewares=security-headers"
      - "traefik.http.services.nexus-centrifugo.loadbalancer.server.port=8000"
```

Ghi chú:
- `nexus-network` — API gọi publish internal (`http://centrifugo:8000`)
- `proxy-net` — Traefik reach WebSocket
- Không dùng `compress` middleware (websocket handshake hỏng)
- Không thêm `/connection` vào router `nexus-api` — để router riêng, dễ debug
- KHÔNG dùng `env_file` cho centrifugo (đã giải thích ở comment block) — unknown `CENTRIFUGO_*` env → WARN mỗi start, khó đọc log
- `CENTRIFUGO_CLIENT_ALLOWED_ORIGINS` là **array of strings** — env dạng space-separated: `"https://domain1 https://domain2"`. Chỉ 1 origin prod nên đơn giản

### Env (SỬA .env.example, .env, .env.prod)

```
# Centrifugo realtime
CENTRIFUGO_URL=http://centrifugo:8000          # API→centrifugo internal (dev: http://localhost:8010)
CENTRIFUGO_TOKEN_SECRET=<openssl rand -hex 32 output>  # KHỚP client.token.hmac_secret_key — đủ 64 hex chars
CENTRIFUGO_API_KEY=<openssl rand -hex 32 output>       # KHỚP http_api.key
NEXT_PUBLIC_CENTRIFUGO_URL=wss://${DOMAIN}/connection/websocket  # prod: thay ${DOMAIN}; dev: ws://localhost:8010/connection/websocket
```

Secret sinh: `openssl rand -hex 32` cho cả 2 (64 ký tự — đủ ≥32 bytes). **Chính secret này phải dùng cho cả dev container (step 4) và sign token API (phase 2)** — single source, không tự bịa thêm.

## Implementation Steps

1. Tạo `centrifugo/config.json` (nội dung trên)
2. Sửa `docker-compose.prod.yml` — thêm service (block trên)
3. Thêm 4 vars vào `.env.example`, `.env`, `.env.prod` — sinh secret thật bằng `openssl rand -hex 32`
4. Dev local (không cần Traefik): chạy thử — **dùng đúng secret từ `.env`**:
   ```bash
   docker run -d --name centrifugo-dev -p 8010:8000 \
     -e CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY=${CENTRIFUGO_TOKEN_SECRET} \
     -e CENTRIFUGO_HTTP_API_KEY=${CENTRIFUGO_API_KEY} \
     -v $(pwd)/centrifugo/config.json:/centrifugo/config.json:ro \
     centrifugo/centrifugo:v6 -c /centrifugo/config.json
   ```
   Verify: `curl http://localhost:8010/health` → 200; log không warning unknown key
   Lệch secret giữa container và `.env` → phase 2+ token sign không khớp verify — 401 lúc connect

## Todo List

- [x] centrifugo/config.json tạo
- [x] docker-compose.prod.yml service + labels
- [x] .env.example + .env + .env.prod +4 vars
- [x] Dev container chạy, health OK

## Success Criteria

- `docker compose -f docker-compose.prod.yml config` parse OK
- Centrifugo start log: `config valid`, không warning unknown keys
- `/health` 200 từ container
- Traefik (sau deploy): `wss://domain/connection/websocket` handshake 400 (đúng — chưa có token) thay vì 404

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Config v5 format nhầm (copy hoidn doc) | Dùng nested v6 — verify bằng log warning khi start (config sai → exit code 1). Xem bảng cảnh báo v5 ở Key Insights |
| Env name v5 (`CENTRIFUGO_TOKEN_HMAC_SECRET_KEY`) | v6 = `CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY` — mọi var `CENTRIFUGO_*` parse thành config keys, sai tên = silent no-op |
| allowed_origins chặn dev | config mặc định `http://localhost:3001`; prod override `https://${DOMAIN}` |
| Quên network proxy-net | WebSocket 404 qua Traefik — check 2 networks |
| Secret lệch dev container vs .env | Step 4 dùng `${CENTRIFUGO_TOKEN_SECRET}` trực tiếp — single source |
| `${CENTRIFUGO_TOKEN_SECRET}` empty lúc compose up | Empty env = unset → fallback "changeme" → publish 401 im lặng. Verify `docker compose config` in ra giá trị, không rỗng |
| security-headers middleware phụ thuộc container api | Middleware định nghĩa trên api labels — api dừng thì router centrifugo lỗi. Chấp nhận (cùng compose, cùng lifecycle); note khi tách service |

## Security Considerations

- `CENTRIFUGO_TOKEN_SECRET` + `CENTRIFUGO_API_KEY` = 32-hex random, không commit
- Admin UI tắt (`admin.enabled: false`) — bớt 1 attack surface (hoidn doc bật admin — không copy, ta không cần)
- `allowed_origins` giới hạn domain thật (chống WebSocket hijack/CSRF)
- Không bind port host — chỉ docker network internal + Traefik path
- `$VAR` interpolation trong config.json không được v6 hỗ trợ — secret chỉ qua env override, không lọt vào config file commit

## Next Steps

→ Phase 2 (token routes) cần `CENTRIFUGO_TOKEN_SECRET` + channel naming convention từ phase này
