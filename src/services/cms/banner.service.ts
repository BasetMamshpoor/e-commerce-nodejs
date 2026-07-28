import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { CreateBannerInput, UpdateBannerInput } from "../../validations/cms.validation";
import { Banner, BannerPosition } from "../../generated/prisma";
import { syncUrlWithMediaId } from "../../utils/mediaSync";

export async function createBanner(input: CreateBannerInput): Promise<Banner> {
  return prisma.banner.create({ data: syncUrlWithMediaId(input, "mediaId", "imageUrl") });
}

export async function updateBanner(id: number, input: UpdateBannerInput): Promise<Banner> {
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) throw ApiError.notFound("بنر پیدا نشد");
  return prisma.banner.update({ where: { id }, data: syncUrlWithMediaId(input, "mediaId", "imageUrl") });
}

export async function deleteBanner(id: number): Promise<void> {
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) throw ApiError.notFound("بنر پیدا نشد");
  await prisma.banner.delete({ where: { id } });
}

export async function listBannersAdmin(): Promise<Banner[]> {
  return prisma.banner.findMany({ orderBy: [{ position: "asc" }, { order: "asc" }] });
}

/** فقط بنرهای فعال و در بازه‌ی زمانی فعلی، برای نمایش در سایت */
export async function listActiveBanners(position?: BannerPosition): Promise<Banner[]> {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      ...(position ? { position } : {}),
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { order: "asc" },
  });
}
