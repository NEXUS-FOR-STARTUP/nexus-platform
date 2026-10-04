import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreference,
} from "@repo/validation";

export type NotificationPreferenceSnapshot = Pick<NotificationPreference, "email_enabled">;

export const ALL_ENABLED_PREFERENCE: NotificationPreferenceSnapshot = {
  email_enabled: DEFAULT_NOTIFICATION_PREFERENCES.email_enabled,
};

export function allowsNotificationChannel(
  preference: NotificationPreferenceSnapshot,
  _eventType: string,
  channel: string,
): boolean {
  if (channel === "telegram") return true;
  if (channel === "in_app") return true;
  if (channel === "email") return preference.email_enabled;
  return true;
}
