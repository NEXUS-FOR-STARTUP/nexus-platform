# Research: Centrifugo cho Realtime Chat

- Date: 2026-08-08
- Sources: centrifugo docs (centrifugal.dev), GitHub (centrifugal/centrifugo), context7, web search
- Scope: đánh giá Centrifugo v6 làm transport realtime cho module chat (case messages), tích hợp Hono (apps/api) + Next.js/Mantine (apps/web-1)

## Executive Summary

Chat hiện tại là REST + polling 5s (`useCaseChat` → `refetchInterval: 5000`). Centrifugo v6 giải quyết bằng WebSocket pub/sub có sẵn: auth JWT, history/recovery, presence, server API publish. Pattern chuẩn: client gửi qua REST (giữ nguyên validation + credit check) → Hono lưu DB → publish qua Centrifugo HTTP API → subscriber nhận realtime. DB vẫn là source of truth; Centrifugo chỉ là lớp transport. Khuyến nghị triển khai, chi phí hạ tầng thấp (1 container Docker), không đụng schema DB.

## Hiện trạng codebase

| Layer | File | Ghi chú |
|---|---|---|
| Frontend hook | `apps/web-1/app/dashboard/case/[id]/hooks/useCaseChat.ts` | Query + mutation, poll 5s |
| UI | `apps/web-1/app/dashboard/case/[id]/_components/TabDiscussionChat.tsx` | Virtualized list, bubble, credit lock |
| Controller | `apps/api/src/modules/cases/http/cases.controller.ts:367` | `sendMessageHandler`, `listMessagesHandler` |
| Use case | `apps/api/src/modules/cases/application/send-message.usecase.ts` | Validate trống/5000 chars/stage/credit |
| Persistence | `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts:724` | `createCaseMessage` transaction: caseMessage + caseEvent `message_sent` |
| Access | `requireCaseAccess` | Student sở hữu case, supporter được assign, admin |

Ràng buộc phải giữ: credit check server-side, case stage lock, access control theo case.

## Centrifugo v6 — facts đã verify

### Kiến trúc
- Server Go độc lập (Docker image `centrifugo/centrifugo:v6`), transport WebSocket/HTTP-streaming/gRPC
- Pub/sub channel-based, namespace configurable (history, presence, recovery, join_leave)
- Client SDK JS: `centrifuge-js` (package `centrifuge`)
- Server-side: HTTP API (`/api/publish`, `/api/history`, `/api/presence`) auth bằng `api_key` header
- Có Admin UI (web panel) optional

### Auth
- **Connect token**: JWT HMAC (`token_hmac_secret_key`). Claims: `sub` = user ID, `expire_at`, optional `subs` map (channels + per-channel options, auto-subscribe server-side)
- **Subscription token**: JWT riêng cho từng channel private — pattern chuẩn khi danh sách channel access không biết trước (admin xem mọi case) hoặc channel cần kiểm quyền runtime
- Key rotation: `hmac_previous_secret_key` + `hmac_previous_secret_key_valid_until`
- Anonymous connect: phải bật tường minh — không bật

### Channel config (namespace) cho chat
```json
{
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
  }
}
```
- `force_recovery` + history: client reconnect tự catch-up tin đã bỏ lỡ (offset/epoch)
- `presence`: đếm online trong room
- Client publish: KHÔNG bật — publish chỉ từ server (bảo mật + giữ server-side validation)

### Publish flow (pattern chuẩn, không cho client publish)
```
Client → POST /cases/:id/messages → sendMessageUseCase (credit/stage/access) → createCaseMessage (DB)
      → HTTP API POST /api/publish {channel: "chat:{caseId}", data: {message}}
      → subscribers nhận qua WebSocket
```
Client publish config nên tắt. Tin nhắn "dirty" không có cơ hội bypass DB.

### History & recovery
- REST giữ vai trò history ban đầu (paginated, DB source of truth)
- Centrifugo history dùng cho recovery sau reconnect (missed tin trong lúc mất mạng)
- Subcribe với `since: {offset, epoch}` từ SDK; publication handler xử lý chung cả live + catch-up

### SDK JS
```js
const client = new Centrifuge('ws://host/connection/websocket', {
  getToken: async () => (await fetch('/api/realtime/token')).token
});
const sub = client.newSubscription('chat:case123');
sub.on('publication', (ctx) => { /* append vào cache */ });
sub.subscribe();
client.connect();
```
- Subscription token lười: `getToken` của subscription gọi backend mỗi khi subscribe (per-channel access check)

### Deploy
- Docker compose service đơn giản, volume mount config.json, env_file
- Port mặc định 8000 — **xung đột API hiện tại (8000)** → chọn 8010 hoặc reverse proxy theo path
- Engine: memory engine đủ cho single node (YAGNI); Redis engine khi multi-node/scale

## So sánh lựa chọn

| Option | Pros | Cons |
|---|---|---|
| **Centrifugo** (khuyến nghị) | Pub/sub + recovery + presence có sẵn; scale tốt; không chiếm event loop API | Thêm 1 infra component + secret quản lý |
| SSE (Hono native) | 0 hạ tầng mới; đủ cho push 1 chiều | Không pub/sub, không recovery, chat reply vẫn phải poll/short-poll |
| Custom WebSocket (hono/ws) | Full control | Tự viết pub/sub, reconnect, heartbeat, scale — tốn công |
| Polling (hiện tại) | Đang chạy, 0 chi phí | Latency ≤5s, request rác |

Verdict: Centrifugo hợp lý nếu yêu cầu realtime thật (instant delivery, presence, offline recovery). Nếu chỉ cần "< 3s", SSE rẻ hơn nhiều. User đã chọn Centrifugo → feasibility xác nhận OK.

## Tích hợp đề xuất

### Backend (apps/api)
1. Env mới: `CENTRIFUGO_URL`, `CENTRIFUGO_TOKEN_SECRET` (chung với `token_hmac_secret_key`), `CENTRIFUGO_API_KEY`
2. Route mới `GET /api/realtime/connection-token` → connect token (sub=userId, expire ngắn 15 phút)
3. Route mới `GET /api/realtime/cases/:caseId/subscribe-token` → check `requireCaseAccess` → subscription token cho channel `chat:{caseId}` (path param, KHÔNG query `?case=` — khớp convention repo `/api/payments/:id/verify`)
4. `sendMessageUseCase` hoặc sau `createCaseMessage`: publish `{channel: "chat:{caseId}", data: message}` qua HTTP API (fire-and-forget với catch log, không fail request chính nếu Centrifugo down — tin vẫn lưu DB)
5. Optional: publish event vào các flow khác cần realtime (status change, supporter assigned) — scope later

### Frontend (apps/web-1)
1. Package `centrifuge`
2. Hook `useRealtimeChat(caseId)`: singleton Centrifuge client (module-level), subscribe `chat:{caseId}`, `on('publication')` → append message vào `useQueryClient` cache (`queryClient.setQueryData`) với dedupe theo message id
3. Giữ REST làm nguồn: mount → refetch; send vẫn qua REST (đảm bảo credit check); publication event trigger invalidate nhẹ để đồng bộ (nếu chỉ append cache, race: user A gửi, cache có, refetch thêm lần nữa → dedupe bằng id)
4. Bỏ `refetchInterval: 5000` (fallback giữ 30-60s để phòng hở kết nối)
5. Typing indicator + presence: phase sau (presence đã config sẵn namespace)

### Infra
- `docker-compose` thêm service centrifugo (port 8010)
- Production: nginx/Caddy route `/connection/*` → centrifugo; `allowed_origins` giới hạn domain web
- Không cần migration DB

## Rủi ro

- **Race giữa DB commit và publish**: publish sau DB success; nếu publish fail → client chưa thấy tin nhưng refetch REST (fallback) tự bù — chấp nhận được
- **Duplicate**: message id trong payload publication → dedupe phía client
- **Secret lộ**: token secret chia sẻ 2 nơi (API env + centrifugo config) — quản lý như JWT secret khác
- **Port 8000 conflict**: đổi port centrifugo
- **Admin access toàn case**: token claim không nhồi hết channel → dùng subscription token lười
- **Cost/ops**: thêm container = thêm chỗ monitoring; single node không HA (chấp nhận MVP)

## Decisions (2026-08-08)

- Scope: chỉ chat case messages realtime. Notification push phase sau
- Presence/typing indicator: KHÔNG trong MVP (namespace đã config presence sẵn, bật sau không đụng code)
- Deploy: Docker compose trên VPS hiện tại, nginx route `/connection/*` → centrifugo port 8010
- Deliverables: code API (2 route token + publish hook) + frontend hook + docker-compose service + nginx route + env mẫu
- Tests: có — token routes + publish call (mock HTTP), khớp test infra (node:test)
- Delivery status (sent/seen): KHÔNG cần
- Urgency: bình thường — plan bài bản, full test

## Next steps

1. Confirm scope: chỉ chat case hay kèm notification push realtime
2. Confirm yêu cầu: typing indicator + presence trong MVP?
3. Confirm deploy target: VPS Docker compose hay cloud (đã có docker-build-push-guide + ci-guide)
4. Draft implementation plan (backend token routes → publish hook → frontend hook → docker compose)

## Unresolved questions

- Nhu cầu presence/typing trong MVP?
- Notifications (notification-outbox) có cần realtime push luôn không — Centrifugo 1 lần cài cho cả 2?
- Production Centrifugo đặt sau nginx sẵn có hay port riêng?
