import { prisma } from "../../../../db.js";
import type { NotificationType } from "../../domain/notification.types.js";

export async function listNotifications(userId: string, page: number, limit: number) {
  return await prisma.notification.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      link: true,
      read_at: true,
      created_at: true,
    },
    orderBy: { created_at: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function countNotifications(userId: string) {
  return await prisma.notification.count({ where: { user_id: userId } });
}

export async function getUnreadCount(userId: string) {
  return await prisma.notification.count({
    where: { user_id: userId, read_at: null },
  });
}

export async function markRead(userId: string, notificationId: string) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, user_id: userId },
    data: { read_at: new Date() },
  });
  return result.count;
}

export async function markAllRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { user_id: userId, read_at: null },
    data: { read_at: new Date() },
  });
  return result.count;
}

export async function insertNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  caseId: string | null;
  metadataJson: unknown;
}) {
  return await prisma.notification.create({
    data: {
      user_id: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      link: data.link,
      case_id: data.caseId,
      metadata_json: (data.metadataJson ?? undefined) as never,
    },
  });
}
