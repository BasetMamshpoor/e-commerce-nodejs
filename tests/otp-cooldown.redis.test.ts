import { redis } from "../src/lib/redis";
import { issueOtp } from "../src/services/otp/otp.service";
import { ApiError } from "../src/utils/ApiError";
import { prisma } from "../src/lib/prisma";

describe("OTP resend cooldown (Redis fast-path)", () => {
  const identifier = `otpcooldown${Date.now()}@example.com`;

  afterAll(async () => {
    if (redis) await redis.del(`otpcooldown:REGISTER:${identifier}`);
    await prisma.otpCode.deleteMany({ where: { identifier } });
  });

  it("درخواست دوم قبل از پایان cooldown باید رد شود", async () => {
    await issueOtp({ identifier, purpose: "REGISTER" });
    await expect(issueOtp({ identifier, purpose: "REGISTER" })).rejects.toBeInstanceOf(ApiError);
  });

  it("بعد از پایان cooldown (شبیه‌سازی‌شده)، درخواست بعدی باید موفق شود", async () => {
    // به‌جای صبر واقعی برای OTP_RESEND_COOLDOWN_SECONDS، مستقیم کلید
    // Redis مربوط به cooldown را پاک می‌کنیم تا شبیه‌ساز پایان آن باشد
    if (redis) await redis.del(`otpcooldown:REGISTER:${identifier}`);
    await expect(issueOtp({ identifier, purpose: "REGISTER" })).resolves.toBeDefined();
  });

  it("cooldown برای purpose های متفاوت مستقل از هم است", async () => {
    await expect(issueOtp({ identifier, purpose: "LOGIN" })).resolves.toBeDefined();
    await prisma.otpCode.deleteMany({ where: { identifier, purpose: "LOGIN" } });
    if (redis) await redis.del(`otpcooldown:LOGIN:${identifier}`);
  });
});
