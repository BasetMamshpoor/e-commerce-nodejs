import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { hashPassword, comparePassword } from "../../utils/hash";
import { detectIdentifierChannel, normalizeIdentifier } from "../../utils/otp";
import { issueOtp, verifyOtp } from "../otp/otp.service";
import { serializeUserAvatar } from "../../utils/serialize";
import { revokeAllSessions } from "../auth/session.service";
import {
  UpdateMyProfileInput,
  ChangePasswordInput,
} from "../../validations/profile.validation";
import { User, Media } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// پروفایل خودِ کاربر. تغییر ایمیل/موبایل (چون همان شناسه‌ی ورود است) از
// مسیر register عبور می‌کند: یک OTP به شناسه‌ی جدید فرستاده و فقط بعد از
// تایید همان کد، واقعاً جای‌گزین می‌شود — تا کسی نتواند با صرفاً دانستن
// ایمیل/موبایل یک نفر دیگر، آن را به حساب خودش منتقل کند.
// ----------------------------------------------------------------------------

function publicUser(user: User & { avatar?: Media | null }) {
  const { password, ...rest } = user;
  return serializeUserAvatar(rest);
}

export async function getMyProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { avatar: true } });
  if (!user) throw ApiError.notFound("کاربر پیدا نشد");

  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  return { ...publicUser(user), walletBalance: wallet?.balance ?? 0 };
}

export async function updateMyProfile(userId: string, input: UpdateMyProfileInput) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: input,
    include: { avatar: true },
  });
  return publicUser(updated);
}

export async function setMyAvatar(userId: string, mediaId: string) {
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) throw ApiError.badRequest("فایل انتخاب‌شده پیدا نشد");

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatarId: mediaId },
    include: { avatar: true },
  });
  return publicUser(updated);
}

export async function changeMyPassword(
  userId: string,
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

  // خروج از تمام دستگاه‌های دیگر (نشست فعلی باز می‌ماند چون کاربر همین الان هویتش را با رمز فعلی ثابت کرد)
  await revokeAllSessions(userId, currentSessionId);
}

export async function requestChangeIdentifier(userId: string, newIdentifierRaw: string) {
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
  userId: string,
  newIdentifierRaw: string,
  code: string
) {
  const channel = detectIdentifierChannel(newIdentifierRaw);
  const newIdentifier = normalizeIdentifier(newIdentifierRaw);
  const purpose = channel === "SMS" ? "CHANGE_PHONE" : "VERIFY_EMAIL";

  await verifyOtp({ identifier: newIdentifier, code, purpose });

  // بررسی دوباره‌ی یکتایی (محافظت در برابر race condition بین درخواست و تایید)
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
    include: { avatar: true },
  });

  return publicUser(updated);
}
