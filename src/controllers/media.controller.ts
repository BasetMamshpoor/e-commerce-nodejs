import { Request, Response } from "express";
import path from "node:path";
import fs from "node:fs";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { paramInt } from "../utils/params";
import { env } from "../config/env";
import { getStorageProvider } from "../services/media/local-storage.provider";
import * as mediaService from "../services/media/media.service";

export async function upload(req: Request, res: Response) {
  const file = req.file ?? (req.body as Record<string, unknown>).file as Express.Multer.File | undefined;
  if (!file) throw ApiError.badRequest("فایلی ارسال نشده است");
  const entityType = (req.query.entityType as string) || "misc";
  const media = await mediaService.saveFileToMedia(file, entityType, req.user?.id);
  return ApiResponse.created(res, media, "فایل آپلود شد");
}

export async function uploadBulk(req: Request, res: Response) {
  const files = req.files ?? (req.body as Record<string, unknown>).files as Express.Multer.File[] | undefined;
  if (!files || !Array.isArray(files) || files.length === 0) {
    throw ApiError.badRequest("فایلی ارسال نشده است");
  }
  const entityType = (req.query.entityType as string) || "misc";
  const items = await mediaService.saveFilesToMedia(files, entityType, req.user?.id);
  return ApiResponse.created(res, { items }, `${items.length} فایل آپلود شد`);
}

export async function list(req: Request, res: Response) {
  const { page, limit, type, entityType, search, year, month } = req.query as Record<string, string | undefined>;
  const result = await mediaService.listMedia({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    type,
    entityType,
    search,
    year,
    month,
  });
  return ApiResponse.ok(res, result);
}

export async function listFolders(req: Request, res: Response) {
  const folders = await mediaService.listMediaFolders({
    entityType: (req.query.entityType as string | undefined) ?? (req.params.entityType as string | undefined),
    year: req.query.year as string | undefined,
    month: req.query.month as string | undefined,
  });
  return ApiResponse.ok(res, folders);
}

export async function getById(req: Request, res: Response) {
  const media = await mediaService.getMediaById(paramInt(req.params.id));
  return ApiResponse.ok(res, mediaService.serializeMedia(media));
}

export async function getUsage(req: Request, res: Response) {
  const usages = await mediaService.checkMediaUsage(paramInt(req.params.id));
  return ApiResponse.ok(res, { usages });
}

export async function update(req: Request, res: Response) {
  const mediaId = paramInt(req.params.id);
  const payload = req.body as Partial<{ originalName: string; entityType: string; metadata: Record<string, unknown> }>;
  const updatedMedia = await mediaService.updateMedia(mediaId, payload);
  return ApiResponse.ok(res, mediaService.serializeMedia(updatedMedia), "اطلاعات رسانه بروزرسانی شد");
}

export async function download(req: Request, res: Response) {
  const media = await mediaService.getMediaById(paramInt(req.params.id));
  const storage = getStorageProvider();
  const urlToFilePath = (storage as unknown as { urlToFilePath?: (url: string) => string }).urlToFilePath;
  const absolutePath = urlToFilePath
    ? urlToFilePath(media.url)
    : path.join(
        path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(process.cwd(), env.UPLOAD_DIR),
        media.filePath
      );

  if (!fs.existsSync(absolutePath)) {
    throw ApiError.notFound("فایل روی دیسک پیدا نشد");
  }

  res.setHeader("Content-Type", media.mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${media.originalName}"`);
  res.sendFile(absolutePath);
}

export async function remove(req: Request, res: Response) {
  await mediaService.deleteMedia(paramInt(req.params.id));
  return ApiResponse.ok(res, null, "فایل حذف شد");
}

export async function forceRemove(req: Request, res: Response) {
  await mediaService.forceDeleteMedia(paramInt(req.params.id));
  return ApiResponse.ok(res, null, "فایل با همه‌ی استفاده‌ها حذف شد");
}

export async function removeFolder(req: Request, res: Response) {
  const entityType = Array.isArray(req.params.entityType) ? req.params.entityType[0] : req.params.entityType;
  const year = Array.isArray(req.params.year) ? req.params.year[0] : req.params.year;
  const month = Array.isArray(req.params.month) ? req.params.month[0] : req.params.month;
  await mediaService.deleteMediaFolder({ entityType: entityType ?? "", year: year ?? "", month: month ?? "" });
  return ApiResponse.ok(res, null, `پوشه ${entityType}/${year}/${month} حذف شد`);
}
