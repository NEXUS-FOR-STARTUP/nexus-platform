# Phase 04 — Outbox Listener + Relay + Channels

**Effort:** 5h — LÕI hệ thống

## Việc

Listener subscribe 9 event type → resolve recipients → ghi outbox rows.

Relay worker poll mỗi 2s → dispatch 3 kênh + retry backoff.

Email (Resend) + Telegram (grammY) optional-init. Thiếu key → disabled + log. Không crash API.

## Files

### 1. `apps/api/src/modules/notifications/application/notification-templates.ts`

Map event type → title/body/link tiếng Việt. Link theo role receiver.

```ts
const TEMPLATES: Record<string, Template> = {
  case_assigned: {
    title: "Case được phân công",
    studentBody: (p) => `Case ${p.caseCode} đã có supporter phụ trách: ${p.supporterName}.`,
    supporterBody: (p) => `Case ${p.caseCode} được giao cho bạn.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
    supporterLink: (p) => `/supporter/case/${p.caseId}`,
  },
  case_approved: {
    title: "Hồ sơ đã được duyệt",
    studentBody: (p) => `Case ${p.caseCode} đã được duyệt và chờ phân công supporter.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  case_rejected: {
    title: "Hồ sơ bị từ chối",
    studentBody: (p) => `Case ${p.caseCode} bị từ chối. Lý do: ${p.reason}`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  payment_proof_uploaded: {
    title: "Minh chứng thanh toán cần duyệt",
    adminBody: (p) => `Case ${p.caseCode} vừa tải minh chứng ${p.amount.toLocaleString("vi-VN")} VND cần kiểm duyệt.`,
    adminLink: () => `/admin`,
  },
  payment_verified: {
    title: "Thanh toán đã được duyệt",
    studentBody: (p) => `Thanh toán ${p.amount.toLocaleString("vi-VN")} VND của case ${p.caseCode} đã được xác nhận${p.source === "auto" ? " tự động" : ""}.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  payment_rejected: {
    title: "Thanh toán bị từ chối",
    studentBody: (p) => `Minh chứng thanh toán case ${p.caseCode} bị từ chối. Lý do: ${p.reason}. Vui lòng tải lại minh chứng.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  case_stage_changed: {
    title: "Case cập nhật trạng thái",
    studentBody: (p) => `Case ${p.caseCode} chuyển từ '${p.fromStage}' sang '${p.toStage}'.`,
    supporterBody: (p) => `Case ${p.caseCode} đổi trạng thái sang '${p.toStage}'.`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
    supporterLink: (p) => `/supporter/case/${p.caseId}`,
  },
  report_published: {
    title: "Báo cáo đã sẵn sàng",
    studentBody: (p) => `Báo cáo phản biện của case ${p.caseCode} đã sẵn sàng. Xem ngay!`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
  request_more_info: {
    title: "Cần bổ sung thông tin",
    studentBody: (p) => `Case ${p.caseCode} cần bổ sung: ${p.query}`,
    studentLink: (p) => `/dashboard/case/${p.caseId}`,
  },
};
```

Stage label tiếng Việt: `STAGE_LABELS` local map (intake_pending → "Chờ thanh toán", submitted → "Đã nộp", under_review → "Đang phản biện", report_ready → "Báo cáo sẵn sàng", need_more_information → "Cần bổ sung", completed → "Hoàn thành", rejected → "Bị từ chối", closed → "Đã đóng"). Kiểm tra `cases/domain/case-workflow.ts` có map sẵn thì import.

### 2. `apps/api/src/modules/notifications/application/recipients.ts`

```ts
export async function resolveRecipients(event: DomainEvent): Promise<Recipient[]> {
  // case.assigned → supporter (từ payload) + students (owner + members)
  // case.approved/rejected/stage_changed/report_published/request_more_info → students
  // payment.proof_uploaded → users role=admin
  // payment.verified/rejected → students
  // LOẠI actorId (skip-actor). Trừ actorId === null (system)
}
```

- Students = `findCaseByIdWithMembers(caseId)` → owner + members[].auth_user_id (dedupe) — **PHẢI lấy thêm email mỗi user (fix: đổi findCaseByIdWithMembers select, hoặc query email theo user_id)**
- Admins = `prisma.user.findMany({ where: { role: "admin" }, select: { id, email } })`
- `Recipient = { userId, email, role }` — email resolve lúc fan-out; relay không query lại. Email row lưu **email address thật**, không lưu user_id
- `Recipient` trả kèm `caseCode` — payload vài event thiếu case_code (payment.verified/rejected). 1 query/event, chấp nhận. (report.published đã có case_code — fix phase 06)

**Channel mapping (email budget — Resend free 100/ngày. Chỉ event quan trọng gửi email; stage_changed + auto-verified in-app thay thế):**

| Event | Student | Supporter | Admin |
|---|---|---|---|
| case.assigned | in_app + email | in_app + telegram | — |
| case.approved | in_app + email | — | — |
| case.rejected | in_app + email | — | — |
| payment.proof_uploaded | — | — | in_app + telegram |
| payment.verified (manual) | in_app + email | — | — |
| payment.verified (auto/sepay) | in_app | — | — |
| payment.rejected | in_app + email | — | — |
| case.stage_changed | in_app | in_app | — |
| report.published | in_app + email | — | — |
| request_more_info | in_app + email | — | — |

**Lý do cắt email (2026-08-07):** stage_changed bắn 4-6 lần/case (submitted→under_review→need_more→report_ready→completed) — trạng thái trung gian in-app đủ. Auto-verified: student tự thanh toán, biết đã đóng — xác nhận thừa (manual có người duyệt nên giữ). Template stage_changed vẫn render — in-app dùng.

### 3. `apps/api/src/modules/notifications/application/notification-listener.ts`

```ts
export function registerNotificationListener(): void {
  for (const type of Object.values(DOMAIN_EVENTS)) {
    onEvent(type, (event) => {
      void handleEvent(event).catch((error) => {
        logger.error({ eventId: event.eventId, type: event.type, err: error }, "notification listener failed");
      });
    });
  }
}

async function handleEvent(event: DomainEvent): Promise<void> {
  const recipients = await resolveRecipients(event);       // rỗng → bỏ qua
  for (const r of recipients) {
    for (const channel of channelsFor(event.type, r.role)) {
      const { title, body, link } = renderTemplate(event.type, event.payload, r.role);
      await insertOutboxRow({
        eventId: event.eventId, type: event.type, channel,
        recipientType: channel === "telegram" ? "chat" : channel === "email" ? "email" : "user",
        recipient: channel === "telegram" ? TELEGRAM_CHAT_ID : channel === "email" ? r.email : r.userId,
        title, body, link,
        payloadJson: { ...event.payload, actorId: event.actorId },  // audit — ai gây event
      });  // catch P2002 (unique) → bỏ qua, đã tồn tại
    }
  }
}
```

**Telegram recipient:** supporter → `TELEGRAM_SUPPORTER_CHAT_ID`, admin → `TELEGRAM_ADMIN_CHAT_ID`. Thiếu env → skip telegram rows.

### 4. `apps/api/src/modules/notifications/infrastructure/persistence/notification-outbox.repository.ts`

```ts
insertOutboxRow(data)          // create — catch P2002 → null (idempotent)
claimBatch(limit = 50)         // $transaction 4 bước:
                               //   1) reclaim stale: findMany({ status: "processing", processing_at: { lte: now - 60s } })
                               //      → updateMany({ where: { id: { in: staleIds }, status: "processing" }, data: { status: "pending", processing_at: null } })
                               //   2) findMany({ where: { status: "pending", OR: [{ next_retry_at: null }, { next_retry_at: { lte: now } }] }, take: limit })
                               //   3) updateMany({ where: { id: { in: ids }, status: "pending" }, data: { status: "processing", processing_at: now } })
                               //   4) chỉ xử lý row có id trong kết quả updateMany (count)
markSent(id, providerMessageId?)  // status='sent', sent_at, provider_message_id
markRetry(id, attempts, nextRetryAt, error)  // status='pending', processing_at=null, attempts, next_retry_at, last_error
markFailed(id, error)          // status='failed', processing_at=null, last_error
purgeSentOutbox(olderThanDays = 30)  // deleteMany({ status: "sent", sent_at: { lte: now - 30d } }) — index [status, sent_at]
```

**Claim atomicity:** READ COMMITTED — 2 tick có thể findMany trùng rows, nhưng chỉ 1 tick thắng updateMany (WHERE status='pending'). Dùng count trả về từ updateMany để biết row nào claim được.

**Reclaim stale:** row `processing` mà `processing_at <= now - 60s` = kẹt do crash → đưa lại `pending` để claim lại. Row đang xử lý active có processing_at mới → không bị đụng. Reclaim cũng updateMany atomic (WHERE status='processing') — 2 tick không reclaim cùng row.

### 5. `apps/api/src/modules/notifications/infrastructure/email.service.ts`

```ts
// Optional init — thiếu RESEND_API_KEY → disabled + log warning (không crash)
export class EmailService {
  private resend: Resend | null = null;
  constructor() {
    const key = process.env.RESEND_API_KEY;
    if (key) this.resend = new Resend(key);
    else logger.warn("RESEND_API_KEY missing — email notifications disabled");
  }
  async send(to: string, subject: string, html: string, idempotencyKey: string): Promise<void> {
    if (!this.resend) return;
    await this.resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Nexus Platform <noreply@nexusforstartup.site>",
      to, subject, html,
      headers: { "Idempotency-Key": idempotencyKey },  // retry cùng outbox.id → Resend dedupe, không gửi trùng
    });
  }
}
export const emailService = new EmailService();
```

HTML inline đơn giản: `<div style="font-family:...;max-width:600px"><h2>Nexus Platform</h2><p>...body...</p><a href="https://nexusforstartup.site{link}">Xem chi tiết</a></div>`. Subject: `[Nexus] {title}`.

**SECURITY — escape HTML (audit 2026-08-07):** body chứa user input (`reason` từ admin, `query` từ supporter, `supporterName`) → `renderEmailHtml` PHẢI chạy qua `escapeHtml()` helper trước khi nội suy vào HTML:
```ts
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
```
Chống HTML injection / email-client XSS. Mantine render text-safe — frontend không cần.

### 6. `apps/api/src/modules/notifications/infrastructure/telegram.service.ts`

```ts
import { Bot } from "grammy";
import { autoRetry } from "@grammyjs/auto-retry";

// Optional init — thiếu token → disabled
const token = process.env.TELEGRAM_BOT_TOKEN;
export const telegramBot = token ? new Bot(token) : null;
if (telegramBot) telegramBot.api.config.use(autoRetry());  // tự xử lý 429 + retry_after

export async function sendTelegram(chatId: string, text: string): Promise<number | null> {
  if (!telegramBot) return null;
  const msg = await telegramBot.api.sendMessage(chatId, text);
  return msg.message_id;  // lưu vào provider_message_id — audit
}
```

### 7. `apps/api/src/modules/notifications/application/notification-relay.ts`

```ts
const BACKOFF_MS = [2_000, 8_000, 32_000, 120_000, 600_000];
const MAX_ATTEMPTS = 5;

export async function relayTick(): Promise<void> {
  if (process.env.NOTIFICATIONS_ENABLED === "false") return;  // dev tắt
  const batch = await claimBatch();
  for (const row of batch) {
    try {
      let providerMessageId: string | null = null;
      switch (row.channel) {
        case "in_app":
          if (row.recipient_type !== "user") break;  // safety — chỉ gửi cho user_id thật
          await insertNotification({ userId: row.recipient, type: row.type, title: row.title, body: row.body, link: row.link, caseId: payload.case_id, metadataJson: row.payload_json });
          sseHub.ping(row.recipient);
          break;
        case "email":
          await emailService.send(row.recipient, `[Nexus] ${row.title}`, renderEmailHtml(row.title, row.body, row.link), row.id);
          break;
        case "telegram":
          // Plain text — mặc định parse_mode plain, Telegram tự escape. Truncate 4000 (giới hạn 4096).
          const msgId = await sendTelegram(row.recipient, `${row.title}\n${row.body ?? ""}\n${row.link ?? ""}`.slice(0, 4000));
          providerMessageId = msgId === null ? null : String(msgId);
          break;
      }
      await markSent(row.id, providerMessageId ?? undefined);
    } catch (error) {
      const attempts = row.attempts + 1;
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error({ outboxId: row.id, channel: row.channel, attempts, err: error }, "notification relay attempt failed");
      if (attempts >= MAX_ATTEMPTS) await markFailed(row.id, errMsg);
      else await markRetry(row.id, attempts, new Date(Date.now() + BACKOFF_MS[attempts - 1]), errMsg);
    }
  }
}

export function startRelay(): void {
  setInterval(() => { void relayTick().catch((e) => logger.error({ err: e }, "relay tick failed")); }, 2_000);
  // Purge outbox sent > 30 ngày mỗi giờ — bảng infra không lớn vô hạn
  setInterval(() => { void purgeSentOutbox().catch((e) => logger.error({ err: e }, "outbox purge failed")); }, 60 * 60 * 1000);
}
```

`relayTick` + `handleEvent` viết theo DI pattern (`deps = {}` override) — test được (phase 08).

### 8. Wire startup — `apps/api/src/index.ts`

```ts
import { registerNotificationListener } from './modules/notifications/application/notification-listener.js'
import { startRelay } from './modules/notifications/application/notification-relay.js'

if (process.env.NODE_ENV !== 'test') {
  registerNotificationListener();
  startRelay();
}
```

## Verify

- [ ] `npm run check-types --workspace=apps/api` pass
- [ ] Emit test event → outbox row → relay → notification row
- [ ] Thiếu RESEND_API_KEY → API vẫn boot, in_app vẫn chạy
- [ ] Outbox trùng (eventId/channel/recipient) → P2002 catch, không lỗi

## Chốt

- Listener không bao giờ throw ra event bus
- Outbox unique chống trùng
- Retry 5 attempts rồi failed
- `processing_at` + reclaim 60s — row kẹt do crash tự phục hồi
- Email `Idempotency-Key` = outbox.id — không gửi trùng khi response mất
- `recipient_type` — recipient đúng nghĩa: user_id / email address / chat id
- Purge sent > 30 ngày mỗi giờ
- Channel disabled khi thiếu key — không crash
