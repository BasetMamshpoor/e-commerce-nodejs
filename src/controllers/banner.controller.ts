import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import * as bannerService from "../services/cms/banner.service";
import { BannerPosition } from "../generated/prisma";

export async function create(req: Request, res: Response) {
  return ApiResponse.created(res, await bannerService.createBanner(req.body), "بنر ایجاد شد");
}

export async function update(req: Request, res: Response) {
  const banner = await bannerService.updateBanner(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, banner, "بنر به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await bannerService.deleteBanner(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "بنر حذف شد");
}

export async function listAdmin(_req: Request, res: Response) {
  return ApiResponse.ok(res, await bannerService.listBannersAdmin());
}

export async function listActive(req: Request, res: Response) {
  const position =
    typeof req.query.position === "string" ? (req.query.position as BannerPosition) : undefined;
  return ApiResponse.ok(res, await bannerService.listActiveBanners(position));
}
