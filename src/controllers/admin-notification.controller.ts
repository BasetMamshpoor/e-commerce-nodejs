import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { paramInt } from "../utils/params";
import * as adminNotifService from "../services/notification/admin-notification.service";

export async function list(req: Request, res: Response) {
  const { page, limit, isRead } = req.query as { page?: string; limit?: string; isRead?: string };
  const result = await adminNotifService.listAdminNotifications({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    isRead: isRead === "true" ? true : isRead === "false" ? false : undefined,
  });
  return ApiResponse.ok(res, result);
}

export async function unreadCount(_req: Request, res: Response) {
  const count = await adminNotifService.getUnreadAdminNotificationCount();
  return ApiResponse.ok(res, { count });
}

export async function markRead(req: Request, res: Response) {
  if (!req.user) throw ApiError.unauthorized();
  const notif = await adminNotifService.markAdminNotificationAsRead(paramInt(req.params.id));
  return ApiResponse.ok(res, notif);
}

export async function markAllRead(_req: Request, res: Response) {
  await adminNotifService.markAllAdminNotificationsAsRead();
  return ApiResponse.ok(res, null, "همه‌ی نوتیفیکیشن‌ها خوانده‌شده علامت خوردند");
}
