import logger from "../../../shared/infrastructure/logger.js";
import {
  claimBatch as defaultClaimBatch,
  markFailed as defaultMarkFailed,
  markRetry as defaultMarkRetry,
  markSent as defaultMarkSent,
  purgeSentOutbox as defaultPurgeSentOutbox,
} from "../infrastructure/persistence/notification-outbox.repository.js";
import { insertNotification as defaultInsertNotification } from "../infrastructure/persistence/notification.repository.js";
import { emailService, renderEmailHtml } from "../infrastructure/email.service.js";
import { sendTelegram } from "../infrastructure/telegram.service.js";
import { ping as defaultPing } from "../infrastructure/sse-hub.js";

const BACKOFF_MS = [2_000, 8_000, 32_000, 120_000, 600_000];
const MAX_ATTEMPTS = 5;

const boundSendEmail = emailService.send.bind(emailService);

type RelayDeps = {
  claimBatch?: typeof defaultClaimBatch;
  insertNotification?: typeof defaultInsertNotification;
  markSent?: typeof defaultMarkSent;
  markRetry?: typeof defaultMarkRetry;
  markFailed?: typeof defaultMarkFailed;
  ping?: typeof defaultPing;
  sendEmail?: typeof emailService.send;
  sendTelegramMsg?: typeof sendTelegram;
};

export async function relayTick(deps: RelayDeps = {}): Promise<void> {
  if (process.env.NOTIFICATIONS_ENABLED === "false") return; // dev tắt

  const {
    claimBatch = defaultClaimBatch,
    insertNotification = defaultInsertNotification,
    markSent = defaultMarkSent,
    markRetry = defaultMarkRetry,
    markFailed = defaultMarkFailed,
    ping = defaultPing,
    sendEmail = boundSendEmail,
    sendTelegramMsg = sendTelegram,
  } = deps;

  const batch = await claimBatch();
  for (const row of batch) {
    const payload = (row.payload_json ?? {}) as Record<string, unknown>;
    try {
      let providerMessageId: string | null = null;
      switch (row.channel) {
        case "in_app":
          // safety — chỉ gửi cho user_id thật
          if (row.recipient_type !== "user") break;
          await insertNotification({
            userId: row.recipient,
            type: row.type as never,
            title: row.title,
            body: row.body,
            link: row.link,
            caseId: typeof payload.caseId === "string" ? payload.caseId : null,
            metadataJson: row.payload_json,
          });
          await ping(row.recipient);
          break;
        case "email":
          await sendEmail(
            row.recipient,
            `[Nexus] ${row.title}`,
            renderEmailHtml(row.title, row.body, row.link),
            row.id, // Idempotency-Key — retry cùng outbox.id → Resend dedupe
          );
          break;
        case "telegram":
          // Plain text — mặc định parse_mode plain, Telegram tự escape. Truncate 4000 (giới hạn 4096)
          // Không kèm link: row.link là path tương đối (vd /admin?tab=payments) — vô dụng trên Telegram
          const msgId = await sendTelegramMsg(
            row.recipient,
            `${row.title}\n${row.body ?? ""}`.slice(0, 4000),
          );
          // Telegram disabled (null) → delivery failure — không đánh dấu sent
          if (msgId === null) throw new Error("telegram disabled — delivery failed");
          providerMessageId = String(msgId);
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
  setInterval(() => {
    void relayTick().catch((e) => logger.error({ err: e }, "relay tick failed"));
  }, 2_000);

  // Purge outbox sent > 30 ngày mỗi giờ — bảng infra không lớn vô hạn
  setInterval(() => {
    void defaultPurgeSentOutbox().catch((e) => logger.error({ err: e }, "outbox purge failed"));
  }, 60 * 60 * 1000);
}
