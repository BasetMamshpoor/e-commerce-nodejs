import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { redis, isRedisReady } from "../lib/redis";

// ----------------------------------------------------------------------------
// محدودکننده‌ی نرخ درخواست.
//
// اگر Redis در دسترس باشد: شمارنده در Redis نگه‌داری می‌شود (INCR + PEXPIRE
// اتمیک از طریق یک اسکریپت Lua)، پس اگر پروژه روی چند اینستنس/سرور
// (horizontal scale) اجرا شود، همه‌ی اینستنس‌ها یک شمارنده‌ی مشترک می‌بینند.
//
// اگر Redis در دسترس نباشد (خاموش، REDIS_ENABLED=false، یا قطعی موقت):
// به همان رفتار قبلی (Map در حافظه‌ی همین پروسه) برمی‌گردیم تا از کار
// افتادن Redis باعث از کار افتادن کل API نشود — فقط این خاصیت را از دست
// می‌دهیم که شمارنده بین اینستنس‌ها مشترک باشد.
// ----------------------------------------------------------------------------

// اسکریپت اتمیک: شمارنده را یک واحد بالا می‌برد و فقط بار اول (وقتی مقدارش
// به ۱ می‌رسد) TTL را روی آن می‌گذارد — تا هر افزایش، انقضا را ریست نکند.
const INCR_WITH_TTL_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if tonumber(current) == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
return current
`;

async function incrementRedisCounter(key: string, windowMs: number): Promise<number | null> {
  if (!redis || !isRedisReady()) return null;
  try {
    const result = await redis.eval(INCR_WITH_TTL_SCRIPT, 1, key, windowMs);
    return Number(result);
  } catch {
    // اگر همین لحظه Redis قطع شد وسط عملیات، fallback به حالت in-memory
    return null;
  }
}

// --- fallback در حافظه‌ی پروسه (رفتار قبلی، دست‌نخورده) ---
interface Bucket {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, Bucket>();

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of memoryBuckets) {
    if (bucket.resetAt <= now) memoryBuckets.delete(key);
  }
}, 5 * 60 * 1000);
cleanupInterval.unref();

function incrementMemoryCounter(key: string, windowMs: number): number {
  const now = Date.now();
  let bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    memoryBuckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export function rateLimiter(options: RateLimitOptions) {
  const { windowMs, max, keyPrefix = "rl", message, keyGenerator } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const identity = keyGenerator ? keyGenerator(req) : req.ip ?? "unknown";
    const key = `ratelimit:${keyPrefix}:${identity}`;

    const redisCount = await incrementRedisCounter(key, windowMs);
    const count = redisCount ?? incrementMemoryCounter(key, windowMs);

    const remaining = Math.max(0, max - count);
    const resetAt = Date.now() + windowMs;
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(resetAt / 1000));

    if (count > max) {
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
