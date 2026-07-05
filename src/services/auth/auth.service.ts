import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { hashPassword, comparePassword, sha256 } from "../../utils/hash";
import { normalizeIdentifier, detectIdentifierChannel } from "../../utils/otp";
import { issueOtp, verifyOtp, IssueOtpResult } from "../otp/otp.service";
import { createSessionAndTokens, revokeSession, revokeAllSessions, DeviceMeta, IssuedTokens } from "./session.service";
import { assertNotLockedOut, recordLoginAttempt } from "./login-guard.service";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "../../utils/jwt";
import { User } from "../../generated/prisma";

function publicUser(user: User) {
  const { password, ...rest } = user;
  return rest;
}

async function findUserByIdentifier(rawIdentifier: string) {
  const channel = detectIdentifierChannel(rawIdentifier);
  const identifier = normalizeIdentifier(rawIdentifier);
  return channel === "SMS"
    ? prisma.user.findUnique({ where: { phone: identifier } })
    : prisma.user.findUnique({ where: { email: identifier } });
}

export async function register(input: {
  fullName?: string;
  identifier: string;
  password: string;
}): Promise<IssueOtpResult> {
  const channel = detectIdentifierChannel(input.identifier);
  const identifier = normalizeIdentifier(input.identifier);

  const existing =
    channel === "SMS"
      ? await prisma.user.findUnique({ where: { phone: identifier } })
      : await prisma.user.findUnique({ where: { email: identifier } });

  if (existing) {
    throw ApiError.conflict("کاربری با این مشخصات قبلاً ثبت‌نام کرده است");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: channel === "EMAIL" ? identifier : undefined,
      phone: channel === "SMS" ? identifier : undefined,
      password: passwordHash,
      wallet: { create: { balance: 0 } },
    },
  });

  return issueOtp({ identifier, purpose: "REGISTER", userId: user.id });
}

export async function verifyRegisterOtp(
  identifier: string,
  code: string,
  device: DeviceMeta
): Promise<{ user: ReturnType<typeof publicUser>; tokens: IssuedTokens }> {
  const { identifier: normalized, channel } = await verifyOtp({ identifier, code, purpose: "REGISTER" });

  const user =
    channel === "SMS"
      ? await prisma.user.findUnique({ where: { phone: normalized } })
      : await prisma.user.findUnique({ where: { email: normalized } });

  if (!user) throw ApiError.notFound("کاربر مربوط به این کد پیدا نشد");

  const updated = await prisma.user.update({
    where: { id: user.id },
    data:
      channel === "SMS"
        ? { phoneVerifiedAt: new Date() }
        : { emailVerifiedAt: new Date() },
  });

  const tokens = await createSessionAndTokens(updated.id, updated.role, device);
  await touchLastLogin(updated.id, device.ip);

  return { user: publicUser(updated), tokens };
}

export async function login(input: {
  identifier: string;
  password: string;
  device: DeviceMeta;
}): Promise<{ user: ReturnType<typeof publicUser>; tokens: IssuedTokens }> {
  const identifier = normalizeIdentifier(input.identifier);
  await assertNotLockedOut(identifier);

  const user = await findUserByIdentifier(input.identifier);

  const fail = async (message: string) => {
    await recordLoginAttempt({
      identifier,
      userId: user?.id,
      ip: input.device.ip,
      userAgent: input.device.userAgent,
      isSuccessful: false,
    });
    throw ApiError.badRequest(message);
  };

  if (!user || !user.password) {
    return fail("شناسه یا رمز عبور اشتباه است");
  }
  if (user.isBlocked) {
    throw ApiError.forbidden(user.blockedReason ?? "حساب کاربری شما مسدود شده است");
  }

  const isMatch = await comparePassword(input.password, user.password);
  if (!isMatch) {
    return fail("شناسه یا رمز عبور اشتباه است");
  }

  await recordLoginAttempt({
    identifier,
    userId: user.id,
    ip: input.device.ip,
    userAgent: input.device.userAgent,
    isSuccessful: true,
  });

  const tokens = await createSessionAndTokens(user.id, user.role, input.device);
  await touchLastLogin(user.id, input.device.ip);

  return { user: publicUser(user), tokens };
}

export async function requestLoginOtp(identifier: string): Promise<IssueOtpResult> {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    throw ApiError.notFound("کاربری با این مشخصات پیدا نشد");
  }
  if (user.isBlocked) {
    throw ApiError.forbidden(user.blockedReason ?? "حساب کاربری شما مسدود شده است");
  }
  return issueOtp({ identifier, purpose: "LOGIN", userId: user.id });
}

export async function verifyLoginOtp(
  identifier: string,
  code: string,
  device: DeviceMeta
): Promise<{ user: ReturnType<typeof publicUser>; tokens: IssuedTokens }> {
  const { identifier: normalized, channel } = await verifyOtp({ identifier, code, purpose: "LOGIN" });

  const user =
    channel === "SMS"
      ? await prisma.user.findUnique({ where: { phone: normalized } })
      : await prisma.user.findUnique({ where: { email: normalized } });

  if (!user) throw ApiError.notFound("کاربر مربوط به این کد پیدا نشد");
  if (user.isBlocked) {
    throw ApiError.forbidden(user.blockedReason ?? "حساب کاربری شما مسدود شده است");
  }

  const tokens = await createSessionAndTokens(user.id, user.role, device);
  await touchLastLogin(user.id, device.ip);

  return { user: publicUser(user), tokens };
}

export async function refreshTokens(refreshTokenRaw: string): Promise<IssuedTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshTokenRaw);
  } catch {
    throw ApiError.unauthorized("refresh token نامعتبر یا منقضی‌شده است");
  }

  const sessionId = Number(payload.sid);
  const session = await prisma.userSession.findUnique({ where: { id: sessionId } });

  if (!session || !session.isActive || session.userId !== Number(payload.sub) || session.token !== sha256(refreshTokenRaw)) {
    throw ApiError.unauthorized("نشست شما باطل شده، دوباره وارد شوید");
  }

  const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
  if (!user || user.isBlocked) {
    throw ApiError.unauthorized("دسترسی این حساب باطل شده است");
  }

  const newAccessToken = signAccessToken({ userId: String(user.id), role: user.role, sessionId: String(session.id) });
  const newRefreshToken = signRefreshToken({ userId: String(user.id), sessionId: String(session.id) });

  await prisma.userSession.update({
    where: { id: session.id },
    data: { token: sha256(newRefreshToken), lastActivityAt: new Date() },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken, sessionId: String(session.id) };
}

export async function logout(sessionId: string): Promise<void> {
  await revokeSession(sessionId);
}

export async function logoutAllDevices(userId: number, currentSessionId: string): Promise<void> {
  await revokeAllSessions(userId, currentSessionId);
}

export async function forgotPassword(identifier: string): Promise<IssueOtpResult> {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    throw ApiError.notFound("در صورت وجود حساب، کد بازیابی ارسال می‌شود");
  }
  return issueOtp({ identifier, purpose: "RESET_PASSWORD", userId: user.id });
}

export async function resetPassword(input: {
  identifier: string;
  code: string;
  newPassword: string;
}): Promise<void> {
  const { identifier: normalized, channel } = await verifyOtp({
    identifier: input.identifier,
    code: input.code,
    purpose: "RESET_PASSWORD",
  });

  const user =
    channel === "SMS"
      ? await prisma.user.findUnique({ where: { phone: normalized } })
      : await prisma.user.findUnique({ where: { email: normalized } });

  if (!user) throw ApiError.notFound("کاربر مربوط به این کد پیدا نشد");

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: passwordHash },
  });

  await revokeAllSessions(user.id);
}

async function touchLastLogin(userId: number, ip?: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date(), lastLoginIp: ip },
  });
}
