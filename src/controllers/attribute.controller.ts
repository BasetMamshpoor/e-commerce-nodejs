import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramInt } from "../utils/params";
import * as attributeService from "../services/catalog/attribute.service";

export async function create(req: Request, res: Response) {
  const attribute = await attributeService.createAttribute(req.body);
  return ApiResponse.created(res, attribute, "ویژگی ایجاد شد");
}

export async function update(req: Request, res: Response) {
  const attribute = await attributeService.updateAttribute(paramInt(req.params.id), req.body);
  return ApiResponse.ok(res, attribute, "ویژگی به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await attributeService.deleteAttribute(paramInt(req.params.id));
  return ApiResponse.ok(res, null, "ویژگی حذف شد");
}

export async function list(req: Request, res: Response) {
  const categoryIdsParam = typeof req.query.categoryIds === "string" ? req.query.categoryIds : undefined;
  const categoryIds = categoryIdsParam
    ? categoryIdsParam.split(",").map(Number).filter((n) => Number.isFinite(n))
    : undefined;
  return ApiResponse.ok(res, await attributeService.listAttributes(categoryIds));
}

export async function getById(req: Request, res: Response) {
  return ApiResponse.ok(res, await attributeService.getAttributeById(paramInt(req.params.id)));
}

export async function addValue(req: Request, res: Response) {
  const value = await attributeService.addAttributeValue(paramInt(req.params.id), req.body);
  return ApiResponse.created(res, value, "مقدار ویژگی اضافه شد");
}

export async function updateValue(req: Request, res: Response) {
  const value = await attributeService.updateAttributeValue(paramInt(req.params.valueId), req.body);
  return ApiResponse.ok(res, value, "مقدار ویژگی به‌روزرسانی شد");
}

export async function removeValue(req: Request, res: Response) {
  await attributeService.deleteAttributeValue(paramInt(req.params.valueId));
  return ApiResponse.ok(res, null, "مقدار ویژگی حذف شد");
}
