import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

// ----------------------------------------------------------------------------
// validate(schema) را روی body/query/params اعمال می‌کنیم.
// خروجی parse شده (با تایپ‌ها و default های zod) جای‌گزین req[part] می‌شود
// تا کنترلر همیشه داده‌ی تمیز و معتبر دریافت کند.
// اگر داده نامعتبر باشد، ZodError پرتاب می‌شود و توسط errorHandler مرکزی
// (که instanceof ZodError را تشخیص می‌دهد) به پاسخ 400 تبدیل می‌شود.
// ----------------------------------------------------------------------------

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodType, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    req[part] = schema.parse(req[part]);
    next();
  };
}
