import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import * as brandService from "../services/catalog/brand.service";

export async function create(req: Request, res: Response) {
  const brand = await brandService.createBrand(req.body);
  return ApiResponse.created(res, brand, "برند ایجاد شد");
}

export async function update(req: Request, res: Response) {
  const brand = await brandService.updateBrand(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, brand, "برند به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await brandService.deleteBrand(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "برند حذف شد");
}

export async function getById(req: Request, res: Response) {
  return ApiResponse.ok(res, await brandService.getBrandById(paramStr(req.params.id)));
}

export async function getBySlug(req: Request, res: Response) {
  return ApiResponse.ok(res, await brandService.getBrandBySlug(paramStr(req.params.slug)));
}

export async function list(req: Request, res: Response) {
  const includeInactive = req.query.includeInactive === "true";
  return ApiResponse.ok(res, await brandService.listBrands(includeInactive));
}
