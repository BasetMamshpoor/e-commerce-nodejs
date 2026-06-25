import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { CreateBannerInput, UpdateBannerInput } from "../../validations/cms.validation";
import { Banner, BannerPosition } from "../../generated/prisma";

export async function createBanner(input: CreateBannerInput): Promise<Banner> {
  return prisma.banner.create({ data: input });
}

export async function updateBanner(id: string, input: UpdateBannerInput): Promise<Banner> {
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) throw ApiError.notFound("بنر پیدا نشد");
  return prisma.banner.update({ where: { id }, data: input });
}

export async function deleteBanner(id: string): Promise<void> {
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
