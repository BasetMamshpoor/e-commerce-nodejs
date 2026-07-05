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

export async function createSessionAndTokens(userId: number, role: string, device: DeviceMeta): Promise<IssuedTokens> {
  await enforceMaxActiveSessions(userId);

  const session = await prisma.userSession.create({
    data: {
      userId,
      token: "pending",
      ip: device.ip,
      userAgent: device.userAgent,
      deviceName: device.deviceName,
    },
  });

  const accessToken = signAccessToken({ userId: String(userId), role, sessionId: String(session.id) });
  const refreshToken = signRefreshToken({ userId: String(userId), sessionId: String(session.id) });

  await prisma.userSession.update({
    where: { id: session.id },
    data: { token: sha256(refreshToken) },
  });

  return { accessToken, refreshToken, sessionId: String(session.id) };
}

async function enforceMaxActiveSessions(userId: number): Promise<void> {
  const activeSessions = await prisma.userSession.findMany({
    where: { userId, isActive: true },
    orderBy: { lastActivityAt: "asc" },
    select: { id: true },
  });

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
  const id = Number(sessionId);
  await prisma.userSession.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function revokeAllSessions(userId: number, exceptSessionId?: string): Promise<void> {
  const exceptId = exceptSessionId ? Number(exceptSessionId) : undefined;
  await prisma.userSession.updateMany({
    where: { userId, ...(exceptId ? { id: { not: exceptId } } : {}) },
    data: { isActive: false },
  });
}
