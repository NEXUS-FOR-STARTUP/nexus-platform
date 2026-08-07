import { DOMAIN_EVENTS, type DomainEvent } from "../../../shared/domain/domain-events.js";
import { onEvent } from "../../../shared/infrastructure/event-bus.js";
import logger from "../../../shared/infrastructure/logger.js";
import { insertOutboxRow } from "../infrastructure/persistence/notification-outbox.repository.js";
import { telegramBot } from "../infrastructure/telegram.service.js";
import { channelsFor, resolveRecipients } from "./recipients.js";
import { renderTemplate } from "./notification-templates.js";

const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const TELEGRAM_SUPPORTER_CHAT_ID = process.env.TELEGRAM_SUPPORTER_CHAT_ID;

type ListenerDeps = {
  resolve?: typeof resolveRecipients;
  channels?: typeof channelsFor;
  insert?: typeof insertOutboxRow;
};

export function registerNotificationListener(deps: ListenerDeps = {}): void {
  for (const type of Object.values(DOMAIN_EVENTS)) {
    onEvent(type, (event) => {
      void handleEvent(event, deps).catch((error) => {
        logger.error({ eventId: event.eventId, type: event.type, err: error }, "notification listener failed");
      });
    });
  }
}

export async function handleEvent(
  event: DomainEvent,
  deps: { resolve?: typeof resolveRecipients; channels?: typeof channelsFor; insert?: typeof insertOutboxRow } = {},
): Promise<void> {
  const { resolve = resolveRecipients, channels = channelsFor, insert = insertOutboxRow } = deps;
  const payload = event.payload as Record<string, unknown>;

  const recipients = await resolve(event); // rỗng → bỏ qua
  for (const r of recipients) {
    for (const channel of channels(event.type, r.role, payload)) {
      const { title, body, link } = renderTemplate(event.type, payload, r.role);

      let recipientType: string;
      let recipient: string;
      if (channel === "telegram") {
        // thiếu env HOẶC bot disabled → skip telegram rows (không tạo row chết)
        if (!telegramBot || !r.telegramChatId) continue;
        recipientType = "chat";
        recipient = r.telegramChatId;
      } else if (channel === "email") {
        if (!r.email) continue;
        recipientType = "email";
        recipient = r.email;
      } else {
        recipientType = "user";
        recipient = r.userId;
      }

      // H2 fix (review): 1 recipient/channel fail KHÔNG được làm mất các recipient còn lại
      try {
        await insert({
          eventId: event.eventId,
          type: event.type,
          channel,
          recipientType,
          recipient,
          title,
          body,
          link,
          payloadJson: { ...payload, actorId: event.actorId }, // audit — ai gây event
        });
      } catch (error) {
        logger.error({ eventId: event.eventId, type: event.type, channel, recipient, err: error }, "notification outbox insert failed");
      }
    }
  }
}

// Export lại để test skip telegram khi thiếu env
export { TELEGRAM_ADMIN_CHAT_ID, TELEGRAM_SUPPORTER_CHAT_ID };
