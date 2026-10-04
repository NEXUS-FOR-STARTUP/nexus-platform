# Brainstorm: Hệ thống Notification

> ✅ **IMPLEMENTED 2026-08-07** — commit `3f07bd5`. Chi tiết triển khai: `plans/260807-0254-notification-system/plan.md` + các phase.

**Ngày:** 2026-08-07
**Trạng thái:** Đã chốt thiết kế, chưa implement

## 1. Problem & Requirements

Nexus Platform không có notification. Người dùng (student/supporter/admin) phải tự mở trang để biết trạng thái case — case mới, đổi stage, supporter phản hồi, payment proof cần duyệt.

**Kênh:** In-app + Email (Resend) + Telegram bot
**Real-time:** SSE (Server-Sent Events), 1 chiều server→client
**Người nhận:** Student, Supporter, Admin
**Phạm vi MVP:** Chỉ case workflow
**Deploy:** 1 API instance (in-memory SSE registry OK)

## 2. Đã cân nhắc

| Approach | Verdict | Lý do |
|---|---|---|
| Polling 30-60s | Loại | User chọn SSE; polling không cần nhưng SSE không đắt hơn nhiều |
| SSE + refetch on event | **Chọn** | SSE chỉ gửi ping "có notification mới" → client gọi lại REST. Tránh stream JSON phức tạp, mất connection không mất dữ liệu (fallback = list endpoint) |
| WebSocket | Loại | 2 chiều không cần, không có chat real-time |
| Gọi notification service trực tiếp từ mỗi usecase | Loại | Rải rác, module notifications phụ thuộc ngược vào mọi module |
| Event bus in-process (EventEmitter) | **Chọn** | Codebase đang "direct module-to-module calls (no event bus)" — đây là chỗ đúng để giới thiệu. Usecase emit event, notification module subscribe |
| Outbox pattern + worker | **Chọn (đơn giản hóa)** | Chuẩn industry chống mất notification. Không cần Kafka — 1 instance: listener ghi outbox rows → relay worker (setInterval 2s) xử lý + retry. 2 file, 0 dep mới. Xem `docs/research-notifications-architecture-2026-08-07.md` |
| Redis pub/sub | Loại | 1 instance — không cần |

## 3. Kiến trúc chốt

```
                    ┌────────────────────────────┐
 usecase cũ         │  shared/infrastructure/     │
 (cases, payments,  │  event-bus.ts (EventEmitter)│
  supporter...)     └──────────────┬─────────────┘
     emit event                    │ emit (async, fire-and-forget)
                                   ▼
                    ┌────────────────────────────┐
                    │ modules/notifications/      │
                    │  listener.ts                │
                    │  - ghi outbox rows          │
                    │  (không IO ngoài, nhanh)    │
                    └──────────────┬─────────────┘
                                   │ insert
                                   ▼
                    ┌────────────────────────────┐
                    │ (notifications.notification_outbox)│
                    └──────────────┬─────────────┘
                                   │ relay worker (setInterval 2s)
                                   ▼
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     fan-out in-app rows    Resend email        Telegram
     (per recipient)        (retry backoff)     (retry backoff)
              │                    │                    │
              └── thành công → mark outbox sent; fail → attempts++/next_retry_at
                                   ▼
                    ┌────────────────────────────┐
                    │ infrastructure/sse-hub.ts   │
                    │ Map<userId, controller[]>   │
                    │ push ping → client refetch  │
                    └────────────────────────────┘
```

**Nguyên tắc:**
- Notification không bao giờ block usecase chính — emit async; listener chỉ ghi DB; relay xử lý kênh ngoài (email/telegram) với retry exponential backoff (2s→8s→32s→2m→10m, max 5 attempts, sau đó log + bỏ)
- In-app rows là fan-out on write (1 row/recipient) — chuẩn industry cho quy mô nhỏ
- Crash/restart → pending outbox rows xử lý lại — không mất notification (transactional outbox pattern)
- Module mới `notifications` theo clean architecture chuẩn codebase (domain/application/infrastructure/http)
- Correlation: mọi log channel send kèm `notification_id`

## 4. Data model (Prisma, plural snake_case)

```prisma
model notifications {
  id             String   @id @default(cuid())
  user_id        String
  type           String   // case_created, payment_proof_uploaded, stage_changed, report_ready, request_more_info...
  title          String
  body           String?
  link           String?  // deep link frontend theo role receiver
  case_id        String?
  payment_id     String?
  metadata_json  Json?
  read_at        DateTime?
  created_at     DateTime @default(now())
  @@index([user_id, read_at])
  @@index([user_id, created_at])
}

model notification_outbox {
  id            String   @id @default(cuid())
  type          String   // domain event type
  recipient     String   // user_id hoặc telegram chat_id đặc biệt
  channel       String   // "in_app" | "email" | "telegram"
  title         String
  body          String?
  link          String?
  payload_json  Json?    // case_id, payment_id... cho template + log
  status        String   @default("pending") // pending | sent | failed
  attempts      Int      @default(0)
  next_retry_at DateTime?
  created_at    DateTime @default(now())
  processed_at  DateTime?
  @@index([status, next_retry_at])
}
```

## 5. Trigger points (event → ai nhận → nội dung)

| Event | Emit từ | Người nhận | Nội dung |
|---|---|---|---|
| `case.created` | create-case.usecase | Student (owner) | "Case đã tạo, chờ xử lý" |
| `case.assigned` | assign-supporter usecase (admin) | Supporter + Student | "Case được giao cho bạn" / "Đã có supporter phụ trách" |
| `case.approved` | approve/accept usecase (admin) | Student | "Hồ sơ đã được duyệt" |
| `case.rejected` | reject-case usecase (admin) | Student | "Hồ sơ bị từ chối" |
| `payment.proof_uploaded` | upload-payment-proof.usecase | Admin | "Minh chứng thanh toán cần duyệt" |
| `payment.verified/rejected` | payment verify usecase (admin) | Student (owner + members) | "Thanh toán đã duyệt / bị từ chối" |
| `case.stage_changed` | case transition usecase | Student + Supporter | "Case chuyển sang <stage>" |
| `report.published` | publish-report.usecase | Student | "Báo cáo đã sẵn sàng" |
| `supporter.request_more_info` | supporter-request-more-info.usecase | Student | "Cần bổ sung thông tin" |
| `case.closed` | close-case.usecase | Student | "Case đã đóng" |

**Quy tắc skip actor:** người thực hiện hành động không nhận notification của chính mình (supporter publish → chỉ student nhận; admin verify → chỉ student nhận).

**case.created → admin KHÔNG nhận.** Admin chỉ được nhắc qua `payment.proof_uploaded` — tránh spam case chưa thanh toán.

**Email:** gửi ngay từng event, không digest. **Đã cắt (2026-08-07):** chỉ event quan trọng — stage_changed + payment.verified-auto in-app thay thế (Resend free 100/ngày).

**Loại khỏi MVP:** deadline notification (supporter tự lo), AI analysis xong (ai-engine), SLA breach, activity feed, cleanup cũ. Thêm sau dễ — chỉ là event mới + listener mới.

## 6. API endpoints (module notifications)

```
GET    /api/notifications?page=&limit=      — list (mới nhất trước)
GET    /api/notifications/unread-count      — số badge
PATCH  /api/notifications/:id/read          — đánh dấu đọc
PATCH  /api/notifications/read-all          — đọc hết
GET    /api/notifications/stream            — SSE (auth qua cookie, như requireAuth)
```

SSE protocol: server gửi `event: ping` + `data: {unreadCount}` mỗi khi có notification mới. Client (TanStack Query `useQuery` + `EventSource`) refetch list. Heartbeat comment `: hb` mỗi 25s chống proxy timeout; `retry: 5000` field; check `stream.aborted`; header `X-Accel-Buffering: no`; EventSource `withCredentials: true` + CORS credentials (web :3001 ↔ api :8000). Reconnect mất connection → EventSource tự reconnect, refetch bảo đảm không mất data (không cần Last-Event-ID replay vì client luôn refetch).

## 7. Frontend (web-1, Mantine v9)

- `NotificationBell` component (header): bell icon + badge unread-count
- Dropdown: list 20 notification gần nhất, click → mark read + navigate `link`. Không có trang xem tất cả
- `useNotifications` hook: TanStack Query list + unread-count, `useEffect` mở EventSource `/api/notifications/stream`, refetch on ping
- App shell header (dashboard/supporter/admin đều có) — tìm chỗ mount chung
- Notification giữ vĩnh viễn, phân trang 20/trang, không có trang settings MVP
- Deep link sinh theo role người nhận: student → `/dashboard/case/:id`, supporter → `/supporter/case/:id`, admin → trang case detail admin

## 8. Dependencies mới

- `resend` (API package) + env `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `telegram` — không cần lib, fetch `https://api.telegram.org/bot<TOKEN>/sendMessage` + env `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `TELEGRAM_SUPPORTER_CHAT_ID` (chỉ admin + supporter nội bộ, không gửi student)
- Email: HTML inline đơn giản, brand color, ~20 dòng, tiếng Việt. Không cần thư viện template
- Không cần `node-cron` (đã loại deadline job)

## 9. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Notification block usecase chính | High | Emit sau commit thành công; listener chỉ ghi outbox; relay tách riêng |
| Email/Telegram fail | Low | Outbox retry backoff 5 lần, sau đó log + bỏ |
| SSE connection leak | Med | Close event + cleanup Map khi client disconnect; check stream.aborted |
| Nginx buffer cắt SSE | Med | `proxy_buffering off` + `X-Accel-Buffering: no` cho /api/notifications/stream |
| CORS thiếu credentials | Med | EventSource withCredentials + cors middleware credentials: true |
| Outbox rows tồn đọng | Low | Relay chạy liên tục; log nếu backlog > N |
| Vô tình spam email khi test | Low | Env `NOTIFICATIONS_ENABLED=false` khi dev |
| DB migration | — | Bắt buộc `prisma migrate dev --create-only` (luật dự án) |

## 10. Thứ tự implement

1. Prisma model `notifications` + `notification_outbox` + migration (create-only)
2. `shared/infrastructure/event-bus.ts` — EventEmitter wrapper, typed events
3. Module notifications: repository (notifications + outbox) + list/unread/mark-read usecases + routes
4. Listener: emit → ghi outbox rows (fan-out per recipient/channel)
5. Relay worker: poll pending mỗi 2s → in-app rows + Resend + Telegram, retry backoff
6. `sse-hub.ts` + `/api/notifications/stream` (heartbeat, retry, X-Accel-Buffering)
7. Wire events vào: create-case, assign-supporter, approve-case, reject-case, upload-payment-proof, verify/reject payment, stage transition, publish-report, request-more-info, close-case
8. Frontend: `useNotifications` + bell + dropdown

## 11. Success metrics

- Latency in-app: < 2s từ action → badge đổi (SSE)
- Email deliver: > 95% trong 5 phút (Resend)
- Notification creation fail rate: < 0.1%, không bao giờ fail business flow
- User: student thấy stage change không cần refresh

## 12. Next steps

- [ ] Chốt scope trigger points với team (bảng mục 5)
- [ ] Đăng ký Resend API key + Telegram bot token
- [ ] `/plan` chi tiết từng phase
