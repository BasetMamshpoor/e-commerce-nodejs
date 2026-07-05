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
  if (!req.file) throw ApiError.badRequest("فایلی ارسال نشده است");
  const entityType = (req.query.entityType as string) || "misc";
  const media = await mediaService.saveFileToMedia(req.file, entityType, req.user?.id);
  return ApiResponse.created(res, media, "فایل آپلود شد");
}

export async function uploadBulk(req: Request, res: Response) {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw ApiError.badRequest("فایلی ارسال نشده است");
  }
  const entityType = (req.query.entityType as string) || "misc";
  const items = await mediaService.saveFilesToMedia(req.files, entityType, req.user?.id);
  return ApiResponse.created(res, { items }, `${items.length} فایل آپلود شد`);
}

export async function list(req: Request, res: Response) {
  const { page, limit, type, entityType, search } = req.query as Record<string, string | undefined>;
  const result = await mediaService.listMedia({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    type,
    entityType,
    search,
  });
  return ApiResponse.ok(res, result);
}

export async function getById(req: Request, res: Response) {
  const media = await mediaService.getMediaById(paramInt(req.params.id));
  return ApiResponse.ok(res, mediaService.serializeMedia(media));
}

export async function getUsage(req: Request, res: Response) {
  const usages = await mediaService.checkMediaUsage(paramInt(req.params.id));
  return ApiResponse.ok(res, { usages });
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
