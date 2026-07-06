import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { paramInt } from "../utils/params";
import * as productService from "../services/catalog/product.service";
import * as variantService from "../services/catalog/product-variant.service";
import * as queryService from "../services/catalog/product-query.service";

export async function create(req: Request, res: Response) {
  // ادغام تصاویر آپلودشده با تصاویر ارسالی در body
  const uploadedImages: Array<{ mediaId: number; url: string }> =
    (req as unknown as Record<string, unknown>).uploadedImages as Array<{ mediaId: number; url: string }> | undefined ?? [];

  if (uploadedImages.length > 0) {
    const existingImages: Array<{ mediaId: number; order: number; isMain: boolean }> = req.body.images ?? [];
    const hasMain = existingImages.some((img) => img.isMain);
    req.body.images = [
      ...existingImages,
      ...uploadedImages.map((img, i) => ({
        mediaId: img.mediaId,
        order: existingImages.length + i,
        isMain: !hasMain && i === 0,
      })),
    ];
  }

  const product = await productService.createProduct(req.body, req.user?.id);
  return ApiResponse.created(res, product, "محصول ایجاد شد");
}

export async function update(req: Request, res: Response) {
  const id = paramInt(req.params.id);

  // پردازش حذف تصاویر
  const deletedImages: number[] = Array.isArray(req.body.deletedImages)
    ? req.body.deletedImages.map((x: string | number) => Number(x)).filter((n: number) => n > 0)
    : [];
  if (deletedImages.length > 0) {
    await productService.deleteProductImages(id, deletedImages);
  }

  // پردازش تصاویر جدید آپلودشده (از multipart)
  const uploadedImages: Array<{ mediaId: number; url: string }> =
    (req as unknown as Record<string, unknown>).uploadedImages as Array<{ mediaId: number; url: string }> | undefined ?? [];

  // تصاویر ارسالی در body JSON (با mediaId از قبل آپلود شده)
  const bodyImages: Array<{ mediaId: number; order: number; isMain: boolean }> =
    Array.isArray(req.body.images) ? req.body.images : [];

  // حذف فیلدهای کمکی از body قبل از ارسال به سرویس
  const { deletedImages: _, images: __, ...cleanBody } = req.body;

  const product = await productService.updateProduct(id, cleanBody);

  // افزودن تصاویر جدید (از هر دو منبع)
  const allNewImages = [
    ...bodyImages,
    ...uploadedImages.map((img) => ({ mediaId: img.mediaId, order: 0, isMain: false })),
  ];

  if (allNewImages.length > 0) {
    const updatedProduct = await productService.addProductImages(id, allNewImages);
    return ApiResponse.ok(res, updatedProduct, "محصول به‌روزرسانی شد");
  }

  return ApiResponse.ok(res, product, "محصول به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await productService.deleteProduct(paramInt(req.params.id));
  return ApiResponse.ok(res, null, "محصول حذف شد");
}

export async function getBySlugPublic(req: Request, res: Response) {
  const product = await productService.getProductBySlugPublic(
    typeof req.params.slug === "string" ? req.params.slug : "",
    req.user?.id
  );
  return ApiResponse.ok(res, product);
}

export async function getByIdPublic(req: Request, res: Response) {
  const product = await productService.getProductByIdPublic(paramInt(req.params.id), req.user?.id);
  return ApiResponse.ok(res, product);
}

export async function getByIdAdmin(req: Request, res: Response) {
  const product = await productService.getProductByIdAdmin(paramInt(req.params.id));
  return ApiResponse.ok(res, product);
}

export async function listPublic(req: Request, res: Response) {
  const result = await queryService.listProductsStorefront(req.validatedQuery as never);
  return ApiResponse.ok(res, result);
}

export async function listAdmin(req: Request, res: Response) {
  const result = await queryService.listProductsAdmin(req.validatedQuery as never);
  return ApiResponse.ok(res, result);
}

export async function filters(req: Request, res: Response) {
  const categorySlug =
    typeof req.query.categorySlug === "string" ? req.query.categorySlug : undefined;
  const result = await queryService.getStorefrontFilters(categorySlug);
  return ApiResponse.ok(res, result);
}

// --- تنوع‌ها ---

export async function addVariant(req: Request, res: Response) {
  const variant = await variantService.addVariant(paramInt(req.params.id), req.body);
  return ApiResponse.created(res, variant, "تنوع کالا اضافه شد");
}

export async function updateVariant(req: Request, res: Response) {
  const variant = await variantService.updateVariant(
    paramInt(req.params.id),
    paramInt(req.params.variantId),
    req.body
  );
  return ApiResponse.ok(res, variant, "تنوع کالا به‌روزرسانی شد");
}

export async function removeVariant(req: Request, res: Response) {
  await variantService.deleteVariant(paramInt(req.params.id), paramInt(req.params.variantId));
  return ApiResponse.ok(res, null, "تنوع کالا حذف شد");
}


