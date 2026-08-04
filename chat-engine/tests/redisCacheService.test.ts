import { RedisCacheService } from "../src/redis/redis-cache.service";

// یک ایمپلمنتیشن ساده و درون‌حافظه‌ای از همان چند متد ioredis که
// RedisCacheService استفاده می‌کند — بدون نیاز به Redis واقعی.
class FakeRedis {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, _ex: "EX", ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const current = Number((await this.get(key)) ?? "0") + 1;
    const existing = this.store.get(key);
    this.store.set(key, { value: String(current), expiresAt: existing?.expiresAt ?? Date.now() + 60_000 });
    return current;
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) entry.expiresAt = Date.now() + ttlSeconds * 1000;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("RedisCacheService: wrap", () => {
  it("بار دوم دیگر loader را صدا نمی‌زند (کش‌شده است)", async () => {
    const service = new RedisCacheService(new FakeRedis() as never);
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return { price: 1000 };
    };

    await service.wrap("k1", 20, loader);
    await service.wrap("k1", 20, loader);
    await service.wrap("k1", 20, loader);

    expect(calls).toBe(1);
  });

  it("مقدار null هم کش می‌شود (محصول پیدا نشد → دوباره کوئری نمی‌زند)", async () => {
    const service = new RedisCacheService(new FakeRedis() as never);
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return null;
    };

    const first = await service.wrap("missing", 20, loader);
    const second = await service.wrap("missing", 20, loader);

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(calls).toBe(1);
  });

  it("درخواست‌های هم‌زمان برای همان کلید را در یک loader یکی می‌کند (thundering herd)", async () => {
    const service = new RedisCacheService(new FakeRedis() as never);
    let calls = 0;
    const loader = async () => {
      calls += 1;
      await delay(20); // شبیه‌سازی یک کوئری واقعی Postgres با کمی تاخیر
      return { stock: 5 };
    };

    // شبیه‌سازی هزار مشتری که هم‌زمان درباره‌ی همان محصول سوال می‌پرسند
    const concurrentRequests = Array.from({ length: 1000 }, () => service.wrap("hot-product", 20, loader));
    const results = await Promise.all(concurrentRequests);

    expect(calls).toBe(1);
    expect(results.every((r) => r?.stock === 5)).toBe(true);
  });

  it("کلیدهای متفاوت مستقل از هم هستند", async () => {
    const service = new RedisCacheService(new FakeRedis() as never);
    let calls = 0;
    const loader = async (id: number) => {
      calls += 1;
      return { id };
    };

    await Promise.all([
      service.wrap("product-1", 20, () => loader(1)),
      service.wrap("product-2", 20, () => loader(2)),
    ]);

    expect(calls).toBe(2);
  });
});

describe("RedisCacheService: allowRate", () => {
  it("تا سقف مجاز است، بعدش رد می‌شود", async () => {
    const service = new RedisCacheService(new FakeRedis() as never);

    const results: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      results.push(await service.allowRate("rate-key", 3, 60));
    }

    expect(results).toEqual([true, true, true, false, false]);
  });
});
