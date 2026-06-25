import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { paramStr } from "../utils/params";
import * as notificationService from "../services/notification/notification.service";

function userId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

export async function list(req: Request, res: Response) {
  return ApiResponse.ok(res, await notificationService.listNotifications(userId(req), req.validatedQuery as never));
}

export async function unreadCount(req: Request, res: Response) {
  const count = await notificationService.getUnreadCount(userId(req));
  return ApiResponse.ok(res, { count });
}

export async function markRead(req: Request, res: Response) {
  const notification = await notificationService.markAsRead(userId(req), paramStr(req.params.id));
  return ApiResponse.ok(res, notification);
}

export async function markAllRead(req: Request, res: Response) {
  await notificationService.markAllAsRead(userId(req));
  return ApiResponse.ok(res, null, "همه‌ی نوتیفیکیشن‌ها خوانده‌شده علامت خوردند");
}

export async function remove(req: Request, res: Response) {
  await notificationService.deleteNotification(userId(req), paramStr(req.params.id));
  return ApiResponse.ok(res, null, "نوتیفیکیشن حذف شد");
}

export async function broadcast(req: Request, res: Response) {
  const result = await notificationService.broadcastNotification(req.body);
  return ApiResponse.ok(res, result, "نوتیفیکیشن ارسال شد");
}
