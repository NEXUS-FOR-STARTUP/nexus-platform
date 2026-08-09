import { prisma } from "../../../../db.js";

export interface OutboxRowInput {
  eventId: string;
  type: string;
  channel: string;
  recipientType: string;
  recipient: string;
  title: string;
  body: string | null;
  link: string | null;
  payloadJson: unknown;
}

export async function insertOutboxRow(data: OutboxRowInput) {
  try {
    return await prisma.notificationOutbox.create({
      data: {
        event_id: data.eventId,
        type: data.type,
        channel: data.channel,
        recipient_type: data.recipientType,
        recipient: data.recipient,
        title: data.title,
        body: data.body,
        link: data.link,
        payload_json: (data.payloadJson ?? undefined) as never,
      },
    });
  } catch (error: unknown) {
    // P2002 — unique(event_id, channel, recipient) — đã tồn tại, bỏ qua (idempotent)
    const code = (error as { code?: string } | null)?.code;
    if (code === "P2002") return null;
    throw error;
  }
}

export async function claimBatch(limit = 50) {
  return await prisma.$transaction(async (tx) => {
    // 1) Reclaim stale processing (> 60s — crash giữa claim)
    const staleRows = await tx.notificationOutbox.findMany({
      where: {
        status: "processing",
        processing_at: { lte: new Date(Date.now() - 60_000) },
      },
      select: { id: true },
    });
    if (staleRows.length > 0) {
      await tx.notificationOutbox.updateMany({
        where: { id: { in: staleRows.map((r) => r.id) }, status: "processing" },
        data: { status: "pending", processing_at: null },
      });
    }

    // 2+3) Claim atomic — FOR UPDATE SKIP LOCKED: 2 tick KHÔNG BAO GIỜ lấy cùng row
    //      (Postgres lock row-level; SKIP LOCKED bỏ qua row bị tick khác khóa)
    const now = new Date();
    const claimedIds = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM notification_outbox
      WHERE status = 'pending'
        AND (next_retry_at IS NULL OR next_retry_at <= ${now})
      ORDER BY created_at ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    if (claimedIds.length === 0) return [];

    await tx.notificationOutbox.updateMany({
      where: { id: { in: claimedIds.map((r) => r.id) }, status: "pending" },
      data: { status: "processing", processing_at: now },
    });

    return tx.notificationOutbox.findMany({
      where: { id: { in: claimedIds.map((r) => r.id) } },
    });
  });
}

export async function markSent(id: string, providerMessageId?: string) {
  return await prisma.notificationOutbox.update({
    where: { id },
    data: {
      status: "sent",
      sent_at: new Date(),
      processing_at: null,
      provider_message_id: providerMessageId ?? null,
    },
  });
}

export async function markRetry(id: string, attempts: number, nextRetryAt: Date, error: string) {
  return await prisma.notificationOutbox.update({
    where: { id },
    data: {
      status: "pending",
      processing_at: null,
      attempts,
      next_retry_at: nextRetryAt,
      last_error: error,
    },
  });
}

export async function markFailed(id: string, error: string) {
  return await prisma.notificationOutbox.update({
    where: { id },
    data: {
      status: "failed",
      processing_at: null,
      last_error: error,
    },
  });
}

export async function purgeSentOutbox(olderThanDays = 30) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  return await prisma.notificationOutbox.deleteMany({
    where: { status: "sent", sent_at: { lte: cutoff } },
  });
}
