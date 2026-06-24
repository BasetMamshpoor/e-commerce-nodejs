import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../lib/prisma";
import { Role } from "../generated/prisma";

// ----------------------------------------------------------------------------
// authenticate:
// ۱) JWT access token را اعتبارسنجی می‌کند
// ۲) UserSession مربوط به claim "sid" را از دیتابیس می‌خواند تا مطمئن شود
//    نشست هنوز فعال (isActive) است — این یعنی با logout / logout-all /
//    بلاک‌شدن کاربر، دسترسی همان لحظه (نه فقط بعد از انقضای توکن) قطع می‌شود.
// ۳) اگر کاربر isBlocked باشد، دسترسی رد می‌شود.
//
// این یک تماس اضافه به دیتابیس در هر درخواست authenticated اضافه می‌کند؛
// این تصمیم عمدی است چون نیاز پروژه (آیتم ۲۵) ابطال فوری نشست‌ها بود.
// اگر در آینده فشار روی دیتابیس زیاد شد، می‌توان نتیجه را در Redis کش کرد.
// ----------------------------------------------------------------------------

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw ApiError.unauthorized("توکن دسترسی ارسال نشده است");
    }
    const token = header.slice("Bearer ".length);

    const payload = verifyAccessToken(token);

    const session = await prisma.userSession.findUnique({
      where: { id: payload.sid },
      select: { isActive: true, userId: true },
    });

    if (!session || !session.isActive || session.userId !== payload.sub) {
      throw ApiError.unauthorized("نشست شما منقضی یا باطل شده است. دوباره وارد شوید");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isBlocked: true },
    });

    if (!user) {
      throw ApiError.unauthorized("کاربر مربوط به این توکن وجود ندارد");
    }
    if (user.isBlocked) {
      throw ApiError.forbidden("حساب کاربری شما مسدود شده است");
    }

    req.user = { id: user.id, role: user.role };
    req.sessionId = payload.sid;

    // به‌روزرسانی آخرین فعالیت نشست — بدون منتظرماندن برای پاسخ
    prisma.userSession
      .update({ where: { id: payload.sid }, data: { lastActivityAt: new Date() } })
      .catch(() => undefined);

    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized("توکن نامعتبر یا منقضی‌شده است"));
  }
}

// میدلور احراز هویت اختیاری: اگر توکن باشد user را ست می‌کند، اگر نباشد رد نمی‌کند
// (برای route هایی مثل سبد خرید که هم برای مهمان و هم کاربر عضو کار می‌کنند)
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  return authenticate(req, res, next);
}

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized("احراز هویت نشده‌اید"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden("اجازه دسترسی به این بخش را ندارید"));
    }
    next();
  };
}
