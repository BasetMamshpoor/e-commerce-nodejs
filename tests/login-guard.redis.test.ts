import { prisma } from "../src/lib/prisma";
import { redis } from "../src/lib/redis";
import { env } from "../src/config/env";
import { assertNotLockedOut, recordLoginAttempt } from "../src/services/auth/login-guard.service";
import { ApiError } from "../src/utils/ApiError";

describe("login-guard (شمارنده‌ی سریع Redis + سابقه‌ی دیتابیس)", () => {
  const identifier = `09${Date.now()}`.slice(0, 11);

  afterAll(async () => {
    if (redis) await redis.del(`loginlock:${identifier}`);
    await prisma.loginAttempt.deleteMany({ where: { identifier } });
  });

  it("قبل از رسیدن به سقف تلاش‌های ناموفق، قفل نمی‌کند", async () => {
    await expect(assertNotLockedOut(identifier)).resolves.toBeUndefined();

    for (let i = 0; i < env.LOGIN_MAX_FAILED_ATTEMPTS - 1; i++) {
      await recordLoginAttempt({ identifier, isSuccessful: false });
    }

    await expect(assertNotLockedOut(identifier)).resolves.toBeUndefined();
  });

  it("بعد از رسیدن به سقف تلاش‌های ناموفق، حساب را قفل می‌کند", async () => {
    await recordLoginAttempt({ identifier, isSuccessful: false });
    await expect(assertNotLockedOut(identifier)).rejects.toBeInstanceOf(ApiError);
  });

  it("همه‌ی تلاش‌ها همچنان در جدول loginAttempt (سابقه‌ی ادمین) ثبت شده‌اند", async () => {
    const count = await prisma.loginAttempt.count({ where: { identifier, isSuccessful: false } });
    expect(count).toBe(env.LOGIN_MAX_FAILED_ATTEMPTS);
  });
});
