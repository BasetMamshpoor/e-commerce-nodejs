import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { VariantInput } from "../../validations/product.validation";
import { recomputeProductAggregates } from "./product.service";
import { Prisma } from "../../generated/prisma";

function comboKey(attributeValueIds: number[]): string {
  return [...attributeValueIds].sort().join("|");
}

function extractIds(attributeValues: { attributeValueId: number }[]): number[] {
  return attributeValues.map((av) => av.attributeValueId);
}

async function assertSkuFree(sku: string, excludeVariantId?: number): Promise<void> {
  const existing = await prisma.productVariant.findUnique({ where: { sku } });
  if (existing && existing.id !== excludeVariantId) {
    throw ApiError.conflict("این SKU قبلاً استفاده شده است");
  }
}

async function assertComboFree(productId: number, attributeValueIds: number[], excludeVariantId?: number): Promise<void> {
  if (attributeValueIds.length === 0) return;

  const siblings = await prisma.productVariant.findMany({
    where: { productId, ...(excludeVariantId ? { NOT: { id: excludeVariantId } } : {}) },
    include: { attributeValues: true },
  });

  const targetKey = comboKey(attributeValueIds);
  const conflict = siblings.some(
    (s) => comboKey(s.attributeValues.map((a) => a.attributeValueId)) === targetKey
  );
  if (conflict) {
    throw ApiError.conflict("تنوعی با همین ترکیب ویژگی‌ها از قبل برای این محصول وجود دارد");
  }
}

async function assertProductExists(productId: number): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("محصول پیدا نشد");
}

export async function addVariant(productId: number, input: VariantInput) {
  await assertProductExists(productId);
  await assertSkuFree(input.sku);
  await assertComboFree(productId, extractIds(input.attributeValues));

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
      priceAdjustment: input.priceAdjustment,
      stock: input.stock,
      weight: input.weight,
      isDefault: input.isDefault,
      isActive: input.isActive,
      attributeValues: {
        create: input.attributeValues.map((av) => ({
          attributeValueId: av.attributeValueId,
          modifierType: av.modifierType ?? null,
          modifierValue: av.modifierValue ?? null,
        })),
      },
    },
  });

  await recomputeProductAggregates(productId);
  return variant;
}

export async function updateVariant(productId: number, variantId: number, input: Partial<VariantInput>) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.productId !== productId) {
    throw ApiError.notFound("تنوع کالا پیدا نشد");
  }

  if (input.sku && input.sku !== variant.sku) {
    await assertSkuFree(input.sku, variantId);
  }
  if (input.attributeValues) {
    await assertComboFree(productId, extractIds(input.attributeValues), variantId);
  }
  if (input.isDefault) {
    await prisma.productVariant.updateMany({
      where: { productId, NOT: { id: variantId } },
      data: { isDefault: false },
    });
  }

  const { attributeValues, ...scalarInput } = input;

  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...scalarInput,
      ...(attributeValues
        ? {
            attributeValues: {
              deleteMany: {},
              create: attributeValues.map((av) => ({
                attributeValueId: av.attributeValueId,
                modifierType: av.modifierType ?? null,
                modifierValue: av.modifierValue ?? null,
              })),
            },
          }
        : {}),
    },
  });

  await recomputeProductAggregates(productId);
  return updated;
}

export async function deleteVariant(productId: number, variantId: number): Promise<void> {
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
    throw ApiError.conflict("این تنوع در سفارش‌های قبلی استفاده شده و قابل حذف نیست؛ به‌جای حذف، آن را غیرفعال (isActive=false) کنید");
  }

  await prisma.productVariant.delete({ where: { id: variantId } });
  await recomputeProductAggregates(productId);
}
