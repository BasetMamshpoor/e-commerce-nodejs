import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import * as popupService from "../services/cms/popup.service";

export async function create(req: Request, res: Response) {
  return ApiResponse.created(res, await popupService.createPopup(req.body), "پاپ‌آپ ایجاد شد");
}

export async function update(req: Request, res: Response) {
  const popup = await popupService.updatePopup(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, popup, "پاپ‌آپ به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await popupService.deletePopup(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "پاپ‌آپ حذف شد");
}

export async function listAdmin(_req: Request, res: Response) {
  return ApiResponse.ok(res, await popupService.listPopupsAdmin());
}

export async function listActive(_req: Request, res: Response) {
  return ApiResponse.ok(res, await popupService.listActivePopups());
}
