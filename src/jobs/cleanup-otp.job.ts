import { prisma } from "../lib/prisma";
import { env } from "../config/env";

export async function runCleanupOtpJob(): Promise<void> {
  const threshold = new Date(Date.now() - env.OTP_CLEANUP_RETENTION_HOURS * 60 * 60 * 1000);

  const result = await prisma.otpCode.deleteMany({
    where: {
      createdAt: { lt: threshold },
      OR: [{ isUsed: true }, { expiresAt: { lt: new Date() } }],
    },
  });

  if (result.count > 0) {
    // eslint-disable-next-line no-console
    console.log(`[jobs] ${result.count} کد OTP مصرف‌شده/منقضی پاک‌سازی شد`);
  }
}
