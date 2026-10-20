import type { Prisma } from "@prisma/client";
import type { prisma } from "../../../../db.js";
import { AppError } from "../../../../shared/domain/app-error.js";

/** Accepts the global client or a `$transaction` client so a caller can join its ambient transaction. */
type EventDb = Pick<typeof prisma, "caseEvent" | "case">;

export type CaseEventActorRole = "user" | "admin" | "system";

export interface RecordCaseEventInput {
  caseId: string;
  eventType: string;
  /** Who acted. Omit for system-driven events (worker, watchdog): the case owner is recorded with role `system`. */
  actorUserId?: string;
  actorRole?: CaseEventActorRole;
  metadata?: Prisma.InputJsonValue;
  documentId?: string;
  reportId?: string;
  paymentId?: string;
}

/**
 * Append one entry to the case activity timeline. `actor_auth_user_id` is mandatory in the schema, so
 * system events borrow the owner's id and are told apart by `actor_role = "system"`.
 */
export async function recordCaseEvent(db: EventDb, input: RecordCaseEventInput) {
  let actorId = input.actorUserId;
  if (!actorId) {
    const owner = await db.case.findUnique({ where: { id: input.caseId }, select: { owner_auth_user_id: true } });
    if (!owner) throw new AppError(404, "CASE_NOT_FOUND", "Không tìm thấy dự án");
    actorId = owner.owner_auth_user_id;
  }
  return db.caseEvent.create({
    data: {
      case_id: input.caseId,
      event_type: input.eventType,
      actor_auth_user_id: actorId,
      actor_role: input.actorRole ?? (input.actorUserId ? "user" : "system"),
      document_id: input.documentId,
      report_id: input.reportId,
      payment_id: input.paymentId,
      metadata_json: input.metadata,
    },
  });
}
