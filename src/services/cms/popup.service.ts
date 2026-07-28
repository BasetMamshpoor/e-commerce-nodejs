import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { CreatePopupInput, UpdatePopupInput } from "../../validations/cms.validation";
import { Popup } from "../../generated/prisma";
import { syncUrlWithMediaId } from "../../utils/mediaSync";

export async function createPopup(input: CreatePopupInput): Promise<Popup> {
  return prisma.popup.create({ data: syncUrlWithMediaId(input, "mediaId", "mediaUrl") });
}

export async function updatePopup(id: number, input: UpdatePopupInput): Promise<Popup> {
  const popup = await prisma.popup.findUnique({ where: { id } });
  if (!popup) throw ApiError.notFound("پاپ‌آپ پیدا نشد");
  return prisma.popup.update({ where: { id }, data: syncUrlWithMediaId(input, "mediaId", "mediaUrl") });
}

export async function deletePopup(id: number): Promise<void> {
  const popup = await prisma.popup.findUnique({ where: { id } });
  if (!popup) throw ApiError.notFound("پاپ‌آپ پیدا نشد");
  await prisma.popup.delete({ where: { id } });
}

export async function listPopupsAdmin(): Promise<Popup[]> {
  return prisma.popup.findMany({ orderBy: { startsAt: "desc" } });
}

/** پاپ‌آپ‌(های) فعال فعلی برای نمایش در سایت (مثلاً اطلاع‌رسانی جشنواره) */
export async function listActivePopups(): Promise<Popup[]> {
  const now = new Date();
  return prisma.popup.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
  });
}
