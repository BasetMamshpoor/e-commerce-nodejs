import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { Notification, NotificationType } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// نوتیفیکیشن‌های کاربری — آیتم ۱۵.
// createNotification توسط بقیه‌ی ماژول‌ها (سفارش، تیکت، کیف‌پول، کامنت) صدا
// زده می‌شود؛ اگر خطایی در ساخت نوتیف رخ دهد نباید کل عملیات اصلی (مثل
// ثبت سفارش) را خراب کند، پس همیشه با ()catch بی‌صدا فراخوانی کنید:
//   notifyUser(...).catch(() => undefined)
// ----------------------------------------------------------------------------

export async function notifyUser(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    },
  });
}

export async function notifyUsers(
  userIds: string[],
  params: { type: NotificationType; title: string; message: string; link?: string }
): Promise<void> {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
    })),
  });
}

export async function listNotifications(
  userId: string,
  query: { page?: number; limit?: number; isRead?: boolean }
) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where = { userId, ...(query.isRead !== undefined ? { isRead: query.isRead } : {}) };

  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.notification.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markAsRead(userId: string, id: string): Promise<Notification> {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw ApiError.notFound("نوتیفیکیشن پیدا نشد");
  }
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}

export async function deleteNotification(userId: string, id: string): Promise<void> {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw ApiError.notFound("نوتیفیکیشن پیدا نشد");
  }
  await prisma.notification.delete({ where: { id } });
}

// ----------------------------------------------------------------------------
// پخش همگانی برای ادمین (مثلاً اطلاع‌رسانی جشنواره) — اگر userIds نباشد،
// برای همه‌ی کاربران ارسال می‌شود.
// ----------------------------------------------------------------------------

export async function broadcastNotification(input: {
  userIds?: string[];
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}): Promise<{ sentCount: number }> {
  const targetIds =
    input.userIds && input.userIds.length > 0
      ? input.userIds
      : (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id);

  await notifyUsers(targetIds, input);
  return { sentCount: targetIds.length };
}
