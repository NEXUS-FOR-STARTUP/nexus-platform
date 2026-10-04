import { prisma } from "../../../db.js";
import type { Prisma } from "@prisma/client";

export interface OutboxEvent {
  event_type: string;
  payload_json: Record<string, unknown>;
}

export async function insertOutboxEvent(
  tx: Prisma.TransactionClient,
  event: OutboxEvent,
) {
  return tx.domainEventOutbox.create({
    data: {
      event_type: event.event_type,
      payload_json: event.payload_json as any,
      status: "pending",
      attempts: 0,
    },
  });
}

export async function fetchPendingOutboxEvents(limit = 10) {
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const events = await tx.domainEventOutbox.findMany({
      where: {
        status: "pending",
        OR: [
          { next_retry_at: null },
          { next_retry_at: { lte: now } },
        ],
      },
      orderBy: { created_at: "asc" },
      take: limit,
    });

    if (events.length > 0) {
      await tx.domainEventOutbox.updateMany({
        where: { id: { in: events.map((e) => e.id) } },
        data: { status: "processing", processing_at: now },
      });
    }

    return events;
  });
}

export async function markOutboxSent(id: number) {
  return prisma.domainEventOutbox.update({
    where: { id },
    data: { status: "sent", sent_at: new Date() },
  });
}

export async function markOutboxFailed(id: number, error: string, currentAttempts: number) {
  const nextRetryDelay = Math.min(Math.pow(2, currentAttempts + 1) * 1000, 3600_000);
  return prisma.domainEventOutbox.update({
    where: { id },
    data: {
      status: "pending",
      attempts: currentAttempts + 1,
      last_error: error,
      next_retry_at: new Date(Date.now() + nextRetryDelay),
    },
  });
}
