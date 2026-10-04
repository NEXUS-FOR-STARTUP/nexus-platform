---
title: "Notification System (In-app + Email + Telegram)"
description: "Event bus, outbox relay, SSE real-time, Resend email, Telegram bot. Vietnamese-first UI."
status: done
priority: P1
effort: 3d
issue: null
branch: feat/notification-system
tags: [feature, backend, frontend, notifications, sse, outbox]
blockedBy: []
blocks: []
created: 2026-08-07
completed: 2026-08-07
---

# Notification System

## Vấn đề

Không có notification. User phải tự mở app mới biết case đổi trạng thái. Case bị bỏ quên, payment proof không duyệt kịp, student không biết supporter phản hồi.

## Nguồn thiết kế

- `plans/260807-0254-notification-system/reports/brainstorm-notifications-2026-08-07.md` — quyết định product
- `plans/260807-0254-notification-system/research/research-notifications-architecture-2026-08-07.md` — nghiên cứu industry

## Quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Kênh | In-app + Email (Resend) + Telegram (chỉ admin/supporter) |
| Real-time | SSE ping → client refetch |
| Scope | 9 event type, 11 emit point |
| Skip actor | Người thực hiện không nhận của chính mình |
| Fan-out | On write — 1 outbox row/recipient/channel |
| Outbox | Post-commit emit. Cửa sổ crash ~ms. Đã chốt với user |
| Retention | Vĩnh viễn, không settings, phân trang 20 |
| Email | HTML inline, tiếng Việt, gửi ngay từng event. **Chỉ event quan trọng** — bỏ stage_changed + auto-verified (in-app thay). Budget Resend free 100/ngày |
| Telegram | grammY + auto-retry, chat id từ env |
| Deep link | Theo role: student `/dashboard/case/:id`, supporter `/supporter/case/:id`, admin `/admin` |

## Kiến trúc

```
usecase (11 điểm wire, sau commit, trước return)
  └─ emitEvent({eventId, type, actorId, occurredAt, payload})
       └─ notification-listener (async, không throw)
            ├─ resolveRecipients(event) → students (owner+members), supporter, admins
            └─ insert notification_outbox rows (1 row/recipient/channel, unique event_id+channel+recipient)
                 └─ relay worker (setInterval 2s, start ở index.ts)
                       ├─ claim batch: pending + due → processing (atomic, set processing_at; reclaim stale > 60s)
                      ├─ in_app  → insert notifications row → sseHub.ping(userId)
                      ├─ email   → Resend POST /emails
                      ├─ telegram→ grammY sendMessage
                      ├─ success → sent
                      └─ fail    → attempts++, retry 2s→8s→32s→2m→10m; ≥5 → failed + log
```

CORS `credentials: true` đã có (index.ts:41). EventSource dùng `withCredentials: true`.

## Schema

Xem phase-01. Điểm chốt:

```prisma
model Notification {
  id            String   @id @default(uuid())
  user_id       String
  type          String
  title         String
  body          String?
  link          String?
  case_id       String?
  metadata_json Json?
  read_at       DateTime?
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  @@index([user_id, read_at])
  @@index([user_id, created_at(sort: Desc)])
  @@map("notifications")
}

model NotificationOutbox {
  id                  String    @id @default(uuid())
  event_id            String
  type                String
  channel             String    // in_app | email | telegram
  recipient_type      String    @default("user") // user | email | chat (telegram)
  recipient           String    // user_id | email address | telegram chat id
  title               String
  body                String?
  link                String?
  payload_json        Json?
  status              String    @default("pending") // pending | processing | sent | failed
  attempts            Int       @default(0)
  processing_at       DateTime? // claim stamp — relay reclaim stale > 60s
  next_retry_at       DateTime?
  sent_at             DateTime?
  provider_message_id String?   // Resend message id / Telegram message id — audit + idempotency
  last_error          String?
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt

  @@unique([event_id, channel, recipient])
  @@index([status, next_retry_at])
  @@index([status, sent_at]) // purge job xóa sent > 30 ngày
  @@map("notification_outbox")
}
```

**Quy tắc schema chống bug:**
1. `@@unique([event_id, channel, recipient])` — emit trùng không tạo row trùng
2. Claim bằng updateMany atomic — 2 tick không xử lý cùng row
3. `read_at` nullable thay vì is_read boolean — giữ thời điểm đọc
4. Không FK payment_id — metadata_json đủ
5. `link` render sẵn lúc relay — client không tự tính
6. Không unread_count denormalized — bảng nhỏ, index đủ
7. `processing_at` claim stamp — row kẹt `processing` (crash giữa claim) được reclaim sau 60s
8. `provider_message_id` + `Idempotency-Key` = outbox.id — chống email double-send khi response mất
9. `recipient_type` (user|email|chat) — recipient hết mơ hồ; email row lưu email address thật, không phải user_id
10. `@@index([status, sent_at])` + purge 30 ngày — outbox không lớn vô hạn

## Wire points (11 điểm, 9 event type)

| # | Event | Emit tại | Sau | Recipients (trừ actor) | Channels |
|---|---|---|---|---|---|
| 1 | case.assigned | assign-supporter.usecase.ts | L118 logger, trước L119 return — bọc `if (nextSupporterId)` | supporter, students | sup: in_app+telegram; student: in_app+email |
| 2 | case.approved | accept-case.usecase.ts | L66 auditLogger, trước L67 return — không no_op | students | in_app+email |
| 3 | case.rejected | reject-case.usecase.ts | L35 logger, trước L36 return — không no_op | students | in_app+email |
| 4 | payment.proof_uploaded | upload-payment-proof.usecase.ts | L87 logger, trước L89 return | admins | in_app+telegram |
| 5 | payment.verified | verify-payment.usecase.ts | L75 logger, trước L77 return | students | in_app+email |
| 6 | payment.rejected | verify-payment.usecase.ts | như trên | students | in_app+email |
| 7 | payment.verified (auto) | sepay-webhook.usecase.ts | L119 logger, trước L121 return (anchor thực — L105 là string literal) | students | in_app |
| 8 | case.stage_changed | update-case-status.usecase.ts | L149-152 logger, trước L154 return | students + supporter (trừ actor) | student: in_app; sup: in_app |
| 9 | report.published | approve-report.usecase.ts | L47 logger.info, trước L48 return (anchor thực — L37 là field trong auditLogger object) | students | in_app+email |
| 10 | request_more_info | supporter-request-more-info.usecase.ts + admin/request-more-info.usecase.ts (file này KHÔNG có logger — thêm trước emit) | sau logger, trước return — không no_op | students | in_app+email |
| 11 | case.stage_changed (closed) | close-case.usecase.ts | sau repo call, trước return — không no_op. Fix review: close-case không đi qua update-case-status | students | in_app |

**Luật wire:**
- Emit sau commit, trước return
- Không emit ở no_op path
- case.assigned unassign → không emit
- sepay actorId = null (system) → skip-actor không áp dụng
- 9 event type, 11 emit point (payment.verified/rejected 2 nguồn, request_more_info 2 nguồn, close-case reuse stage_changed)

## Files mới / sửa

```
apps/api/src/
├── shared/domain/domain-events.ts              # MỚI — event type constants + DomainEvent type
├── shared/infrastructure/event-bus.ts          # MỚI — emitEvent + onEvent
├── modules/notifications/                      # MỚI
│   ├── domain/notification.types.ts
│   ├── application/
│   │   ├── notifications.dto.ts
│   │   ├── list-notifications.usecase.ts
│   │   ├── get-unread-count.usecase.ts
│   │   ├── mark-notification-read.usecase.ts
│   │   ├── mark-all-read.usecase.ts
│   │   ├── notification-listener.ts
│   │   ├── notification-relay.ts
│   │   ├── notification-templates.ts
│   │   └── recipients.ts
│   ├── infrastructure/
│   │   ├── persistence/notification.repository.ts
│   │   ├── persistence/notification-outbox.repository.ts
│   │   ├── sse-hub.ts
│   │   ├── email.service.ts
│   │   └── telegram.service.ts
│   └── http/
│       ├── notifications.routes.ts
│       └── notifications.controller.ts
apps/web-1/
├── types/notification.ts                       # MỚI
├── lib/hooks/useNotifications.ts               # MỚI — shared 3 role (lib/ = shared code; route hooks ở app/<route>/hooks/)
├── components/layout/NotificationBell.tsx      # MỚI
└── components/layout/DashboardShell.tsx        # SỬA — mount bell trước ThemeToggler (L84-85)
prisma/schema.prisma                            # SỬA — +2 models
apps/api/src/index.ts                           # SỬA — mount router + start listener/relay
apps/api/src/modules/*/application/*.usecase.ts # SỬA — 11 điểm emit (phase 06)
apps/api/src/modules/reports/infrastructure/persistence/report.repository.ts  # SỬA — thêm case_code vào select
docker-compose.prod.yml                         # SỬA — labels stream router (phase 08)
.env + .env.prod                                # SỬA — +6 vars (phase 08)
```

## Phases

1. `phase-01-db-schema-migration.md` — schema + migration create-only
2. `phase-02-event-bus.md` — event-bus + domain-events
3. `phase-03-notifications-module-core.md` — repos, usecases, routes
4. `phase-04-outbox-listener-relay.md` — listener, templates, recipients, relay, email/telegram
5. `phase-05-sse-hub-stream.md` — sse-hub + stream endpoint
6. `phase-06-wire-events.md` — 11 emit point, đúng line anchor
7. `phase-07-frontend.md` — types, hook, bell, mount
8. `phase-08-tests-deploy.md` — tests + env + Traefik

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Relay double-send | Claim atomic + unique(event_id, channel, recipient) |
| Relay kẹt `processing` khi crash | `processing_at` + reclaim sau 60s |
| Email double-send khi response mất | `Idempotency-Key` = outbox.id (Resend dedupe) |
| Outbox lớn vô hạn | purge sent > 30 ngày, index `[status, sent_at]` |
| Email spam khi dev | NOTIFICATIONS_ENABLED=false; thiếu RESEND_API_KEY → email disabled + log |
| SSE connection leak | stream.aborted + cleanup Map |
| Traefik compress treo SSE | Router riêng stream, không compress (phase 8) |
| Migration hỏng prod DB | `migrate dev --create-only` + `docker compose exec api npx prisma migrate deploy` — KHÔNG dùng `make migrate` (hỏng sẵn) |
| Listener throw hỏng usecase | Listener catch mọi lỗi |
| Payload thiếu field | Templates bỏ qua + log warning |
| CORS chặn PATCH (preflight) | index.ts allowMethods thêm 'PATCH' (phase 03) + verify OPTIONS sau deploy (phase 08) |
| Secret vào git history | `git rm --cached .env.prod` + .gitignore; không commit key (phase 08) |
| Email HTML injection (reason/query/name) | `escapeHtml()` trong renderEmailHtml (phase 04) |
| SSE connection exhaustion | Cap 5 connection/user (phase 05) |

## Success Criteria

- Assign supporter → student + supporter nhận <2s (in-app)
- Upload proof → admin nhận in-app + telegram <5s
- Email deliver <5 phút, retry khi fail
- Mark read + unread-count đúng
- Notification không bao giờ gây 5xx
- check-types, test, lint pass

## Implemented (2026-08-07)

- ✅ Phase 01-08 hoàn thành. Migration `20260807040000_add_notifications` đã apply lên local DB; VPS cần `migrate deploy` khi deploy
- ✅ Test phase-08: 16/16 pass (DB thật local), check-types root 3/3, web lint file mới sạch
- ✅ Review fixes (code-reviewer): templates keys → dot notation (bug CRITICAL — 8/9 event render raw string); sse-hub Set.delete theo stream reference (leak connection); claimBatch → `FOR UPDATE SKIP LOCKED` (race same-ms); sepay emit ngay sau verifyPayment commit + dedupSet trong try; xóa dead es.onopen
- ✅ Second-pass review fixes (2026-08-07): update-case-status emit gated khi stage thực sự đổi (H1); listener wrap per-recipient try/catch — 1 fail không mất recipient khác (H2); SSE refresh invalidate cả unread-count (M1); close-case + isFinalCaseStage gate chống backdoor (M2); event-bus note M3
- ⚠️ 19 test cũ fail = pre-existing (env: thiếu Cloudinary credentials / DB state) — xác nhận bằng stash run trên HEAD, không phải do feature này
- ⚠️ Env prod: RESEND_API_KEY / TELEGRAM_BOT_TOKEN / chat ids — VPS cần thêm vào `.env.prod` (example đã cập nhật). Thiếu key → kênh disabled, không crash
- ⚠️ Deploy: `docker build --no-cache` (schema mới → prisma generate) + `migrate deploy` trước khi up -d
