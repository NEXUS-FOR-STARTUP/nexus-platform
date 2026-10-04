export {
  NOTIFICATION_TYPES as VALID_NOTIFICATION_TYPES,
  type NotificationType,
} from "@repo/validation";
export type NotificationChannel = "in_app" | "email" | "telegram";
export const OUTBOX_STATUS = ["pending", "processing", "sent", "failed"] as const;
export type OutboxStatus = (typeof OUTBOX_STATUS)[number];
