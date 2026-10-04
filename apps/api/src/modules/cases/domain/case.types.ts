export const VALID_CASE_STAGES = [
  "intake_pending",
  "intake_ready",
  "submitted",
  "need_more_information",
  "under_review",
  "report_ready",
  "waiting_for_revision",
  "revision_submitted",
  "completed",
  "rejected",
  "closed",
] as const;

export type CaseStage = (typeof VALID_CASE_STAGES)[number];

export const VALID_INTERNAL_STATUSES = [
  "triage_pending",
  "accepted_unassigned",
  "assigned",
  "waiting_user",
  "supporter_working",
  "report_ready_to_publish",
  "done",
  "cancelled",
] as const;

export type InternalStatus = (typeof VALID_INTERNAL_STATUSES)[number];

export function isValidCaseStage(stage: unknown): stage is CaseStage {
  return (
    typeof stage === "string" &&
    (VALID_CASE_STAGES as readonly string[]).includes(stage)
  );
}

export function isValidInternalStatus(
  status: unknown,
): status is InternalStatus {
  return (
    typeof status === "string" &&
    (VALID_INTERNAL_STATUSES as readonly string[]).includes(status)
  );
}

/**
 * Payment statuses that authorize admin approval (T5_ACCEPT). Fail-closed: any
 * other value — including missing/unknown — blocks approval.
 */
export const COMPLETE_PAYMENT_STATUSES = ["paid", "not_required"] as const;

export type CompletePaymentStatus = (typeof COMPLETE_PAYMENT_STATUSES)[number];

export function isPaymentComplete(paymentStatus: unknown): boolean {
  return (
    typeof paymentStatus === "string" &&
    (COMPLETE_PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)
  );
}

export function isFinalCaseStage(stage?: string | null): boolean {
  return stage === "closed" || stage === "completed" || stage === "rejected";
}

export function isPreSubmissionStage(stage?: string | null): boolean {
  return stage === "intake_pending" || stage === "intake_ready";
}

export function isValidPrice(price: unknown): price is number {
  return typeof price === "number" && Number.isInteger(price) && price >= 0;
}

