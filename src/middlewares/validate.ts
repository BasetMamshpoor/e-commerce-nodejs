import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

// ----------------------------------------------------------------------------
// validate(schema) را روی body/query/params اعمال می‌کنیم.
// خروجی parse شده (با تایپ‌ها و default های zod) جای‌گزین req[part] می‌شود
// تا کنترلر همیشه داده‌ی تمیز و معتبر دریافت کند.
// اگر داده نامعتبر باشد، ZodError پرتاب می‌شود و توسط errorHandler مرکزی
// (که instanceof ZodError را تشخیص می‌دهد) به پاسخ 400 تبدیل می‌شود.
//
// ⚠️ نکته‌ی مهم (باگ واقعی که در توسعه پیدا و رفع شد):
// در Express 5، req.query فقط getter دارد و هر بار مستقیم از روی
// req.url دوباره parse می‌شود — یعنی نه قابل بازنویسی است (خطای
// «Cannot set property query») و نه حتی mutate-کردن شیء برگشتی کمکی
// می‌کند (چون دفعه‌ی بعد که چیزی req.query را بخواند، دوباره از صفر
// محاسبه می‌شود، نه نسخه‌ی mutate شده). پس برای query، خروجی validate
// شده را در req.validatedQuery می‌گذاریم (نه در خودِ req.query) و
// کنترلرها باید از همان‌جا بخوانند. برای body/params مشکلی نیست (هر دو
// property معمولی و قابل‌نوشتن هستند).
// ----------------------------------------------------------------------------

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodType, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[part]);
    if (part === "query") {
      req.validatedQuery = parsed as Record<string, unknown>;
    } else {
      req[part] = parsed;
    }
    next();
  };
}
