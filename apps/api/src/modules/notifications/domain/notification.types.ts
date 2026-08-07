export const VALID_NOTIFICATION_TYPES = [
  "case.assigned", "case.approved", "case.rejected",
  "payment.proof_uploaded", "payment.verified", "payment.rejected",
  "case.stage_changed", "report.published", "request_more_info",
] as const;

export type NotificationType = (typeof VALID_NOTIFICATION_TYPES)[number];
export type NotificationChannel = "in_app" | "email" | "telegram";
export const OUTBOX_STATUS = ["pending", "processing", "sent", "failed"] as const;
export type OutboxStatus = (typeof OUTBOX_STATUS)[number];
