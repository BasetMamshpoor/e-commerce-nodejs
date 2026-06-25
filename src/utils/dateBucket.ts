// ----------------------------------------------------------------------------
// کمک‌کننده‌ی ساده برای گروه‌بندی تاریخ‌ها در نمودارهای آنالیزی.
// چون حجم داده در این پروژه برای groupBy تاریخ در سطح دیتابیس توجیه‌پذیر
// نیست (و بین دیتابیس‌های مختلف فرق می‌کند)، گروه‌بندی در همین لایه‌ی
// اپلیکیشن (بعد از خوانش رکوردهای بازه‌ی زمانی) انجام می‌شود. برای حجم
// داده‌ی خیلی بزرگ، بعداً به یک کوئری SQL خام یا materialized view مهاجرت کنید.
// ----------------------------------------------------------------------------

export type BucketPeriod = "day" | "week" | "month";

export function bucketKey(date: Date, period: BucketPeriod): string {
  const d = new Date(date);
  if (period === "month") {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  if (period === "week") {
    // شروع هفته از دوشنبه
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
  }
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function defaultDateRange(days = 30): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to };
}
