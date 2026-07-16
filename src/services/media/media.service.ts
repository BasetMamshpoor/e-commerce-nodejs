import fs from "node:fs";
import path from "node:path";
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

export function normalizeMediaFolderPath(entityType: string, year: string, month: string) {
  const normalizedEntity = (entityType ?? "").trim().toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(normalizedEntity)) {
    throw ApiError.badRequest("مقادیر پوشه‌ی مدیا معتبر نیستند");
  }
  if (!/^\d{4}$/.test(year)) {
    throw ApiError.badRequest("مقادیر پوشه‌ی مدیا معتبر نیستند");
  }
  if (!/^(0[1-9]|1[0-2])$/.test(month)) {
    throw ApiError.badRequest("مقادیر پوشه‌ی مدیا معتبر نیستند");
  }

  return {
    entityType: normalizedEntity,
    year,
    month,
    prefix: `${normalizedEntity}/${year}/${month}`,
  };
}

async function countFilesRecursively(dirPath: string): Promise<number> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += await countFilesRecursively(fullPath);
    } else {
      count += 1;
    }
  }
  return count;
}

async function countDirectorySizeRecursively(dirPath: string): Promise<number> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  let size = 0;
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const stat = await fs.promises.stat(fullPath);
    if (entry.isDirectory()) {
      size += await countDirectorySizeRecursively(fullPath);
    } else {
      size += stat.size;
    }
  }
  return size;
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
  year?: string;
  month?: string;
}) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where: Prisma.MediaWhereInput = {};
  if (query.type) where.type = query.type as MediaType;
  if (query.entityType) where.entityType = query.entityType.toLowerCase();
  if (query.search) {
    where.OR = [
      { originalName: { contains: query.search, mode: "insensitive" } },
      { fileName: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.entityType && query.year && query.month) {
    where.filePath = { startsWith: `${query.entityType.toLowerCase()}/${query.year}/${query.month}` };
  } else if (query.entityType && query.year) {
    where.filePath = { startsWith: `${query.entityType.toLowerCase()}/${query.year}` };
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

export async function listMediaFolders(query?: { entityType?: string; year?: string; month?: string }) {
  const storage = getStorageProvider();
  const root = path.isAbsolute(storage.resolveRoot())
    ? storage.resolveRoot()
    : path.join(process.cwd(), storage.resolveRoot());

  const entries = await fs.promises.readdir(root, { withFileTypes: true });
  const entityDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  const requestedEntity = query?.entityType?.trim().toLowerCase();
  const requestedYear = query?.year;
  const requestedMonth = query?.month;
  const results: Array<{ entityType: string; year: string; month: string; path: string; fileCount: number; totalSize: number }> = [];

  for (const entityDir of entityDirs) {
    if (requestedEntity && entityDir !== requestedEntity) continue;
    const entityPath = path.join(root, entityDir);
    let yearEntries: fs.Dirent[] = [];
    try {
      yearEntries = await fs.promises.readdir(entityPath, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const yearEntry of yearEntries.filter((entry) => entry.isDirectory()).sort()) {
      if (requestedYear && yearEntry.name !== requestedYear) continue;
      const yearPath = path.join(entityPath, yearEntry.name);
      let monthEntries: fs.Dirent[] = [];
      try {
        monthEntries = await fs.promises.readdir(yearPath, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const monthEntry of monthEntries.filter((entry) => entry.isDirectory()).sort()) {
        if (requestedMonth && monthEntry.name !== requestedMonth) continue;
        const folderPath = path.join(yearPath, monthEntry.name);
        const relativePath = path.relative(root, folderPath).split(path.sep).join("/");
        const fileCount = await countFilesRecursively(folderPath);
        const totalSize = await countDirectorySizeRecursively(folderPath);
        results.push({
          entityType: entityDir,
          year: yearEntry.name,
          month: monthEntry.name,
          path: relativePath,
          fileCount,
          totalSize,
        });
      }
    }
  }

  return results;
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

export async function updateMedia(
  id: number,
  payload: Partial<{
    originalName: string;
    entityType: string;
    metadata: Record<string, unknown>;
  }>
) {
  const data: Prisma.MediaUpdateInput = {};
  if (payload.originalName !== undefined) {
    data.originalName = payload.originalName;
  }
  if (payload.entityType !== undefined) {
    data.entityType = payload.entityType.toLowerCase();
  }
  if (payload.metadata !== undefined) {
    data.metadata = payload.metadata as Prisma.InputJsonValue;
  }

  return prisma.media.update({ where: { id }, data });
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

export async function forceDeleteMedia(id: number): Promise<void> {
  const media = await getMediaById(id);
  const storage = getStorageProvider();

  await prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { mediaId: id } });
    await tx.category.updateMany({ where: { imageMediaId: id }, data: { imageMediaId: null } });
    await tx.brand.updateMany({ where: { logoMediaId: id }, data: { logoMediaId: null } });
    await tx.shippingCompany.updateMany({ where: { logoMediaId: id }, data: { logoMediaId: null } });
    await tx.banner.updateMany({ where: { mediaId: id }, data: { mediaId: null } });
    await tx.popup.updateMany({ where: { mediaId: id }, data: { mediaId: null } });
    await tx.ticketAttachment.deleteMany({ where: { mediaId: id } });
    await tx.commentAttachment.deleteMany({ where: { mediaId: id } });
    await tx.orderReturnImage.deleteMany({ where: { mediaId: id } });
    await tx.blogPost.updateMany({ where: { coverImageMediaId: id }, data: { coverImageMediaId: null } });
    await tx.story.updateMany({ where: { coverImageMediaId: id }, data: { coverImageMediaId: null } });
    await tx.story.updateMany({ where: { videoMediaId: id }, data: { videoMediaId: null } });
    await tx.media.delete({ where: { id } });
  });

  await storage.delete(media.filePath).catch(() => undefined);
}

export async function deleteMediaFolder(params: { entityType: string; year: string; month: string }): Promise<void> {
  const { entityType, year, month, prefix } = normalizeMediaFolderPath(params.entityType, params.year, params.month);
  const folderPath = `${prefix}`;
  const records = await prisma.media.findMany({
    where: {
      entityType,
      filePath: { startsWith: folderPath },
    },
  });

  if (records.length > 0) {
    for (const record of records) {
      const usages = await checkMediaUsage(record.id);
      if (usages.length > 0) {
        throw ApiError.conflict(
          `پوشه ${folderPath} به دلیل استفاده‌ی فایل‌ها قابل حذف نیست. ابتدا فایل‌های در حال استفاده را حذف کنید.`
        );
      }
    }
  }

  const storage = getStorageProvider();
  for (const record of records) {
    await storage.delete(record.filePath);
    await prisma.media.delete({ where: { id: record.id } });
  }

  const absoluteFolderPath = path.join(storage.resolveRoot(), folderPath);
  await fs.promises.rm(absoluteFolderPath, { recursive: true, force: true }).catch(() => undefined);
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
  metadata: unknown;
  createdAt: Date;
}) {
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
    uploadedById: media.uploadedById,
    metadata: media.metadata,
    createdAt: media.createdAt,
  };
}
