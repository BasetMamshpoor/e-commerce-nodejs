import express from "express";
import request from "supertest";
import { redis } from "../src/lib/redis";

// ----------------------------------------------------------------------------
// این تست‌ها هم مسیر Redis-backed را چک می‌کنند (با Redis واقعیِ همین محیط)
// و هم مسیر fallback در حافظه را — با mock کردن ماژول redis طوری که
// isRedisReady() همیشه false برگرداند (شبیه‌سازی خاموش‌بودن Redis).
// ----------------------------------------------------------------------------

async function buildTestApp(rateLimiterModulePath: string, keyPrefix: string) {
  jest.resetModules();
  const { rateLimiter } = await import(rateLimiterModulePath);
  const redisModule = await import("../src/lib/redis");
  // در تولید، اتصال Redis قبل از پذیرفتن ترافیک برقرار شده؛ اینجا هم صبر
  // می‌کنیم تا آماده شود، وگرنه چند درخواست اول قبل از "ready" شدن به
  // fallback حافظه می‌روند و شمارش را ناهماهنگ می‌کنند.
  if (redisModule.redis && redisModule.redis.status !== "ready") {
    await new Promise<void>((resolve) => {
      redisModule.redis!.once("ready", () => resolve());
      setTimeout(resolve, 2000);
    });
  }
  const app = express();
  app.get(
    "/ping",
    rateLimiter({ windowMs: 60_000, max: 3, keyPrefix }),
    (_req, res) => res.json({ ok: true })
  );
  return app;
}

describe("rateLimiter (Redis-backed)", () => {
  afterAll(async () => {
    // پاک‌کردن کلیدهای تست از Redis تا روی اجراهای بعدی اثر نگذارد
    if (redis) {
      const keys = await redis.keys("ratelimit:test-*");
      if (keys.length) await redis.del(...keys);
    }
  });

  it("بعد از رسیدن به سقف، درخواست بعدی را با 429 رد می‌کند", async () => {
    const app = await buildTestApp("../src/middlewares/rateLimiter", `test-redis-${Date.now()}`);

    const first = await request(app).get("/ping");
    const second = await request(app).get("/ping");
    const third = await request(app).get("/ping");
    const fourth = await request(app).get("/ping");

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(200);
    expect(fourth.status).toBe(429);
  });

  it("هدرهای X-RateLimit-* را برمی‌گرداند", async () => {
    const app = await buildTestApp("../src/middlewares/rateLimiter", `test-headers-${Date.now()}`);
    const res = await request(app).get("/ping");
    expect(res.headers["x-ratelimit-limit"]).toBe("3");
    expect(res.headers["x-ratelimit-remaining"]).toBe("2");
  });
});

describe("rateLimiter (fallback در حافظه وقتی Redis در دسترس نیست)", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock("../src/lib/redis", () => ({
      redis: null,
      isRedisReady: () => false,
    }));
  });

  afterEach(() => {
    jest.dontMock("../src/lib/redis");
  });

  it("حتی بدون Redis، محدودیت نرخ درست کار می‌کند", async () => {
    const app = await buildTestApp("../src/middlewares/rateLimiter", `test-fallback-${Date.now()}`);

    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push((await request(app).get("/ping")).status);
    }

    expect(results).toEqual([200, 200, 200, 429]);
  });
});
