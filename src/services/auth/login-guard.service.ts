import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";

// ----------------------------------------------------------------------------
// این سرویس مستقل از rateLimiter عمومی (که بر اساس IP کار می‌کند) است.
// اینجا روی «شناسه‌ی حساب» (شماره موبایل/ایمیل) قفل موقت اعمال می‌شود تا حتی
// اگر مهاجم IP عوض کند، نتواند حساب یک کاربر خاص را brute-force کند.
// ----------------------------------------------------------------------------

export async function assertNotLockedOut(identifier: string): Promise<void> {
  const windowStart = new Date(
    Date.now() - env.LOGIN_LOCK_WINDOW_MINUTES * 60 * 1000
  );

  const failedCount = await prisma.loginAttempt.count({
    where: {
      identifier,
      isSuccessful: false,
      createdAt: { gte: windowStart },
    },
  });

  if (failedCount >= env.LOGIN_MAX_FAILED_ATTEMPTS) {
    throw ApiError.tooMany(
      `به‌دلیل تلاش‌های ناموفق زیاد، ورود برای این حساب موقتاً قفل شده. بعد از ${env.LOGIN_LOCK_WINDOW_MINUTES} دقیقه دوباره تلاش کنید`
    );
  }
}

export async function recordLoginAttempt(params: {
  identifier: string;
  userId?: string;
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
}
