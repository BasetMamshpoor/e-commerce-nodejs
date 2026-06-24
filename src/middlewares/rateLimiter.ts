import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

// ----------------------------------------------------------------------------
// محدودکننده‌ی نرخ درخواست به‌صورت in-memory (بدون پکیج اضافه).
// مناسب برای تک‌اینستنس (single instance). اگر پروژه را روی چند نمونه/سرور
// (horizontal scale) دیپلوی کردید، این Map باید با یک store مشترک
// (مثل Redis) جای‌گزین شود وگرنه هر اینستنس شمارنده‌ی جدا خودش را دارد.
// ----------------------------------------------------------------------------

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// هر چند دقیقه یک‌بار سطل‌های منقضی‌شده را پاک می‌کنیم تا حافظه شلوغ نشود
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60 * 1000);
// unref می‌کند تا این تایمر تنها چیزی نباشد که جلوی خروج طبیعی پروسه
// (مثلاً در پایان تست‌های jest) را می‌گیرد
cleanupInterval.unref();

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix = "rl", message, keyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const identity = keyGenerator ? keyGenerator(req) : req.ip ?? "unknown";
    const key = `${keyPrefix}:${identity}`;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

    if (bucket.count > max) {
      return next(
        ApiError.tooMany(message ?? "تعداد درخواست‌های شما بیش از حد مجاز است، کمی صبر کنید")
      );
    }

    next();
  };
}

// لیمیتر سراسری روی همه‌ی مسیرهای API (بر اساس IP)
export function globalApiLimiter(windowMs: number, max: number) {
  return rateLimiter({ windowMs, max, keyPrefix: "global" });
}

// لیمیتر سخت‌گیرانه مخصوص مسیرهای حساس (لاگین، ارسال OTP و ...)
export function strictAuthLimiter(windowMs = 60_000, max = 10) {
  return rateLimiter({
    windowMs,
    max,
    keyPrefix: "auth",
    message: "تلاش‌های زیادی انجام شده، چند لحظه بعد دوباره تلاش کنید",
  });
}
