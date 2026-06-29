import fs from "node:fs/promises";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { toPublicUrl, urlToFilePath } from "../../middlewares/upload.middleware";
import { Media, MediaType } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// بخش رسانه‌ها — آیتم ۱۷. مدیریت فایل‌های آپلودشده توسط ادمین/ادیتور/خریدار.
// ----------------------------------------------------------------------------

function mapMimeToMediaType(mimetype: string): MediaType {
  if (mimetype.startsWith("image/")) return "IMAGE";
  if (mimetype.startsWith("video/")) return "VIDEO";
  return "DOCUMENT";
}

export async function createMediaRecord(
  file: Express.Multer.File,
  uploadedById: string,
  alt?: string
): Promise<Media> {
  return prisma.media.create({
    data: {
      url: toPublicUrl(file.path),
      type: mapMimeToMediaType(file.mimetype),
      mimeType: file.mimetype,
      size: file.size,
      alt,
      uploadedById,
    },
  });
}

export async function createMediaRecords(
  files: Express.Multer.File[],
  uploadedById: string
): Promise<Media[]> {
  return Promise.all(files.map((file) => createMediaRecord(file, uploadedById)));
}

export async function listMedia(query: {
  page?: number;
  limit?: number;
  type?: MediaType;
  uploadedById?: string;
}) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where = {
    ...(query.type ? { type: query.type } : {}),
    ...(query.uploadedById ? { uploadedById: query.uploadedById } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.media.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}

export async function getMediaById(id: string): Promise<Media> {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw ApiError.notFound("فایل پیدا نشد");
  return media;
}

/** برای جلوگیری از N+1 در فرانت — چند id را یک‌جا resolve می‌کند */
export async function getMediaByIds(ids: string[]): Promise<Media[]> {
  if (ids.length === 0) return [];
  return prisma.media.findMany({ where: { id: { in: ids } } });
}

async function countMediaUsage(mediaId: string): Promise<number> {
  const counts = await Promise.all([
    prisma.user.count({ where: { avatarId: mediaId } }),
    prisma.productImage.count({ where: { mediaId } }),
    prisma.productVariantImage.count({ where: { mediaId } }),
    prisma.category.count({ where: { imageId: mediaId } }),
    prisma.brand.count({ where: { logoId: mediaId } }),
    prisma.shippingCompany.count({ where: { logoId: mediaId } }),
    prisma.banner.count({ where: { mediaId } }),
    prisma.popup.count({ where: { mediaId } }),
    prisma.ticketAttachment.count({ where: { mediaId } }),
    prisma.commentAttachment.count({ where: { mediaId } }),
    prisma.orderReturnImage.count({ where: { mediaId } }),
  ]);
  return counts.reduce((sum, c) => sum + c, 0);
}

export async function deleteMedia(id: string): Promise<void> {
  const media = await getMediaById(id);

  const usageCount = await countMediaUsage(id);
  if (usageCount > 0) {
    throw ApiError.conflict(
      "این فایل در حال استفاده است (محصول، دسته، برند، تیکت و ...) و قابل حذف نیست"
    );
  }

  await prisma.media.delete({ where: { id } });

  try {
    await fs.unlink(urlToFilePath(media.url));
  } catch {
    // فایل از قبل روی دیسک نبوده یا دستی حذف شده — مهم نیست، رکورد دیتابیس حذف شد
  }
}
