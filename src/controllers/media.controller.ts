import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { paramStr } from "../utils/params";
import * as mediaService from "../services/media/media.service";

export async function uploadOne(req: Request, res: Response) {
  if (!req.file) throw ApiError.badRequest("فایلی ارسال نشده است");
  const media = await mediaService.createMediaRecord(
    req.file,
    req.user!.id,
    typeof req.body?.alt === "string" ? req.body.alt : undefined
  );
  return ApiResponse.created(res, media, "فایل با موفقیت آپلود شد");
}

export async function uploadMany(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw ApiError.badRequest("فایلی ارسال نشده است");
  const media = await mediaService.createMediaRecords(files, req.user!.id);
  return ApiResponse.created(res, media, "فایل‌ها با موفقیت آپلود شدند");
}

export async function list(req: Request, res: Response) {
  return ApiResponse.ok(res, await mediaService.listMedia(req.validatedQuery as never));
}

export async function getById(req: Request, res: Response) {
  return ApiResponse.ok(res, await mediaService.getMediaById(paramStr(req.params.id)));
}

export async function remove(req: Request, res: Response) {
  await mediaService.deleteMedia(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "فایل حذف شد");
}
