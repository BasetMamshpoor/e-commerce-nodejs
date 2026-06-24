import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { signAccessToken, signRefreshToken } from "../../utils/jwt";
import { sha256 } from "../../utils/hash";

export interface DeviceMeta {
  ip?: string;
  userAgent?: string;
  deviceName?: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

// ----------------------------------------------------------------------------
// ساخت نشست جدید برای کاربر بعد از لاگین موفق (با رمز یا OTP).
// اگر تعداد نشست‌های فعال کاربر از MAX_ACTIVE_SESSIONS بیشتر شود، قدیمی‌ترین
// نشست‌ها غیرفعال می‌شوند (آیتم ۲۵: محدودیت تعداد نشست‌های کاربری).
// ----------------------------------------------------------------------------

export async function createSessionAndTokens(
  userId: string,
  role: string,
  device: DeviceMeta
): Promise<IssuedTokens> {
  await enforceMaxActiveSessions(userId);

  // ابتدا یک نشست با توکن موقت می‌سازیم تا sessionId را برای امضای JWT داشته باشیم،
  // سپس refresh token واقعی را امضا کرده و هش آن را در همان رکورد ذخیره می‌کنیم.
  const session = await prisma.userSession.create({
    data: {
      userId,
      token: "pending", // موقت، چند سطر پایین‌تر بازنویسی می‌شود
      ip: device.ip,
      userAgent: device.userAgent,
      deviceName: device.deviceName,
    },
  });

  const accessToken = signAccessToken({ userId, role, sessionId: session.id });
  const refreshToken = signRefreshToken({ userId, sessionId: session.id });

  await prisma.userSession.update({
    where: { id: session.id },
    data: { token: sha256(refreshToken) },
  });

  return { accessToken, refreshToken, sessionId: session.id };
}

async function enforceMaxActiveSessions(userId: string): Promise<void> {
  const activeSessions = await prisma.userSession.findMany({
    where: { userId, isActive: true },
    orderBy: { lastActivityAt: "asc" },
    select: { id: true },
  });

  // اگر با اضافه‌شدن نشست جدید از سقف رد می‌شویم، قدیمی‌ترین‌ها را غیرفعال کن
  const overflow = activeSessions.length - env.MAX_ACTIVE_SESSIONS + 1;
  if (overflow > 0) {
    const idsToDeactivate = activeSessions.slice(0, overflow).map((s) => s.id);
    await prisma.userSession.updateMany({
      where: { id: { in: idsToDeactivate } },
      data: { isActive: false },
    });
  }
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  });
}

export async function revokeAllSessions(userId: string, exceptSessionId?: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
    data: { isActive: false },
  });
}
