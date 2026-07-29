import crypto from "crypto";
import { redis, isRedisReady } from "./redis";

// ----------------------------------------------------------------------------
// قفل توزیع‌شده‌ی ساده روی Redis (الگوی SET NX PX). برای جایی استفاده
// می‌شود که یک کار (مثلاً کرون‌جاب) نباید هم‌زمان روی چند اینستنس/سرور
// اجرا شود.
//
// اگر Redis در دسترس نباشد، فرض می‌کنیم پروژه تک‌اینستنس اجرا می‌شود (که
// امروز همین‌طور است) و مستقیم fn را اجرا می‌کنیم — یعنی نبود Redis نباید
// جلوی اجرای جاب‌ها را بگیرد، فقط تضمین «فقط یک اینستنس» را از دست می‌دهیم.
// ----------------------------------------------------------------------------

const RELEASE_IF_OWNER_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

export async function withLock(
  lockName: string,
  ttlMs: number,
  fn: () => Promise<void>
): Promise<void> {
  if (!redis || !isRedisReady()) {
    await fn();
    return;
  }

  const lockKey = `lock:${lockName}`;
  const token = crypto.randomUUID();

  let acquired: string | null;
  try {
    acquired = await redis.set(lockKey, token, "PX", ttlMs, "NX");
  } catch {
    // اگر همین لحظه Redis قطع شد، مثل نبودن Redis رفتار کن
    await fn();
    return;
  }

  if (!acquired) {
    // یک اینستنس دیگر همین الان در حال اجرای همین کار است؛ این‌بار صرف‌نظر کن
    return;
  }

  try {
    await fn();
  } finally {
    // فقط اگر قفل هنوز مال همین اجراست آزادش کن — وگرنه ممکن است قفلِ
    // اجرای بعدی (که بعد از expire شدن قفل ما گرفته) را پاک کنیم
    await redis.eval(RELEASE_IF_OWNER_SCRIPT, 1, lockKey, token).catch(() => {});
  }
}
