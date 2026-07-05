import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramInt } from "../utils/params";
import * as categoryService from "../services/catalog/category.service";

export async function create(req: Request, res: Response) {
  const category = await categoryService.createCategory(req.body);
  return ApiResponse.created(res, category, "دسته‌بندی ایجاد شد");
}

export async function update(req: Request, res: Response) {
  const category = await categoryService.updateCategory(paramInt(req.params.id), req.body);
  return ApiResponse.ok(res, category, "دسته‌بندی به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await categoryService.deleteCategory(paramInt(req.params.id));
  return ApiResponse.ok(res, null, "دسته‌بندی حذف شد");
}

export async function getById(req: Request, res: Response) {
  const category = await categoryService.getCategoryById(paramInt(req.params.id));
  return ApiResponse.ok(res, category);
}

export async function getBySlug(req: Request, res: Response) {
  const category = await categoryService.getCategoryBySlug(typeof req.params.slug === "string" ? req.params.slug : "");
  return ApiResponse.ok(res, category);
}

export async function listFlat(req: Request, res: Response) {
  const includeInactive = req.query.includeInactive === "true";
  const categories = await categoryService.listCategoriesFlat(includeInactive);
  return ApiResponse.ok(res, categories);
}

export async function getTree(req: Request, res: Response) {
  const includeInactive = req.query.includeInactive === "true";
  const tree = await categoryService.getCategoryTree(includeInactive);
  return ApiResponse.ok(res, tree);
}

export async function attachAttribute(req: Request, res: Response) {
  const link = await categoryService.attachAttributeToCategory(
    paramInt(req.params.id),
    req.body.attributeId
  );
  return ApiResponse.created(res, link, "ویژگی به دسته‌بندی متصل شد");
}

export async function detachAttribute(req: Request, res: Response) {
  await categoryService.detachAttributeFromCategory(
    paramInt(req.params.id),
    paramInt(req.params.attributeId)
  );
  return ApiResponse.ok(res, null, "ویژگی از دسته‌بندی حذف شد");
}

export async function listAttributes(req: Request, res: Response) {
  const attributes = await categoryService.listCategoryAttributes(paramInt(req.params.id));
  return ApiResponse.ok(res, attributes);
}
