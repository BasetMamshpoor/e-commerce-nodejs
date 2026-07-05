import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import { serializeProduct, ProductLike } from "../../utils/serialize";
import { CreateProductInput, UpdateProductInput, VariantInput } from "../../validations/product.validation";
import { Prisma } from "../../generated/prisma";

async function isSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const existing = await prisma.product.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== excludeId);
}

function normalizeDefaultFlag(variants: VariantInput[]): VariantInput[] {
  const defaultIndex = variants.findIndex((v) => v.isDefault);
  return variants.map((v, idx) => ({
    ...v,
    isDefault: defaultIndex === -1 ? idx === 0 : idx === defaultIndex,
  }));
}

function comboKey(attributeValueIds: number[]): string {
  return [...attributeValueIds].sort().join("|");
}

async function validateVariantsInput(variants: VariantInput[], opts: { productId?: number } = {}): Promise<void> {
  const skus = variants.map((v) => v.sku);
  if (new Set(skus).size !== skus.length) {
    throw ApiError.badRequest("SKU تنوع‌ها باید یکتا باشند");
  }

  const existingSkus = await prisma.productVariant.findMany({
    where: { sku: { in: skus }, ...(opts.productId ? { NOT: { productId: opts.productId } } : {}) },
    select: { sku: true },
  });
  if (existingSkus.length > 0) {
    throw ApiError.conflict(`این SKU ها قبلاً استفاده شده‌اند: ${existingSkus.map((s) => s.sku).join(", ")}`);
  }

  const combos = variants.map((v) => comboKey(v.attributeValueIds));
  if (new Set(combos).size !== combos.length) {
    throw ApiError.badRequest("دو تنوع کالا نمی‌توانند ترکیب یکسانی از ویژگی‌ها داشته باشند");
  }
}

export async function recomputeProductAggregates(productId: number): Promise<void> {
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

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { basePrice: true } });
  if (!product) return;

  const prices = variants.map((v) => product.basePrice + v.priceAdjustment);
  const isInStock = variants.some((v) => v.stock > 0);

  await prisma.product.update({
    where: { id: productId },
    data: {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      isInStock,
      hasActiveDiscount: false,
    },
  });
}

export async function createProduct(input: CreateProductInput, createdById?: number) {
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
      basePrice: input.basePrice,
      discountType: input.discountType,
      discountValue: input.discountValue,
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
          priceAdjustment: v.priceAdjustment,
          stock: v.stock,
          weight: v.weight,
          isDefault: v.isDefault,
          isActive: v.isActive,
          attributeValues: {
            create: v.attributeValueIds.map((attributeValueId) => ({ attributeValueId })),
          },
        })),
      },
      displayAttributeValues: input.displayAttributes ? {
        create: input.displayAttributes.map((da) => ({
          attributeId: da.attributeId,
          value: da.value,
        })),
      } : undefined,
    },
  });

  await recomputeProductAggregates(product.id);
  return getProductById(product.id);
}

export async function updateProduct(id: number, input: UpdateProductInput) {
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

export async function deleteProduct(id: number): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) throw ApiError.notFound("محصول پیدا نشد");

  const orderedCount = await prisma.orderItem.count({
    where: { variant: { productId: id } },
  });
  if (orderedCount > 0) {
    throw ApiError.conflict("این محصول در سفارش‌های قبلی استفاده شده و قابل حذف کامل نیست؛ به‌جای حذف، وضعیتش را ARCHIVED کنید");
  }

  await prisma.product.delete({ where: { id } });
}

const PRODUCT_DETAIL_INCLUDE = {
  brand: true,
  images: { orderBy: { order: "asc" as const }, include: { media: true } },
  categories: { include: { category: true } },
  variants: {
    include: {
      attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
    },
  },
  displayAttributeValues: { include: { attribute: true } },
} satisfies Prisma.ProductInclude;

export async function getProductBySlugPublic(slug: string, userId?: number) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: PRODUCT_DETAIL_INCLUDE,
  }) as unknown as (Record<string, unknown> & ProductLike) | null;

  if (!product || product.status !== "PUBLISHED") {
    throw ApiError.notFound("محصول پیدا نشد");
  }

  const serialized = serializeProduct(product) as Record<string, unknown>;

  await trackProductView(product.id as number, { userId, ip: undefined });

  if (userId) {
    const wishlistItem = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId: product.id as number } },
    });
    serialized.isWish = !!wishlistItem;
  } else {
    serialized.isWish = false;
  }

  const [relatedProducts, alsoBoughtProducts, relatedBlogPosts] = await Promise.all([
    getRelatedProducts(product.id as number),
    getAlsoBoughtProducts(product.id as number),
    getRelatedBlogPosts(product.id as number),
  ]);

  serialized.relatedProducts = relatedProducts;
  serialized.alsoBoughtProducts = alsoBoughtProducts;
  serialized.relatedBlogPosts = relatedBlogPosts;

  return serialized;
}

export async function getProductById(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_DETAIL_INCLUDE,
  }) as unknown as (Record<string, unknown> & ProductLike) | null;

  if (!product) throw ApiError.notFound("محصول پیدا نشد");
  return serializeProduct(product);
}

export async function getProductByIdPublic(id: number, userId?: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_DETAIL_INCLUDE,
  }) as unknown as (Record<string, unknown> & ProductLike) | null;

  if (!product || product.status !== "PUBLISHED") {
    throw ApiError.notFound("محصول پیدا نشد");
  }

  const serialized = serializeProduct(product) as Record<string, unknown>;

  await trackProductView(id, { userId, ip: undefined });

  if (userId) {
    const wishlistItem = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId: id } },
    });
    serialized.isWish = !!wishlistItem;
  } else {
    serialized.isWish = false;
  }

  return serialized;
}

export async function getProductByIdAdmin(id: number) {
  return getProductById(id);
}

export async function recomputeProductRating(productId: number): Promise<void> {
  const agg = await prisma.comment.aggregate({
    where: { commentableType: "PRODUCT", commentableId: productId, status: "APPROVED", rating: { not: null } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count?.rating ?? 0,
    },
  });
}

export async function trackProductView(productId: number, meta: { userId?: number; ip?: string }): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.productView.create({ data: { productId, userId: meta.userId, ip: meta.ip } });
    await tx.product.update({ where: { id: productId }, data: { viewCount: { increment: 1 } } });
  });
}

export async function getRelatedProducts(productId: number) {
  const links = await prisma.productRelated.findMany({
    where: { productId },
    include: {
      related: { include: { brand: true, images: { where: { isMain: true }, take: 1, include: { media: true } } } },
    },
    take: 10,
  });
  return links.map((l) => l.related);
}

export async function getAlsoBoughtProducts(productId: number) {
  const links = await prisma.productAlsoBought.findMany({
    where: { productId },
    include: {
      alsoBought: { include: { brand: true, images: { where: { isMain: true }, take: 1, include: { media: true } } } },
    },
    take: 10,
  });
  return links.map((l) => l.alsoBought);
}

export async function getRelatedBlogPosts(productId: number) {
  const links = await prisma.blogPostProduct.findMany({
    where: { productId },
    include: {
      blogPost: { select: { id: true, title: true, slug: true, excerpt: true, coverImageMediaId: true, publishedAt: true } },
    },
    take: 5,
  });
  return links.map((l) => l.blogPost);
}

/**
 * حذف تصاویر محصول — فقط رابطه ProductImage حذف می‌شود، فایل و رکورد Media باقی می‌مانند
 */
export async function deleteProductImages(productId: number, imageIds: number[]): Promise<void> {
  // اطمینان از اینکه تصاویر متعلق به همین محصول هستند
  const count = await prisma.productImage.count({
    where: { id: { in: imageIds }, productId },
  });
  if (count !== imageIds.length) {
    throw ApiError.badRequest("یک یا چند تصویر انتخاب‌شده معتبر نیست");
  }
  await prisma.productImage.deleteMany({
    where: { id: { in: imageIds }, productId },
  });
}

/**
 * افزودن تصاویر جدید به محصول — هر تصویر یک رکورد ProductImage می‌سازد
 */
export async function addProductImages(
  productId: number,
  images: Array<{ mediaId: number; order: number; isMain: boolean }>
) {
  // اگر تصویر جدیدی isMain=true دارد، isMain سایر تصاویر را false کن
  const hasNewMain = images.some((img) => img.isMain);
  if (hasNewMain) {
    await prisma.productImage.updateMany({
      where: { productId, isMain: true },
      data: { isMain: false },
    });
  }

  // اگر هیچکدام isMain نیستند، اولین تصویر را به‌عنوان اصلی قرار بده
  const imagesToCreate = images.map((img, idx) => ({
    ...img,
    isMain: hasNewMain ? img.isMain : idx === 0,
  }));

  await prisma.productImage.createMany({
    data: imagesToCreate.map((img) => ({ ...img, productId })),
  });

  return prisma.product.findUnique({
    where: { id: productId },
    include: PRODUCT_DETAIL_INCLUDE,
  });
}

export async function setRelatedProducts(productId: number, relatedIds: number[]) {
  await prisma.productRelated.deleteMany({ where: { productId } });
  if (relatedIds.length > 0) {
    await prisma.productRelated.createMany({
      data: relatedIds.map((relatedId) => ({ productId, relatedId })),
      skipDuplicates: true,
    });
  }
}

export async function setAlsoBoughtProducts(productId: number, alsoBoughtIds: number[]) {
  await prisma.productAlsoBought.deleteMany({ where: { productId } });
  if (alsoBoughtIds.length > 0) {
    await prisma.productAlsoBought.createMany({
      data: alsoBoughtIds.map((alsoBoughtId) => ({ productId, alsoBoughtId })),
      skipDuplicates: true,
    });
  }
}
