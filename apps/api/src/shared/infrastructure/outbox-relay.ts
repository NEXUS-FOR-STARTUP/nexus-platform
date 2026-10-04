import {
  fetchPendingOutboxEvents,
  markOutboxSent,
  markOutboxFailed,
} from "./persistence/outbox.repository.js";
import { emitter } from "./event-bus.js";
import logger from "./logger.js";

const POLL_INTERVAL_MS = 5_000;
const MAX_RETRIES = 10;

let relayTimer: ReturnType<typeof setInterval> | null = null;

export function startOutboxRelay(): void {
  if (relayTimer) return;

  relayTimer = setInterval(async () => {
    try {
      const events = await fetchPendingOutboxEvents(10);
      if (events.length === 0) return;

      for (const event of events) {
        try {
          const payload = event.payload_json as Record<string, unknown>;
          emitter.emit(event.event_type, {
            eventId: String(event.id),
            type: event.event_type,
            actorId: null,
            occurredAt: new Date(),
            payload,
          });
          await markOutboxSent(event.id);
        } catch (err: any) {
          logger.error({ err, outboxId: event.id, eventType: event.event_type }, "outbox relay: event publish failed");
          if (event.attempts >= MAX_RETRIES) {
            await markOutboxSent(event.id);
          } else {
            await markOutboxFailed(event.id, err?.message ?? "Unknown", event.attempts);
          }
        }
      }
    } catch (err) {
      logger.error({ err }, "outbox relay: poll failed");
    }
  }, POLL_INTERVAL_MS);

  logger.info("outbox relay worker started");
}

export function stopOutboxRelay(): void {
  if (relayTimer) {
    clearInterval(relayTimer);
    relayTimer = null;
    logger.info("outbox relay worker stopped");
  }
}
