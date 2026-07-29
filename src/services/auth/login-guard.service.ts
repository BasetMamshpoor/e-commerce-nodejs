import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { redis, isRedisReady } from "../../lib/redis";

// ----------------------------------------------------------------------------
// این سرویس مستقل از rateLimiter عمومی (که بر اساس IP کار می‌کند) است.
// اینجا روی «شناسه‌ی حساب» (شماره موبایل/ایمیل) قفل موقت اعمال می‌شود تا حتی
// اگر مهاجم IP عوض کند، نتواند حساب یک کاربر خاص را brute-force کند.
//
// جدول loginAttempt همچنان برای هر تلاش (موفق/ناموفق) نوشته می‌شود — این
// سابقه برای امنیت/گزارش‌گیری ادمین لازم است و حذف نمی‌شود.
// اما بررسیِ «آیا قفل است؟» که قبلاً هر بار یک COUNT() روی این جدول می‌زد،
// حالا اگر Redis در دسترس باشد از یک شمارنده‌ی سریع Redis (با TTL برابر
// پنجره‌ی قفل) خوانده می‌شود؛ در نبود Redis، دقیقاً به همان COUNT() قبلی
// روی دیتابیس برمی‌گردد.
// ----------------------------------------------------------------------------

function redisKey(identifier: string): string {
  return `loginlock:${identifier}`;
}

async function getFailedCountFromRedis(identifier: string): Promise<number | null> {
  if (!redis || !isRedisReady()) return null;
  try {
    const value = await redis.get(redisKey(identifier));
    return value ? Number(value) : 0;
  } catch {
    return null;
  }
}

export async function assertNotLockedOut(identifier: string): Promise<void> {
  let failedCount = await getFailedCountFromRedis(identifier);

  if (failedCount === null) {
    // Redis در دسترس نیست: مسیر قبلی (کوئری مستقیم دیتابیس)
    const windowStart = new Date(
      Date.now() - env.LOGIN_LOCK_WINDOW_MINUTES * 60 * 1000
    );
    failedCount = await prisma.loginAttempt.count({
      where: {
        identifier,
        isSuccessful: false,
        createdAt: { gte: windowStart },
      },
    });
  }

  if (failedCount >= env.LOGIN_MAX_FAILED_ATTEMPTS) {
    throw ApiError.tooMany(
      `به‌دلیل تلاش‌های ناموفق زیاد، ورود برای این حساب موقتاً قفل شده. بعد از ${env.LOGIN_LOCK_WINDOW_MINUTES} دقیقه دوباره تلاش کنید`
    );
  }
}

export async function recordLoginAttempt(params: {
  identifier: string;
  userId?: number;
  ip?: string;
  userAgent?: string;
  isSuccessful: boolean;
}): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      identifier: params.identifier,
      userId: params.userId,
      ip: params.ip,
      userAgent: params.userAgent,
      isSuccessful: params.isSuccessful,
    },
  });

  if (!params.isSuccessful && redis && isRedisReady()) {
    const key = redisKey(params.identifier);
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, env.LOGIN_LOCK_WINDOW_MINUTES * 60 * 1000);
      }
    } catch {
      // اگر Redis وسط کار قطع شد، مهم نیست — دفعه‌ی بعد از مسیر دیتابیس
      // خوانده می‌شود چون isRedisReady() آن لحظه false برمی‌گردد
    }
  }
}
