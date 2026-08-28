import { prisma } from "../../../../db.js";
import { type NotificationPreference } from "@repo/validation";

const PREFERENCE_SELECT = {
  user_id: true,
  email_enabled: true,
  telegram_enabled: true,
  in_app_enabled: true,
  case_status_updates: true,
  chat_messages: true,
  payment_alerts: true,
  marketing_news: true,
} as const;

function toPreference(row: {
  email_enabled: boolean;
  telegram_enabled: boolean;
  in_app_enabled: boolean;
  case_status_updates: boolean;
  chat_messages: boolean;
  payment_alerts: boolean;
  marketing_news: boolean;
}): NotificationPreference {
  return {
    email_enabled: row.email_enabled,
    telegram_enabled: row.telegram_enabled,
    in_app_enabled: row.in_app_enabled,
    case_status_updates: row.case_status_updates,
    chat_messages: row.chat_messages,
    payment_alerts: row.payment_alerts,
    marketing_news: row.marketing_news,
  };
}

export async function findNotificationPreference(userId: string): Promise<NotificationPreference | null> {
  const row = await prisma.notificationPreference.findUnique({
    where: { user_id: userId },
    select: PREFERENCE_SELECT,
  });
  return row ? toPreference(row) : null;
}

export async function findNotificationPreferencesByUserIds(
  userIds: string[],
): Promise<Map<string, NotificationPreference>> {
  if (userIds.length === 0) return new Map();

  const rows = await prisma.notificationPreference.findMany({
    where: { user_id: { in: userIds } },
    select: PREFERENCE_SELECT,
  });

  return new Map(rows.map((row) => [row.user_id, toPreference(row)]));
}

export async function upsertNotificationPreference(
  userId: string,
  preference: NotificationPreference,
): Promise<NotificationPreference> {
  const row = await prisma.notificationPreference.upsert({
    where: { user_id: userId },
    create: { user_id: userId, ...preference },
    update: preference,
    select: PREFERENCE_SELECT,
  });
  return toPreference(row);
}

