import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import { serializeProduct, ProductLike } from "../../utils/serialize";
import {
  CreateProductInput,
  UpdateProductInput,
  VariantInput,
} from "../../validations/product.validation";
import { Product } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// محصولات متغیر (Variants) — آیتم ۲
// ----------------------------------------------------------------------------

async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.product.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== excludeId);
}

/** دقیقاً یک تنوع را isDefault=true می‌کند (اولین موردی که علامت خورده، یا اولین موجود) */
function normalizeDefaultFlag(variants: VariantInput[]): VariantInput[] {
  const defaultIndex = variants.findIndex((v) => v.isDefault);
  return variants.map((v, idx) => ({
    ...v,
    isDefault: defaultIndex === -1 ? idx === 0 : idx === defaultIndex,
  }));
}

function comboKey(attributeValueIds: string[]): string {
  return [...attributeValueIds].sort().join("|");
}

async function validateVariantsInput(
  variants: VariantInput[],
  opts: { productId?: string } = {}
): Promise<void> {
  // یکتایی SKU درون همین درخواست
  const skus = variants.map((v) => v.sku);
  if (new Set(skus).size !== skus.length) {
    throw ApiError.badRequest("SKU تنوع‌ها باید یکتا باشند");
  }

  // یکتایی SKU در کل دیتابیس (به‌جز خودِ تنوعی که در همین محصول ویرایش می‌شود)
  const existingSkus = await prisma.productVariant.findMany({
    where: { sku: { in: skus }, ...(opts.productId ? { NOT: { productId: opts.productId } } : {}) },
    select: { sku: true },
  });
  if (existingSkus.length > 0) {
    throw ApiError.conflict(
      `این SKU ها قبلاً استفاده شده‌اند: ${existingSkus.map((s) => s.sku).join(", ")}`
    );
  }

  // یکتایی ترکیب ویژگی‌ها درون همین درخواست (مثلاً دو تنوع «قرمز-L» نباید وجود داشته باشد)
  const combos = variants.map((v) => comboKey(v.attributeValueIds));
  if (new Set(combos).size !== combos.length) {
    throw ApiError.badRequest("دو تنوع کالا نمی‌توانند ترکیب یکسانی از ویژگی‌ها داشته باشند");
  }
}

/**
 * minPrice/maxPrice/isInStock/hasActiveDiscount را از روی تنوع‌های فعلی محصول
 * در دیتابیس دوباره می‌سازد. این تابع را بعد از هر create/update/delete
 * variant باید فراخوانی کرد.
 *
 * نکته: تخفیف‌های زمان‌دار (discountStartAt/discountEndAt) فقط در همین لحظه
 * بررسی می‌شوند؛ اگر تخفیفی «در آینده» تعریف شده باشد، hasActiveDiscount با
 * شروع‌شدن خودکار آن به‌روز نمی‌شود مگر این‌که variant دوباره ذخیره شود یا یک
 * job زمان‌بندی‌شده (cron) این تابع را دوره‌ای صدا بزند.
 */
export async function recomputeProductAggregates(productId: string): Promise<void> {
  const variants = await prisma.productVariant.findMany({
    where: { productId, isActive: true },
  });

  if (variants.length === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { minPrice: 0, maxPrice: 0, isInStock: false, hasActiveDiscount: false },
    });
    return;
  }

  const now = new Date();
  const prices = variants.map((v) => v.price);
  const isInStock = variants.some((v) => v.stock > 0);
  const hasActiveDiscount = variants.some(
    (v) =>
      v.discountType &&
      v.discountValue &&
      (!v.discountStartAt || v.discountStartAt <= now) &&
      (!v.discountEndAt || v.discountEndAt >= now)
  );

  await prisma.product.update({
    where: { id: productId },
    data: {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      isInStock,
      hasActiveDiscount,
    },
  });
}

// ----------------------------------------------------------------------------
// CRUD محصول
// ----------------------------------------------------------------------------

export async function createProduct(
  input: CreateProductInput,
  createdById?: string
): Promise<Product> {
  const categoryCount = await prisma.category.count({ where: { id: { in: input.categoryIds } } });
  if (categoryCount !== input.categoryIds.length) {
    throw ApiError.badRequest("یک یا چند دسته‌بندی انتخاب‌شده معتبر نیست");
  }

  if (input.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
    if (!brand) throw ApiError.badRequest("برند انتخاب‌شده معتبر نیست");
  }

  await validateVariantsInput(input.variants);
  const variants = normalizeDefaultFlag(input.variants);

  const slug = input.slug
    ? slugify(input.slug)
    : await ensureUniqueSlug(input.name, (c) => isSlugTaken(c));
  if (input.slug && (await isSlugTaken(slug))) {
    throw ApiError.conflict("این slug قبلاً استفاده شده است");
  }

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      brandId: input.brandId,
      shortDescription: input.shortDescription,
      description: input.description,
      status: input.status,
      isFeatured: input.isFeatured,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
      createdById,
      categories: {
        create: input.categoryIds.map((categoryId) => ({ categoryId })),
      },
      images: {
        create: input.images.map((img) => ({
          mediaId: img.mediaId,
          order: img.order,
          isMain: img.isMain,
        })),
      },
      variants: {
        create: variants.map((v) => ({
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          discountType: v.discountType,
          discountValue: v.discountValue,
          discountStartAt: v.discountStartAt,
          discountEndAt: v.discountEndAt,
          stock: v.stock,
          weight: v.weight,
          isDefault: v.isDefault,
          isActive: v.isActive,
          attributeValues: {
            create: v.attributeValueIds.map((attributeValueId) => ({ attributeValueId })),
          },
        })),
      },
    },
  });

  await recomputeProductAggregates(product.id);
  return prisma.product.findUniqueOrThrow({ where: { id: product.id } });
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound("محصول پیدا نشد");

  if (input.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
    if (!brand) throw ApiError.badRequest("برند انتخاب‌شده معتبر نیست");
  }

  let slug: string | undefined;
  if (input.slug) {
    slug = slugify(input.slug);
    if (await isSlugTaken(slug, id)) {
      throw ApiError.conflict("این slug قبلاً استفاده شده است");
    }
  }

  if (input.categoryIds) {
    const categoryCount = await prisma.category.count({
      where: { id: { in: input.categoryIds } },
    });
    if (categoryCount !== input.categoryIds.length) {
      throw ApiError.badRequest("یک یا چند دسته‌بندی انتخاب‌شده معتبر نیست");
    }
  }

  const { categoryIds, ...rest } = input;

  return prisma.product.update({
    where: { id },
    data: {
      ...rest,
      slug,
      ...(categoryIds
        ? { categories: { deleteMany: {}, create: categoryIds.map((categoryId) => ({ categoryId })) } }
        : {}),
    },
  });
}

export async function deleteProduct(id: string): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound("محصول پیدا نشد");

  const orderedCount = await prisma.orderItem.count({
    where: { variant: { productId: id } },
  });
  if (orderedCount > 0) {
    throw ApiError.conflict(
      "این محصول در سفارش‌های قبلی استفاده شده و قابل حذف کامل نیست؛ به‌جای حذف، وضعیتش را ARCHIVED کنید"
    );
  }

  await prisma.product.delete({ where: { id } });
}

const PRODUCT_DETAIL_INCLUDE = {
  brand: { include: { logo: true } },
  images: { include: { media: true }, orderBy: { order: "asc" as const } },
  categories: { include: { category: { include: { image: true } } } },
  variants: {
    include: {
      images: { include: { media: true }, orderBy: { order: "asc" as const } },
      attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
    },
  },
};

export async function getProductBySlugPublic(slug: string) {
  const product = (await prisma.product.findUnique({
    where: { slug },
    include: PRODUCT_DETAIL_INCLUDE,
  })) as unknown as (Product & ProductLike) | null;
  if (!product || product.status !== "PUBLISHED") {
    throw ApiError.notFound("محصول پیدا نشد");
  }
  return serializeProduct(product);
}

export async function getProductByIdAdmin(id: string) {
  const product = (await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_DETAIL_INCLUDE,
  })) as unknown as (Product & ProductLike) | null;
  if (!product) throw ApiError.notFound("محصول پیدا نشد");
  return serializeProduct(product);
}

// ----------------------------------------------------------------------------
// بازدید محصول (برای آیتم ۱۶ — نمودارهای آنالیزی)
// ----------------------------------------------------------------------------

export async function trackProductView(
  productId: string,
  meta: { userId?: string; ip?: string }
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.productView.create({ data: { productId, userId: meta.userId, ip: meta.ip } });
    await tx.product.update({ where: { id: productId }, data: { viewCount: { increment: 1 } } });
  });
}
