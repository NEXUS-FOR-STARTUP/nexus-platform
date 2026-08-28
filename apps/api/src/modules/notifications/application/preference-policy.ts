import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreference,
} from "@repo/validation";

export type NotificationPreferenceSnapshot = Pick<
  NotificationPreference,
  "email_enabled" | "in_app_enabled" | "case_status_updates" | "payment_alerts"
>;

const CASE_STATUS_EVENTS: Record<string, true> = {
  [DOMAIN_EVENTS.CASE_ASSIGNED]: true,
  [DOMAIN_EVENTS.CASE_APPROVED]: true,
  [DOMAIN_EVENTS.CASE_REJECTED]: true,
  [DOMAIN_EVENTS.CASE_STAGE_CHANGED]: true,
  [DOMAIN_EVENTS.REPORT_PUBLISHED]: true,
  [DOMAIN_EVENTS.REQUEST_MORE_INFO]: true,
};

const PAYMENT_ALERT_EVENTS: Record<string, true> = {
  [DOMAIN_EVENTS.PAYMENT_PROOF_UPLOADED]: true,
  [DOMAIN_EVENTS.PAYMENT_VERIFIED]: true,
  [DOMAIN_EVENTS.PAYMENT_REJECTED]: true,
  [DOMAIN_EVENTS.DEPOSIT_VERIFIED]: true,
  [DOMAIN_EVENTS.DEPOSIT_REJECTED]: true,
  [DOMAIN_EVENTS.ORDER_PAID]: true,
  [DOMAIN_EVENTS.ORDER_REFUNDED]: true,
  [DOMAIN_EVENTS.WALLET_BALANCE_CHANGED]: true,
};

export const ALL_ENABLED_PREFERENCE: NotificationPreferenceSnapshot = {
  email_enabled: DEFAULT_NOTIFICATION_PREFERENCES.email_enabled,
  in_app_enabled: DEFAULT_NOTIFICATION_PREFERENCES.in_app_enabled,
  case_status_updates: DEFAULT_NOTIFICATION_PREFERENCES.case_status_updates,
  payment_alerts: DEFAULT_NOTIFICATION_PREFERENCES.payment_alerts,
};

export function eventGroupFor(eventType: string): "case_status_updates" | "payment_alerts" | null {
  if (CASE_STATUS_EVENTS[eventType]) return "case_status_updates";
  if (PAYMENT_ALERT_EVENTS[eventType]) return "payment_alerts";
  return null;
}

export function allowsNotificationChannel(
  preference: NotificationPreferenceSnapshot,
  eventType: string,
  channel: string,
): boolean {
  if (channel === "telegram") return true;

  const group = eventGroupFor(eventType);
  if (group === "case_status_updates" && !preference.case_status_updates) return false;
  if (group === "payment_alerts" && !preference.payment_alerts) return false;

  if (channel === "in_app") return preference.in_app_enabled;
  if (channel === "email") return preference.email_enabled;
  return true;
}
