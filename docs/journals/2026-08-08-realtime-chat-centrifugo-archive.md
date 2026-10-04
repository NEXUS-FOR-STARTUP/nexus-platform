# Journal — 2026-08-08: Realtime chat Centrifugo — archive khi plan còn in-progress

**Date:** 2026-08-08
**Branch:** `feat/realtime-chat-centrifugo` (merged vào dev qua PR #10, commit `73d0f29`)
**Plan:** `plans/260808-1030-realtime-chat-centrifugo/` — archived khi phase 5 chưa hoàn tất
**Status:** Archive — implement xong, verify runtime CÒN PENDING

## Sự kiện

Plan "Realtime Chat với Centrifugo" được archive dù status vẫn `in-progress`. Phase 1-4 hoàn tất (infra, token routes, publish, frontend), phase 5 mới một phần: test viết đủ 4 nhóm A-D + type-check PASS, nhưng **`npm test` bị skip theo quyết định user** — chưa có Centrifugo container, tránh suite treo. E2E manual + deploy checklist chưa làm.

Đáng chú ý: branch vẫn được merge vào dev (PR #10) ở trạng thái "chưa verify runtime" — code sống trong codebase chính nhưng chưa từng chạy realtime end-to-end.

## Việc đã làm

- **Phase 1**: `centrifugo/config.json` (config v6 nested + DoS limits), service compose (2 networks, Traefik labels `/connection/*`, healthcheck, resource limits), 4 env vars. Health 200 verified.
- **Phase 2**: module `realtime` — jose HS256, 2 routes `/api/realtime/connection-token` + `/cases/:caseId/subscribe-token`, envelope `{error}`, 503 khi thiếu secret. check-types PASS.
- **Phase 3**: `publishToChannel` (AbortController 3s, env per-call, never throw) wire vào `send-message.usecase`, fire-and-forget, sanitize sender `{id,name,role,image}`.
- **Phase 4**: centrifuge SDK 5.7.0, client singleton, `useRealtimeChat` (dedupe id + sort created_at), polling 5s→60s fallback, session-change disconnect, Dockerfile giữ cả 2 build-arg.
- **Phase 5 (phần có)**: phase-09 test 4 nhóm + cleanup, check-types root 3/3, eslint sạch, `npm audit` không vuln jose/centrifuge.

## Quyết định chốt

| Chủ đề | Quyết định |
|---|---|
| Publish | Server-side only — client KHÔNG publish, DB vẫn source of truth |
| Event-bus | Skip — notification-listener auto-register mọi DOMAIN_EVENTS sẽ lọt pipeline |
| Auth | Connect + subscription token JWT, cả 2 exp 15m, HS256 (hmac_secret_key bắt buộc) |
| Namespace | `chat:{caseId}` — history 300/600s, force_recovery |
| Access revocation | Chấp nhận window 15m — mất quyền tự mất sub khi refresh fail |
| Schema | KHÔNG đổi — 0 migration |

## Pending (sau archive — bắt buộc trước khi dựa vào realtime)

- [ ] `npm test` API (phase-09) — cần `docker compose up centrifugo`
- [ ] E2E manual 2 tab: publish → sub → UI <1s, recovery sau mất mạng 15s, role check 3 role
- [ ] `build api` verify (jose trong image — build `--no-cache`)
- [ ] Deploy checklist VPS (ngoài scope thực thi, checklist sẵn trong phase 5): 4 env mới, config.json lên server, KHÔNG migration, giữ cả 2 build-arg web
- [ ] Smoke 2 token endpoints

## Cảm nghĩ

Archive giữa chừng khi phase 5 còn test chưa chạy là điểm yếu thật: "type-check PASS" nghe yên tâm nhưng chưa chứng minh gì về runtime. Code merge vào dev rồi mà chưa ai thấy WebSocket hoạt động — cái rủi ro nằm đấy, không phải ở logic token hay publish (những cái đó design kỹ, red team bắt sớm version trap SDK 5.7.0 ≠ server v6, mất build-arg prod, session-change trap). Lần sau: verify environment chạy được TRƯỚC khi viết test, đừng để suite treo giữa chừng rồi skip; và cân nhắc không merge branch khi verify runtime chưa xong — merge rồi thì checklist phải là ưu tiên đầu tiên của ai đó tiếp quản realtime.
