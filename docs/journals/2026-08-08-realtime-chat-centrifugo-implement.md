# Journal: Realtime chat Centrifugo — implement hoàn tất

**Date:** 2026-08-08

**Branch:** `feat/realtime-chat-centrifugo` (chưa commit)

**Plan:** `plans/260808-1030-realtime-chat-centrifugo/plan.md` (skill ck:cook --parallel)

**Status:** Implement xong 5 phase — test run PENDING (quyết định user), E2E chưa làm, deploy ngoài scope.

## Feature

Thay polling 5s bằng realtime chat case messages qua Centrifugo v6 (Docker `centrifugo/centrifugo:v6`), publish server-side, DB vẫn source of truth. Không đổi Prisma schema — không migration.

## Quyết định chính

1. **Transport**: Centrifugo v6 + SDK `centrifuge@^5.7.0` — red team bắt version trap từ plan: server major ≠ SDK major.
2. **Auth**: JWT HS256 (jose), 2 routes path-param (connect token + subscription token), envelope `{error}`; 503 guard nếu thiếu secret — không crash âm thầm.
3. **Publish fire-and-forget** trong `send-message.usecase` — KHÔNG qua event-bus (notification-listener auto-register mọi DOMAIN_EVENTS sẽ lọt pipeline). `publishToChannel`: AbortController timeout 3s, env đọc per-call (không đọc lúc module load), never throw, cancel response body.
4. **Sanitize sender payload** — không leak User row (email) vào history Centrifugo (lưu 600s).
5. **Frontend**: client singleton, `useRealtimeChat` dedupe id + sort created_at; polling 5s→60s fallback khi socket không connect; session-change guard disconnect.
6. **Dockerfile web** giữ cả 2 build-arg (NEXT_PUBLIC_API_URL cũ + arg mới) — tránh prod web chết im lặng (lỗi red team đã chỉ từ phase plan).

## Kết quả

- **Phase 1**: `centrifugo/config.json` (v6 nested config, DoS limits), compose service, 4 env vars. Health verified 200.
- **Phase 2**: realtime module — token service jose HS256, 2 routes, 503 guard.
- **Phase 3**: `publishToChannel` + wire vào `send-message.usecase`.
- **Phase 4**: client singleton + hook + fallback + session guard + Dockerfile ARG.
- **Phase 5**: test 4 nhóm viết đủ, type-check PASS. Review APPROVED-WITH-FIXES → đã fix sort messages + cancel response body.

## Trắc trở

1. **Test cwd/env loading trap** (đáng nhớ nhất): lần chạy test đầu fail vì cwd sai → 0 env injected. Đã fix. Nhưng suite vẫn treo — user bảo dừng, quyết định KHÔNG chạy `npm test` (chưa có Centrifugo container chạy). Hệ quả: phase 5 có file test + type-check PASS nhưng **chưa bao giờ chạy thật**. Đây là rủi ro thực, không phải thành tích.
2. **Test file 341 dòng** vượt limit 200 — giữ có chủ đích vì mọi test file repo đều >200 (limit linh hoạt cho test). Review chấp nhận.
3. **`as any` mới 1 chỗ** — biết là anti-pattern (repo đã 107 chỗ), chấp nhận để qua type-check. Cần theo dõi.
4. **Fallback 5s→60s** — trade-off latency khi Centrifugo down, đổi trước đây là polling 5s.

## Verify

- `check-types` root: 3/3 workspace PASS
- Lint file mới: sạch (197 pre-existing problems — KHÔNG do feature)
- `npm audit`: không vuln jose/centrifuge

## Pending

- [ ] Chạy `npm test` phase 5 — cần Centrifugo container (compose service đã có, `docker compose up`)
- [ ] E2E realtime end-to-end: publish → subscribe → UI update
- [ ] Deploy VPS (ngoài scope: env, compose, Docker image)
- [ ] Commit branch

## Cảm nghĩ

Red team từ phase plan đáng giá — bắt trước lỗi SDK version, mất build-arg prod, session-change trap; implement đi thẳng không lệch plan nhiều. Nhưng test không chạy được là điểm yếu thật: "type-check PASS" nghe yên tâm nhưng chưa chứng minh gì về runtime. Trap cwd lúc chạy test là lỗi quy trình của chính mình — đáng lẽ chạy test từ root repo ngay từ đầu, không để user phải dừng suite treo giữa chừng. Lần sau: trước khi viết test, verify environment chạy được, không viết test rồi để đó.
