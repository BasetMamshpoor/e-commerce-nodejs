import { ApiError } from "./ApiError";

// ----------------------------------------------------------------------------
// در تایپ‌های Express، هر پارامتر مسیر می‌تواند string یا string[] باشد
// (برای پشتیبانی از پارامترهای تکراری/wildcard در path-to-regexp).
// در عمل تقریباً همیشه string است؛ این تابع همان را تضمین می‌کند و در غیر
// این صورت خطای ۴۰۰ واضح می‌دهد به‌جای بالا رفتن یک باگ نوع‌محور دستِ کاربر.
// ----------------------------------------------------------------------------

export function paramStr(value: string | string[] | undefined, name = "پارامتر"): string {
  if (typeof value !== "string" || value.length === 0) {
    throw ApiError.badRequest(`${name} نامعتبر است`);
  }
  return value;
}
