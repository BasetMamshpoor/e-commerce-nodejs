import { redis, isRedisReady } from "./redis";

// ----------------------------------------------------------------------------
// کش عمومی روی Redis برای خروجی‌های پرتکرار و نسبتاً کم‌تغییر (مثلاً درخت
// دسته‌بندی، لیست ارزها). طراحی محافظه‌کارانه است:
//   - اگر Redis در دسترس نباشد، getOrSetCache مستقیم fetcher را صدا می‌زند
//     (بدون کش) — یعنی نبود Redis هرگز باعث خطا یا داده‌ی قدیمی نمی‌شود،
//     فقط کند‌تر می‌شود.
//   - اگر مقدار کش‌شده JSON.parse نشد (داده‌ی خراب/فرمت قدیمی)، دوباره از
//     fetcher می‌خوانیم به‌جای کرش‌کردن.
//   - این کش برای «حذف دقیق با کلید» (invalidateCache) و همچنین برای
//     داده‌هایی که چند مسیر نوشتاری پراکنده دارند و invalidation دقیق
//     برایشان پرریسک است، با یک TTL کوتاه به‌تنهایی هم قابل استفاده است —
//     مصرف‌کننده باید خودش TTL مناسب داده را انتخاب کند.
// ----------------------------------------------------------------------------

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!redis || !isRedisReady()) {
    return fetcher();
  }

  try {
    const cached = await redis.get(`cache:${key}`);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // خطای اتصال یا JSON خراب — مثل کش نبودن رفتار کن
  }

  const fresh = await fetcher();

  if (redis && isRedisReady()) {
    redis
      .set(`cache:${key}`, JSON.stringify(fresh), "EX", ttlSeconds)
      .catch(() => {
        // نوشتن کش شکست بخورد مهم نیست؛ داده‌ی واقعی همین الان برگردانده شد
      });
  }

  return fresh;
}

export async function invalidateCache(keyOrPrefix: string): Promise<void> {
  if (!redis || !isRedisReady()) return;
  try {
    const pattern = `cache:${keyOrPrefix}*`;
    const keysToDelete: string[] = [];
    let cursor = "0";
    do {
      // از SCAN به‌جای KEYS استفاده می‌شود چون KEYS روی دیتاست بزرگ کل
      // Redis را برای مدتی بلاک می‌کند؛ SCAN تدریجی و غیرمسدودکننده است.
      const [nextCursor, foundKeys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      keysToDelete.push(...foundKeys);
    } while (cursor !== "0");

    if (keysToDelete.length > 0) await redis.del(...keysToDelete);
  } catch {
    // اگر پاک‌کردن کش شکست بخورد، بدترین حالت این است که تا پایان TTL
    // داده‌ی قدیمی برگردانده شود — نه خطا، نه از کار افتادن درخواست
  }
}
