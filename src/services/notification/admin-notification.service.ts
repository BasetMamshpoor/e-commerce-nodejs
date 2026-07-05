import { prisma } from "../../lib/prisma";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { NotificationType } from "../../generated/prisma";

export async function createAdminNotification(params: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.adminNotification.create({
    data: {
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  });
}

export async function listAdminNotifications(query: { page?: number; limit?: number; isRead?: boolean }) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where: Record<string, unknown> = {};
  if (query.isRead !== undefined) where.isRead = query.isRead;

  const [items, total] = await Promise.all([
    prisma.adminNotification.findMany({ where, orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take }),
    prisma.adminNotification.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}

export async function getUnreadAdminNotificationCount(): Promise<number> {
  return prisma.adminNotification.count({ where: { isRead: false } });
}

export async function markAdminNotificationAsRead(id: number) {
  return prisma.adminNotification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllAdminNotificationsAsRead(): Promise<void> {
  await prisma.adminNotification.updateMany({ where: { isRead: false }, data: { isRead: true } });
}
