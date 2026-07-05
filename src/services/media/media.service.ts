import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { getStorageProvider, mapMimeTypeToMediaType, isMimeAllowed } from "./local-storage.provider";
import { MediaType, Prisma } from "../../generated/prisma";

export interface SavedMedia {
  id: number;
  fileName: string;
  originalName: string;
  filePath: string;
  url: string;
  mimeType: string;
  size: number;
  type: MediaType;
  entityType: string | null;
}

export async function saveFileToMedia(
  file: Express.Multer.File,
  entityType: string,
  uploadedById?: number
): Promise<SavedMedia> {
  if (!isMimeAllowed(file.mimetype)) {
    throw ApiError.badRequest(`فرمت فایل مجاز نیست: ${file.mimetype}`);
  }

  const storage = getStorageProvider();
  const stored = await storage.save(file, entityType);
  const type = mapMimeTypeToMediaType(file.mimetype);

  const media = await prisma.media.create({
    data: {
      fileName: stored.fileName,
      originalName: stored.originalName,
      filePath: stored.filePath,
      url: stored.url,
      mimeType: stored.mimeType,
      size: stored.size,
      type,
      entityType,
      uploadedById,
    },
  });

  return {
    id: media.id,
    fileName: media.fileName,
    originalName: media.originalName,
    filePath: media.filePath,
    url: media.url,
    mimeType: media.mimeType,
    size: media.size,
    type: media.type,
    entityType: media.entityType,
  };
}

export async function saveFilesToMedia(
  files: Express.Multer.File[],
  entityType: string,
  uploadedById?: number
): Promise<SavedMedia[]> {
  return Promise.all(files.map((f) => saveFileToMedia(f, entityType, uploadedById)));
}

export async function getMediaById(id: number) {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw ApiError.notFound("فایل پیدا نشد");
  return media;
}

export async function listMedia(query: {
  page?: number;
  limit?: number;
  type?: string;
  entityType?: string;
  search?: string;
}) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where: Prisma.MediaWhereInput = {};
  if (query.type) where.type = query.type as MediaType;
  if (query.entityType) where.entityType = query.entityType;
  if (query.search) {
    where.OR = [
      { originalName: { contains: query.search, mode: "insensitive" } },
      { fileName: { contains: query.search, mode: "insensitive" } },
    ];
  }

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

export async function checkMediaUsage(mediaId: number): Promise<string[]> {
  const usages: string[] = [];

  const [
    productImages, categories, brands, shippingCompanies, banners, popups,
    ticketAttachments, commentAttachments, orderReturnImages,
    blogCovers, storyCovers, storyVideos,
  ] = await Promise.all([
    prisma.productImage.count({ where: { mediaId } }),
    prisma.category.count({ where: { imageMediaId: mediaId } }),
    prisma.brand.count({ where: { logoMediaId: mediaId } }),
    prisma.shippingCompany.count({ where: { logoMediaId: mediaId } }),
    prisma.banner.count({ where: { mediaId } }),
    prisma.popup.count({ where: { mediaId } }),
    prisma.ticketAttachment.count({ where: { mediaId } }),
    prisma.commentAttachment.count({ where: { mediaId } }),
    prisma.orderReturnImage.count({ where: { mediaId } }),
    prisma.blogPost.count({ where: { coverImageMediaId: mediaId } }),
    prisma.story.count({ where: { coverImageMediaId: mediaId } }),
    prisma.story.count({ where: { videoMediaId: mediaId } }),
  ]);

  if (productImages > 0) usages.push(`Product images (${productImages})`);
  if (categories > 0) usages.push(`Category images (${categories})`);
  if (brands > 0) usages.push(`Brand logos (${brands})`);
  if (shippingCompanies > 0) usages.push(`Shipping company logos (${shippingCompanies})`);
  if (banners > 0) usages.push(`Banners (${banners})`);
  if (popups > 0) usages.push(`Popups (${popups})`);
  if (ticketAttachments > 0) usages.push(`Ticket attachments (${ticketAttachments})`);
  if (commentAttachments > 0) usages.push(`Comment attachments (${commentAttachments})`);
  if (orderReturnImages > 0) usages.push(`Order return images (${orderReturnImages})`);
  if (blogCovers > 0) usages.push(`Blog cover images (${blogCovers})`);
  if (storyCovers > 0) usages.push(`Story cover images (${storyCovers})`);
  if (storyVideos > 0) usages.push(`Story videos (${storyVideos})`);

  return usages;
}

export async function deleteMedia(id: number): Promise<void> {
  const media = await getMediaById(id);

  const usages = await checkMediaUsage(id);
  if (usages.length > 0) {
    throw ApiError.conflict(
      `این فایل در حال استفاده است: ${usages.join("، ")}. ابتدا استفاده‌ها را حذف کنید.`
    );
  }

  const storage = getStorageProvider();
  await storage.delete(media.filePath);
  await prisma.media.delete({ where: { id } });
}

export function serializeMedia(media: {
  id: number;
  fileName: string;
  originalName: string;
  filePath: string;
  url: string;
  mimeType: string;
  size: number;
  type: MediaType;
  entityType: string | null;
  uploadedById: number | null;
  createdAt: Date;
}) {
  return {
    id: media.id,
    fileName: media.fileName,
    originalName: media.originalName,
    url: media.url,
    mimeType: media.mimeType,
    size: media.size,
    type: media.type,
    entityType: media.entityType,
    uploadedById: media.uploadedById,
    createdAt: media.createdAt,
  };
}
