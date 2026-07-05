import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { hashPassword, comparePassword } from "../../utils/hash";
import { detectIdentifierChannel, normalizeIdentifier } from "../../utils/otp";
import { issueOtp, verifyOtp } from "../otp/otp.service";
import { revokeAllSessions } from "../auth/session.service";
import {
  UpdateMyProfileInput,
  ChangePasswordInput,
} from "../../validations/profile.validation";
import { User } from "../../generated/prisma";

function publicUser(user: User) {
  const { password, ...rest } = user;
  return rest;
}

export async function getMyProfile(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("کاربر پیدا نشد");

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  return { ...publicUser(user), walletBalance: wallet?.balance ?? 0 };
}

export async function updateMyProfile(userId: number, input: UpdateMyProfileInput) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: input,
  });
  return publicUser(updated);
}

export async function changeMyPassword(
  userId: number,
  currentSessionId: string,
  input: ChangePasswordInput
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("کاربر پیدا نشد");

  if (user.password) {
    const matches = await comparePassword(input.currentPassword, user.password);
    if (!matches) throw ApiError.badRequest("رمز عبور فعلی اشتباه است");
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password: passwordHash } });

  await revokeAllSessions(userId, currentSessionId);
}

export async function requestChangeIdentifier(userId: number, newIdentifierRaw: string) {
  const channel = detectIdentifierChannel(newIdentifierRaw);
  const newIdentifier = normalizeIdentifier(newIdentifierRaw);

  const existing =
    channel === "SMS"
      ? await prisma.user.findUnique({ where: { phone: newIdentifier } })
      : await prisma.user.findUnique({ where: { email: newIdentifier } });

  if (existing && existing.id !== userId) {
    throw ApiError.conflict("این شناسه قبلاً توسط حساب دیگری استفاده شده است");
  }

  const purpose = channel === "SMS" ? "CHANGE_PHONE" : "VERIFY_EMAIL";
  return issueOtp({ identifier: newIdentifier, purpose, userId });
}

export async function verifyChangeIdentifier(
  userId: number,
  newIdentifierRaw: string,
  code: string
) {
  const channel = detectIdentifierChannel(newIdentifierRaw);
  const newIdentifier = normalizeIdentifier(newIdentifierRaw);
  const purpose = channel === "SMS" ? "CHANGE_PHONE" : "VERIFY_EMAIL";

  await verifyOtp({ identifier: newIdentifier, code, purpose });

  const existing =
    channel === "SMS"
      ? await prisma.user.findUnique({ where: { phone: newIdentifier } })
      : await prisma.user.findUnique({ where: { email: newIdentifier } });
  if (existing && existing.id !== userId) {
    throw ApiError.conflict("این شناسه قبلاً توسط حساب دیگری استفاده شده است");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data:
      channel === "SMS"
        ? { phone: newIdentifier, phoneVerifiedAt: new Date() }
        : { email: newIdentifier, emailVerifiedAt: new Date() },
  });

  return publicUser(updated);
}
