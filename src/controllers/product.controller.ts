import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import * as productService from "../services/catalog/product.service";
import * as variantService from "../services/catalog/product-variant.service";
import * as imageService from "../services/catalog/product-image.service";
import * as queryService from "../services/catalog/product-query.service";

export async function create(req: Request, res: Response) {
  const product = await productService.createProduct(req.body, req.user?.id);
  return ApiResponse.created(res, product, "محصول ایجاد شد");
}

export async function update(req: Request, res: Response) {
  const product = await productService.updateProduct(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, product, "محصول به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await productService.deleteProduct(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "محصول حذف شد");
}

export async function getBySlugPublic(req: Request, res: Response) {
  const product = await productService.getProductBySlugPublic(paramStr(req.params.slug));
  return ApiResponse.ok(res, product);
}

export async function getByIdAdmin(req: Request, res: Response) {
  const product = await productService.getProductByIdAdmin(paramStr(req.params.id));
  return ApiResponse.ok(res, product);
}

export async function listPublic(req: Request, res: Response) {
  const result = await queryService.listProductsStorefront(req.query as never);
  return ApiResponse.ok(res, result);
}

export async function listAdmin(req: Request, res: Response) {
  const result = await queryService.listProductsAdmin(req.query as never);
  return ApiResponse.ok(res, result);
}

export async function filters(req: Request, res: Response) {
  const categorySlug =
    typeof req.query.categorySlug === "string" ? req.query.categorySlug : undefined;
  const result = await queryService.getStorefrontFilters(categorySlug);
  return ApiResponse.ok(res, result);
}

export async function trackView(req: Request, res: Response) {
  await productService.trackProductView(paramStr(req.params.id), {
    userId: req.user?.id,
    ip: req.ip,
  });
  return ApiResponse.ok(res, null);
}

// --- تنوع‌ها ---

export async function addVariant(req: Request, res: Response) {
  const variant = await variantService.addVariant(paramStr(req.params.id), req.body);
  return ApiResponse.created(res, variant, "تنوع کالا اضافه شد");
}

export async function updateVariant(req: Request, res: Response) {
  const variant = await variantService.updateVariant(
    paramStr(req.params.id),
    paramStr(req.params.variantId),
    req.body
  );
  return ApiResponse.ok(res, variant, "تنوع کالا به‌روزرسانی شد");
}

export async function removeVariant(req: Request, res: Response) {
  await variantService.deleteVariant(paramStr(req.params.id), paramStr(req.params.variantId));
  return ApiResponse.ok(res, null, "تنوع کالا حذف شد");
}

export async function addVariantImage(req: Request, res: Response) {
  const image = await variantService.addVariantImage(paramStr(req.params.variantId), req.body);
  return ApiResponse.created(res, image, "تصویر تنوع اضافه شد");
}

export async function removeVariantImage(req: Request, res: Response) {
  await variantService.removeVariantImage(
    paramStr(req.params.variantId),
    paramStr(req.params.imageId)
  );
  return ApiResponse.ok(res, null, "تصویر تنوع حذف شد");
}

// --- تصاویر محصول ---

export async function addImage(req: Request, res: Response) {
  const image = await imageService.addProductImage(paramStr(req.params.id), req.body);
  return ApiResponse.created(res, image, "تصویر محصول اضافه شد");
}

export async function removeImage(req: Request, res: Response) {
  await imageService.removeProductImage(paramStr(req.params.id), paramStr(req.params.imageId));
  return ApiResponse.ok(res, null, "تصویر محصول حذف شد");
}
