import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

// ----------------------------------------------------------------------------
// چرا این middleware لازم است:
// دیتابیس فقط مسیر نسبی رسانه‌ها را نگه می‌دارد (مثلاً "/uploads/products/
// 2026/07/xyz.jpg")، نه URL کامل با دامنه و پورت — دقیقاً برای این‌که
// تغییر دامنه/پورت پروژه هیچ لینک قدیمی‌ای را خراب نکند (چیزی که قبلاً
// باعث مشکل شده بود، چون APP_BASE_URL مستقیم در دیتابیس ذخیره می‌شد).
//
// این middleware، درست قبل از ارسال پاسخ JSON، هر رشته‌ای که با
// "/uploads/" شروع شود را با APP_BASE_URL همین لحظه کامل می‌کند. یعنی:
//   - در dev: http://localhost:4000/uploads/...   (با پورت، چون APP_BASE_URL همین‌طور است)
//   - در production: https://api.domain.com/uploads/...   (بدون پورت، چون APP_BASE_URL آن‌جا بدون پورت تنظیم می‌شود)
// و اگر فردا دامنه/پورت دوباره عوض شد، فقط کافی است APP_BASE_URL در env
// عوض شود — هیچ داده‌ای در دیتابیس نیازی به تغییر ندارد.
//
// این کار به‌صورت متمرکز (یک middleware، نه ده‌ها تغییر در سریالایزرهای
// پراکنده‌ی هر موجودیت) انجام می‌شود تا هیچ endpoint (فعلی یا آینده) از
// قلم نیفتد.
// ----------------------------------------------------------------------------

function rewriteMediaUrls(value: unknown): unknown {
  if (typeof value === "string") {
    return value.startsWith("/uploads/") ? `${env.APP_BASE_URL}${value}` : value;
  }

  if (Array.isArray(value)) {
    return value.map(rewriteMediaUrls);
  }

  // فقط object های ساده (literal) را بازگردی می‌کنیم — نه Date، Buffer،
  // یا instance های دیگر که Object.entries رویشان معنی‌دار نیست (مثلاً
  // یک Date را به {} تبدیل می‌کند و پاسخ را خراب می‌کند).
  if (value !== null && typeof value === "object" && value.constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      result[key] = rewriteMediaUrls(v);
    }
    return result;
  }

  return value;
}

export function resolveMediaUrls() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => originalJson(rewriteMediaUrls(body))) as Response["json"];
    next();
  };
}
