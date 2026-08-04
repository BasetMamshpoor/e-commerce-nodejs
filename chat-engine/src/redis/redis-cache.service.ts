import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";
// ----------------------------------------------------------------------------
// کوئری‌های خواندنی روی دیتابیس فروشگاه (قیمت/موجودی/جست‌وجو) در یک مکالمه‌ی
// شلوغ ممکن است چندین‌بار برای همان محصول تکرار شوند — حتی هزاران‌بار در
// یک لحظه اگر یک محصول ترند شده باشد. دو مکانیزم مکمل هم این‌جا هست:
//
// ۱) کش Redis با TTL کوتاه: بار دوم به بعد اصلاً به Postgres نمی‌رسد.
// ۲) هم‌بسته‌سازی درخواست‌های هم‌زمان (single-flight/request coalescing):
//    وقتی کش هنوز خالی است و مثلاً ۵۰۰ درخواست هم‌زمان برای همان کلید
//    برسند (لحظه‌ی «سرد» شدن کش، دقیقاً همان سناریویی که پرسیدی)، بدون این
//    مکانیزم هر ۵۰۰ تا مستقیم به Postgres می‌زدند. با این مکانیزم، فقط
//    اولین درخواست واقعاً کوئری می‌زند و بقیه منتظر همان یک Promise
//    می‌مانند — روی هر نمونه (instance) از سرور، این تعداد کوئری همزمان
//    به‌ازای یک کلید را به ۱ می‌رساند (نه به تعداد کاربران).
// ----------------------------------------------------------------------------

@Injectable()
export class RedisCacheService {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async wrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }

    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = (async () => {
      try {
        const value = await loader();
        await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
        return value;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }

  // ----------------------------------------------------------------------------
  // محدودکننده‌ی نرخ ساده (sliding-window تقریبی با INCR+EXPIRE). لایه ۲
  // (AI) هزینه‌ی واقعی دارد؛ این جلوی سیل پیام از یک مشتری/بات را می‌گیرد.
  // خروجی true یعنی «مجاز است»، false یعنی «از سقف رد شده».
  // ----------------------------------------------------------------------------
  async allowRate(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    return count <= limit;
  }
}
