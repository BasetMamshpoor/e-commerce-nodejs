// ----------------------------------------------------------------------------
// کلاینت مشترک Redis برای کل پروژه — زیرساخت مشترک برای:
//   - محدودکننده‌ی نرخ درخواست توزیع‌شده (rate limiter)
//   - قفل توزیع‌شده برای جاب‌های زمان‌بندی‌شده (اگر پروژه چند-اینستنس اجرا شود)
//   - شمارنده‌ی تلاش‌های ناموفق ورود / cooldown ارسال OTP
//   - کش (فازهای بعدی)
//
// طراحی مهم: اگر Redis در دسترس نباشد یا REDIS_ENABLED=false باشد، پروژه
// نباید از کار بیفتد. هر مصرف‌کننده (rate limiter، قفل جاب، login guard)
// باید در نبود Redis به رفتار قبلی خودش (in-memory یا مستقیم دیتابیس)
// برگردد؛ برای همین `redis` می‌تواند null باشد و isRedisReady() وضعیت
// واقعی اتصال را برمی‌گرداند (نه فقط اینکه enabled هست یا نه).
// ----------------------------------------------------------------------------

import Redis from "ioredis";
import { env, isProd, isTest } from "../config/env";

declare global {
  // eslint-disable-next-line no-var
  var __redis__: Redis | undefined;
}

function createClient(): Redis | null {
  if (!env.REDIS_ENABLED) return null;

  const client = new Redis(env.REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: 1,
    // در تست/dev اگر Redis بالا نباشد نمی‌خواهیم لاگ‌های بی‌پایان retry
    // چاپ شود؛ بعد از چند تلاش کوتاه، مصرف‌کننده‌ها fallback می‌کنند.
    retryStrategy(times) {
      if (times > 5) return null; // دیگر retry نکن؛ isRedisReady() از این به بعد false برمی‌گرداند
      return Math.min(times * 200, 2000);
    },
    reconnectOnError: () => true,
  });

  client.on("error", (err) => {
    if (!isTest) {
      // eslint-disable-next-line no-console
      console.error("⚠️  خطای اتصال Redis (fallback به رفتار بدون Redis):", err.message);
    }
  });

  return client;
}

export const redis: Redis | null = global.__redis__ ?? createClient();

if (!isProd && redis) {
  global.__redis__ = redis;
}

// همیشه قبل از هر عملیات Redis این را چک کنید — چون client می‌تواند در
// حالت "در حال reconnect" یا کاملاً قطع باشد، نه فقط null.
export function isRedisReady(): boolean {
  return redis !== null && redis.status === "ready";
}

export async function disconnectRedis(): Promise<void> {
  if (redis) {
    await redis.quit().catch(() => {
      redis.disconnect();
    });
  }
}
