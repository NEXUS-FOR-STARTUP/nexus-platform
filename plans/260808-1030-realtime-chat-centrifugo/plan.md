---
title: "Realtime Chat với Centrifugo"
description: "Chat case messages realtime qua Centrifugo v6: JWT token routes, server-side publish, centrifuge-js hook, Docker/Traefik deploy. Không đổi schema DB."
status: in-progress
priority: P1
effort: 11h
issue: null
branch: feat/realtime-chat-centrifugo
tags: [feature, realtime, backend, frontend, infra]
blockedBy: []
blocks: []
created: 2026-08-08
---

# Realtime Chat với Centrifugo

## Overview

Thay polling 5s chat case bằng realtime WebSocket Centrifugo v6. Giữ REST là source of truth: client gửi qua POST (validation + credit check giữ nguyên), backend lưu DB rồi publish qua Centrifugo HTTP API, subscriber nhận realtime. Không đổi Prisma schema — không migration.

Nguồn thiết kế: `research/centrifugo-realtime-chat-2026-08-08.md` (cùng thư mục plan)

## Quyết định đã chốt (brainstorm)

| Chủ đề | Quyết định |
|---|---|
| Scope | Chỉ chat case messages. Notification push phase sau |
| Transport | Centrifugo v6 (Docker image `centrifugo/centrifugo:v6`) |
| Publish | Server-side only. Client KHÔNG publish (không config `publish` cho namespace chat) |
| Source of truth | DB (`case_messages`). Centrifugo = lớp transport + recovery |
| Auth | Connect token JWT (15m, SDK auto-refresh) + subscription token JWT per channel (15m) |
| Namespace | `chat:{caseId}` — history_size 300, history_ttl 600s, force_recovery, presence (bật sẵn cho tương lai) |
| Presence/typing | Không trong MVP |
| Delivery status | Không |
| Deploy | Service `centrifugo` trong docker-compose.prod.yml, Traefik router `/connection/*`, port internal 8000 |
| Tests | Có — `phase-09-realtime-chat.test.ts` (node:test, DB local, mock fetch) |
| Deploy | KHÔNG trong scope thực thi (user tự deploy sau; checklist phase 5 để sẵn) |
| Skip event-bus | Không tái dùng event-bus cho publish: notification-listener auto-register mọi DOMAIN_EVENTS → `case.message_sent` sẽ lọt vào notification pipeline. Gọi trực tiếp publish service trong usecase (KISS, khớp pragmatism project) |
| Access revocation | Chấp nhận window 15m (token TTL) — member bị xóa quyền tự mất sub khi refresh fail |

## Đối chiếu backend skill (2026-08-08 — 11 refs đã đọc)

| Skill ref | Áp dụng vào plan |
|---|---|
| API design: tránh `?id=` RPC-style | `subscribe-token` dùng path param `/cases/:caseId/...` khớp `/api/payments/:id/verify` |
| Auth: HS256 khuyến nghị RS256 | Centrifugo `hmac_secret_key` chỉ hỗ trợ HMAC → HS256 bắt buộc; secret 64-hex đủ mạnh |
| Auth: JWT 15m, minimal claims | exp 15m, chỉ `sub`+`channel` |
| Security: rate limiting chống abuse | `connection_limit` 1000, `connection_rate_limit` 50/s, `user_connection_limit` 5 (Centrifugo built-in, zero code) |
| Security: log auth events | `logger.info` mỗi lần sign token (không log token value) |
| Security: error không leak system info | Envelope `{error}` khớp repo, 503 không detail |
| Testing: test pyramid + clean test data | Nhóm A unit / B mock / C-D integration + DB thật; nhóm D dọn data sau test |
| Code quality: no magic numbers | `TOKEN_TTL_SECONDS`, `PUBLISH_TIMEOUT_MS` const |
| Performance: timeout external call | AbortController 3s + fire-and-forget + fallback refetch 60s (graceful degradation) |
| DevOps: health check + resource limits | compose healthcheck + CPU/mem limits |
| SCA | `npm audit` trong verify chain phase 5 (jose + centrifuge) |
| Không áp dụng (over-engineering cho MVP) | Circuit breaker lib, Redis engine (memory engine đủ 1 node), API versioning, OpenAPI docs, metrics stack |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Infra: Centrifugo + Docker + Traefik + env](./phase-01-infra-centrifugo.md) | ✅ Completed |
| 2 | [Backend: realtime module + token routes](./phase-02-backend-token-routes.md) | ✅ Completed |
| 3 | [Backend: publish service + wire send-message](./phase-03-backend-publish.md) | ✅ Completed |
| 4 | [Frontend: centrifuge-js + hook + Dockerfile ARG](./phase-04-frontend-realtime.md) | ✅ Completed |
| 5 | [Tests + verify + deploy checklist](./phase-05-tests-verify.md) | ⏳ In-Progress — test run skipped theo user, E2E pending |

## Implementation Log

**2026-08-08 — Sync-back sau implement (chưa commit; branch `feat/realtime-chat-centrifugo`)**

| Phase | Kết quả | Ghi chú / Deviation |
|---|---|---|
| 1 | ✅ Completed | Config v6 nested + DoS limits + secret placeholder; compose service (2 networks, Traefik labels, healthcheck, resource limits); 4 env vars, secret 64-hex đã sinh. Verify: `docker compose config` PASS, health 200, 0 WARN |
| 2 | ✅ Completed | realtime module + jose 6.2.8; mount `/api/realtime`; envelope `{token}/{error}`, 503 khi thiếu secret. check-types PASS. Deviation: `c.req.param("caseId") ?? ""` (Hono param có thể undefined) |
| 3 | ✅ Completed | `centrifugo.service.ts` (timeout 3s, AbortController, env per-call, never throw, `response.body?.cancel()` error path); wire send-message (void fire-and-forget, `toPublishMessage` sanitize sender `{id,name,role,image}`). Khớp plan 100%, check-types PASS |
| 4 | ✅ Completed | centrifuge 5.7.0; singleton client; useRealtimeChat (dedupe id + sort created_at + cleanup); refetchInterval 5000→60000; TabDiscussionChat +2 dòng; Dockerfile ARG; build guide update. check-types PASS, lint sạch. Deviation: DashboardShell.tsx ngoài ownership list (justify: session change → disconnect) |
| 5 | ⏳ In-Progress | phase-09 test viết đủ 4 nhóm A-D + cleanup, type-check file PASS. **npm test BỊ SKIP theo quyết định user** (chưa có Centrifugo container — tránh treo). Verify chain: check-types root 3/3 PASS, eslint file mới sạch, npm audit không vuln jose/centrifuge (17 pre-existing không liên quan). E2E manual + build api CHƯA làm |

Còn lại (gom phase 5, khi có Centrifugo container): smoke 2 token endpoints (P2), smoke publish (P3), `npm test` API run, build api, E2E manual 2 tab + recovery, deploy checklist VPS (ngoài scope).

## Dependencies (chuỗi bắt buộc)

```
Phase 1 (infra config contract: env names, channel name, config.json)
  └─ Phase 2 (token routes — cần CENTRIFUGO_TOKEN_SECRET env + channel name helper)
       └─ Phase 3 (publish — cần CENTRIFUGO_URL/API_KEY + reuse module realtime)
            └─ Phase 4 (frontend — cần token endpoints phase 2 + NEXT_PUBLIC_CENTRIFUGO_URL phase 1)
                 └─ Phase 5 (tests + deploy verify — cần mọi thứ)
```

Sequential, không parallel (file chung: env, realtime module).

## Files map tổng

```
MỚI  centrifugo/config.json
MỚI  apps/api/src/modules/realtime/domain/realtime.types.ts
MỚI  apps/api/src/modules/realtime/infrastructure/centrifugo-token.service.ts
MỚI  apps/api/src/modules/realtime/infrastructure/centrifugo.service.ts
MỚI  apps/api/src/modules/realtime/http/realtime.routes.ts
MỚI  apps/api/src/modules/realtime/http/realtime.controller.ts
MỚI  apps/api/src/shared/infrastructure/tests/phase-09-realtime-chat.test.ts
MỚI  apps/web-1/lib/realtime/centrifuge-client.ts
MỚI  apps/web-1/app/dashboard/case/[id]/hooks/useRealtimeChat.ts
SỬA  docker-compose.prod.yml
SỬA  .env.example, .env, .env.prod
SỬA  apps/api/src/index.ts
SỬA  apps/api/src/modules/cases/application/send-message.usecase.ts
SỬA  apps/api/package.json (+jose)
SỬA  apps/web-1/package.json (+centrifuge)
SỬA  apps/web-1/app/dashboard/case/[id]/hooks/useCaseChat.ts
SỬA  apps/web-1/app/dashboard/case/[id]/_components/TabDiscussionChat.tsx
SỬA  apps/web-1/Dockerfile (+ARG NEXT_PUBLIC_CENTRIFUGO_URL)   ← trap: build-time inline
SỬA  docs/docker-build-push-guide.md (build arg)
KHÔNG ĐỔI  prisma/schema.prisma — KHÔNG migration
```

## Rủi ro chính

| Rủi ro | Giảm thiểu |
|---|---|
| Publish fail sau DB commit | Fire-and-forget + catch log. Tin vẫn trong DB. Client fallback refetch 60s tự bù |
| Duplicate message (publish + refetch) | Dedupe theo `message.id` phía client khi append cache |
| Token secret lệch 2 nơi | 1 nguồn: `CENTRIFUGO_TOKEN_SECRET` env → vừa sign (API) vừa override config (compose) |
| WebSocket qua Traefik treo | Router riêng `/connection`, KHÔNG compress middleware |
| NEXT_PUBLIC_CENTRIFUGO_URL quên build arg | Phase 4 sửa Dockerfile + build guide; phase 5 verify image build |
| Port xung đột | Centrifugo internal 8000 (docker network), không expose host; Traefik route theo path |
| Secret lộ git | .env.prod đã gitignore; config.json giữ secret placeholder "changeme" + env override |
| Quên register listener/relay pattern | Index.ts mount router như notificationsRouter (đã có mẫu) |

## Success Criteria

- Gửi tin A → user B nhận <1s qua WebSocket (không cần F5)
- Reconnect mất mạng ngắn → recovery tự catch-up tin lỡ (centrifugo history)
- Credit check, stage lock, access control không đổi — vẫn chặn như REST cũ
- Polling 5s bị loại (fallback 60s giữ lại)
- `npm test` API pass (gồm phase-09 mới), check-types root 3/3, lint web 0 warning
- Deploy: 1 container mới, không migration, không đổi CORS
