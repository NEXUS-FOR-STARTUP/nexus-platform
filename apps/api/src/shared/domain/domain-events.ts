export const DOMAIN_EVENTS = {
  CASE_ASSIGNED: "case.assigned",
  CASE_APPROVED: "case.approved",
  CASE_REJECTED: "case.rejected",
  PAYMENT_PROOF_UPLOADED: "payment.proof_uploaded",
  PAYMENT_VERIFIED: "payment.verified",
  PAYMENT_REJECTED: "payment.rejected",
  CASE_STAGE_CHANGED: "case.stage_changed",
  REPORT_PUBLISHED: "report.published",
  REQUEST_MORE_INFO: "request_more_info",
} as const;

export type DomainEventType = (typeof DOMAIN_EVENTS)[keyof typeof DOMAIN_EVENTS];

export interface DomainEvent<T = Record<string, unknown>> {
  eventId: string;          // crypto.randomUUID() — correlation + idempotency
  type: DomainEventType;
  actorId: string | null;   // null = hệ thống (sepay)
  occurredAt: Date;
  payload: T;
}
