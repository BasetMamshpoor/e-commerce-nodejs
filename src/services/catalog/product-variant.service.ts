import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { VariantInput } from "../../validations/product.validation";
import { recomputeProductAggregates } from "./product.service";
import { ProductVariant } from "../../generated/prisma";

function comboKey(attributeValueIds: string[]): string {
  return [...attributeValueIds].sort().join("|");
}

async function assertSkuFree(sku: string, excludeVariantId?: string): Promise<void> {
  const existing = await prisma.productVariant.findUnique({ where: { sku } });
  if (existing && existing.id !== excludeVariantId) {
    throw ApiError.conflict("این SKU قبلاً استفاده شده است");
  }
}

async function assertComboFree(
  productId: string,
  attributeValueIds: string[],
  excludeVariantId?: string
): Promise<void> {
  if (attributeValueIds.length === 0) return;

  const siblings = (await prisma.productVariant.findMany({
    where: { productId, ...(excludeVariantId ? { NOT: { id: excludeVariantId } } : {}) },
    include: { attributeValues: true },
  })) as (ProductVariant & { attributeValues: { attributeValueId: string }[] })[];

  const targetKey = comboKey(attributeValueIds);
  const conflict = siblings.some(
    (s) => comboKey(s.attributeValues.map((a) => a.attributeValueId)) === targetKey
  );
  if (conflict) {
    throw ApiError.conflict("تنوعی با همین ترکیب ویژگی‌ها از قبل برای این محصول وجود دارد");
  }
}

async function assertProductExists(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("محصول پیدا نشد");
}

export async function addVariant(
  productId: string,
  input: VariantInput
): Promise<ProductVariant> {
  await assertProductExists(productId);
  await assertSkuFree(input.sku);
  await assertComboFree(productId, input.attributeValueIds);

  if (input.isDefault) {
    await prisma.productVariant.updateMany({
      where: { productId },
      data: { isDefault: false },
    });
  }

  const variant = await prisma.productVariant.create({
    data: {
      productId,
      sku: input.sku,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      discountType: input.discountType,
      discountValue: input.discountValue,
      discountStartAt: input.discountStartAt,
      discountEndAt: input.discountEndAt,
      stock: input.stock,
      weight: input.weight,
      isDefault: input.isDefault,
      isActive: input.isActive,
      attributeValues: {
        create: input.attributeValueIds.map((attributeValueId) => ({ attributeValueId })),
      },
    },
  });

  await recomputeProductAggregates(productId);
  return variant;
}

export async function updateVariant(
  productId: string,
  variantId: string,
  input: Partial<VariantInput>
): Promise<ProductVariant> {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.productId !== productId) {
    throw ApiError.notFound("تنوع کالا پیدا نشد");
  }

  if (input.sku && input.sku !== variant.sku) {
    await assertSkuFree(input.sku, variantId);
  }
  if (input.attributeValueIds) {
    await assertComboFree(productId, input.attributeValueIds, variantId);
  }
  if (input.isDefault) {
    await prisma.productVariant.updateMany({
      where: { productId, NOT: { id: variantId } },
      data: { isDefault: false },
    });
  }

  const { attributeValueIds, ...scalarInput } = input;

  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...scalarInput,
      ...(attributeValueIds
        ? {
            attributeValues: {
              deleteMany: {},
              create: attributeValueIds.map((attributeValueId) => ({ attributeValueId })),
            },
          }
        : {}),
    },
  });

  await recomputeProductAggregates(productId);
  return updated;
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.productId !== productId) {
    throw ApiError.notFound("تنوع کالا پیدا نشد");
  }

  const variantCount = await prisma.productVariant.count({ where: { productId } });
  if (variantCount <= 1) {
    throw ApiError.conflict("محصول باید حداقل یک تنوع داشته باشد؛ به‌جای حذف، آن را غیرفعال کنید");
  }

  const orderedCount = await prisma.orderItem.count({ where: { variantId } });
  if (orderedCount > 0) {
    throw ApiError.conflict(
      "این تنوع در سفارش‌های قبلی استفاده شده و قابل حذف نیست؛ به‌جای حذف، آن را غیرفعال (isActive=false) کنید"
    );
  }

  await prisma.productVariant.delete({ where: { id: variantId } });
  await recomputeProductAggregates(productId);
}

// ----------------------------------------------------------------------------
// تصاویر مخصوص هر تنوع
// ----------------------------------------------------------------------------

export async function addVariantImage(
  variantId: string,
  input: { mediaId: string; order?: number }
) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw ApiError.notFound("تنوع کالا پیدا نشد");

  return prisma.productVariantImage.create({
    data: { variantId, mediaId: input.mediaId, order: input.order ?? 0 },
  });
}

export async function removeVariantImage(variantId: string, imageId: string): Promise<void> {
  const image = await prisma.productVariantImage.findUnique({ where: { id: imageId } });
  if (!image || image.variantId !== variantId) {
    throw ApiError.notFound("تصویر پیدا نشد");
  }
  await prisma.productVariantImage.delete({ where: { id: imageId } });
}
