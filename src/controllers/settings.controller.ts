import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import * as settingsService from "../services/settings/settings.service";

export async function getPublic(_req: Request, res: Response) {
  return ApiResponse.ok(res, await settingsService.getPublicSettings());
}

export async function listAdmin(_req: Request, res: Response) {
  return ApiResponse.ok(res, await settingsService.listSettingsAdmin());
}

export async function upsert(req: Request, res: Response) {
  const setting = await settingsService.upsertSetting(paramStr(req.params.key), req.body);
  return ApiResponse.ok(res, setting, "تنظیمات ذخیره شد");
}

export async function remove(req: Request, res: Response) {
  await settingsService.deleteSetting(paramStr(req.params.key));
  return ApiResponse.ok(res, null, "تنظیمات حذف شد");
}
