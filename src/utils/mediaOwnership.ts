import { prisma } from "../lib/prisma";
import { ApiError } from "./ApiError";

// ----------------------------------------------------------------------------
// وقتی شناسه‌ی رسانه‌ها (mediaId) مستقیماً در بدنه‌ی JSON فرستاده می‌شود
// (نه صرفاً از طریق میدل‌ور آپلود مولتی‌پارت که خودش تازه و متعلق به همین
// کاربر می‌سازد)، باید مطمئن شویم این رسانه‌ها واقعاً وجود دارند و متعلق
// به همین کاربرند — وگرنه هر کاربری می‌تواند با فرستادن شناسه‌ی رسانه‌ی
// دیگران (مثلاً یک تصویر محصول یا پیوست تیکت شخص دیگر)، آن را به کامنت/
// تیکت/درخواست مرجوعی خودش وصل کند.
// ----------------------------------------------------------------------------
export async function assertMediaOwnedByUser(
  mediaIds: number[],
  userId: number,
  errorMessage = "برخی از فایل‌های پیوست معتبر نیستند یا متعلق به شما نیستند"
): Promise<void> {
  if (mediaIds.length === 0) return;

  const owned = await prisma.media.findMany({
    where: { id: { in: mediaIds }, uploadedById: userId },
    select: { id: true },
  });

  if (owned.length !== new Set(mediaIds).size) {
    throw ApiError.badRequest(errorMessage);
  }
}
