import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";

// بررسی می‌کند IP درخواست‌دهنده در جدول BlockedIp مسدود نشده باشد.
// روی همه‌ی مسیرهای API (یا حداقل مسیرهای حساس) ثبت کنید.
export async function checkBlockedIp(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const ip = req.ip;
  if (!ip) return next();

  const blocked = await prisma.blockedIp.findUnique({ where: { ip } });

  if (blocked && (!blocked.expiresAt || blocked.expiresAt > new Date())) {
    return next(ApiError.forbidden("دسترسی از این آی‌پی مسدود شده است"));
  }

  next();
}
