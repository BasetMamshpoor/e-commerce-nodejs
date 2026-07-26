import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import { serializeProduct, ProductLike } from "../../utils/serialize";
import { CreateProductInput, UpdateProductInput, VariantInput } from "../../validations/product.validation";
import { Prisma, PricingMode, ModifierType } from "../../generated/prisma";
import { calculateFinalPrice, calculateVariantPrice } from "../pricingEngine";
import { buildComboKey } from "../../utils/variantCombo";

function extractIds(values: { attributeValueId: number }[]): number[] {
  return values.map((v) => v.attributeValueId);
}

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

  const combos = variants.map((v) => buildComboKey(extractIds(v.attributeValues)));
  if (new Set(combos).size !== combos.length) {
    throw ApiError.badRequest("دو تنوع کالا نمی‌توانند ترکیب یکسانی از ویژگی‌ها داشته باشند");
  }
}

async function validatePricingModeConstraints(
  pricingMode: PricingMode,
  basePrice: number,
  currencyId: number | undefined | null,
  sourcePrice: number | undefined | null,
  variantAttributeValues: { attributeValueId: number; modifierType?: string | null; modifierValue?: number | null }[][]
): Promise<void> {
  if (pricingMode === "CURRENCY_BASED") {
    if (!currencyId) {
      throw ApiError.badRequest("برای محصولات با قیمت‌گذاری ارزی، currencyId الزامی است");
    }
    if (!sourcePrice && sourcePrice !== 0) {
      throw ApiError.badRequest("برای محصولات با قیمت‌گذاری ارزی، sourcePrice الزامی است");
    }
    const currency = await prisma.currency.findUnique({ where: { id: currencyId } });
    if (!currency || !currency.isActive) {
      throw ApiError.badRequest("ارز انتخاب‌شده معتبر نیست یا غیرفعال است");
    }
  }

  if (pricingMode === "FIXED_IRT") {
    if (!basePrice && basePrice !== 0) {
      throw ApiError.badRequest("برای محصولات با قیمت‌گذاری ثابت تومان، basePrice الزامی است");
    }

    for (const attrVals of variantAttributeValues) {
      for (const av of attrVals) {
        if (av.modifierType === "FIXED_SOURCE_CURRENCY") {
          throw ApiError.badRequest(
            `محصولات FIXED_IRT نمی‌توانند از modifierType «${av.modifierType}» استفاده کنند`
          );
        }
      }
    }
  }
}

export async function recomputeProductAggregates(productId: number): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      basePrice: true, pricingMode: true, currentPriceIRT: true, sourcePrice: true,
      priceBufferPercent: true, currencyId: true,
      currency: { select: { currentRate: true } },
    },
  });
  if (!product) return;

  const variants = await prisma.productVariant.findMany({
    where: { productId, isActive: true },
    include: { attributeValues: { select: { modifierType: true, modifierValue: true } } },
  });

  if (variants.length === 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { minPrice: 0, maxPrice: 0, isInStock: false, hasActiveDiscount: false },
    });
    return;
  }

  // قیمت واقعی هر تنوع را با درنظرگرفتن هم priceAdjustment و هم
  // modifierValue های ویژگی‌های همان تنوع محاسبه می‌کنیم — نه فقط
  // priceAdjustment (که باعث می‌شد تنوع‌های با مدیفایر ویژگی، در بازه‌ی
  // قیمتی محصول (minPrice/maxPrice) اصلاً دیده نشوند).
  const prices = variants.map((v) =>
    calculateVariantPrice(
      {
        pricingMode: product.pricingMode,
        basePrice: product.basePrice,
        sourcePrice: product.sourcePrice,
        priceBufferPercent: product.priceBufferPercent,
      },
      product.currency,
      {
        priceAdjustment: v.priceAdjustment,
        attributeValues: v.attributeValues,
      }
    ).finalPriceIRT
  );
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

async function computeInitialCurrentPriceIRT(
  pricingMode: PricingMode,
  basePrice: number,
  sourcePrice: number | null,
  priceBufferPercent: number | null,
  currency: { currentRate: number | null } | null,
  modifiers: { modifierType: ModifierType | null; modifierValue: number | null }[]
): Promise<number> {
  if (pricingMode === "FIXED_IRT") {
    return basePrice;
  }

  const result = calculateFinalPrice(
    {
      pricingMode,
      basePrice,
      sourcePrice: sourcePrice ?? null,
      priceBufferPercent: priceBufferPercent ?? null,
    },
    currency,
    modifiers
  );

  return result.finalPriceIRT;
}

function buildModifiersFromInput(attributeValues: { modifierType?: string | null; modifierValue?: number | null }[]): { modifierType: ModifierType | null; modifierValue: number | null }[] {
  return attributeValues.map((av) => ({
    modifierType: (av.modifierType as ModifierType) ?? null,
    modifierValue: av.modifierValue ?? null,
  }));
}

async function fetchDefaultVariantModifiers(productId: number): Promise<{ modifierType: ModifierType | null; modifierValue: number | null }[]> {
  const defaultVariant = await prisma.productVariant.findFirst({
    where: { productId, isDefault: true },
    include: {
      attributeValues: {
        select: { modifierType: true, modifierValue: true },
      },
    },
  });
  if (!defaultVariant) return [];
  return defaultVariant.attributeValues.map((av) => ({
    modifierType: av.modifierType,
    modifierValue: av.modifierValue,
  }));
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

  const allAttrValues = variants.map((v) => v.attributeValues);
  const pricingMode = (input.pricingMode as PricingMode) ?? "FIXED_IRT";
  await validatePricingModeConstraints(
    pricingMode,
    input.basePrice,
    input.currencyId,
    input.sourcePrice,
    allAttrValues
  );

  const slug = input.slug
    ? slugify(input.slug)
    : await ensureUniqueSlug(input.name, (c) => isSlugTaken(c));
  if (input.slug && (await isSlugTaken(slug))) {
    throw ApiError.conflict("این slug قبلاً استفاده شده است");
  }

  const currency = input.currencyId
    ? await prisma.currency.findUnique({ where: { id: input.currencyId }, select: { currentRate: true } })
    : null;

  const defaultModifiers = variants[0] ? buildModifiersFromInput(variants[0].attributeValues) : [];

  const currentPriceIRT = await computeInitialCurrentPriceIRT(
    pricingMode,
    input.basePrice,
    input.sourcePrice ?? null,
    input.priceBufferPercent ?? null,
    currency,
    defaultModifiers
  );

  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      brandId: input.brandId,
      shortDescription: input.shortDescription,
      description: input.description,
      basePrice: input.basePrice,
      pricingMode,
      currencyId: input.currencyId ?? null,
      sourcePrice: input.sourcePrice ?? null,
      priceBufferPercent: input.priceBufferPercent ?? null,
      currentPriceIRT,
      priceUpdatedAt: new Date(),
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
          comboKey: buildComboKey(v.attributeValues.map((av) => av.attributeValueId)),
          attributeValues: {
            create: v.attributeValues.map((av) => ({
              attributeValueId: av.attributeValueId,
              modifierType: av.modifierType ?? null,
              modifierValue: av.modifierValue ?? null,
            })),
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
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        where: { isDefault: true },
        include: { attributeValues: true },
      },
    },
  });
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

  const pricingMode = (input.pricingMode as PricingMode | undefined) ?? product.pricingMode;
  const basePrice = input.basePrice ?? product.basePrice;
  const currencyId = input.currencyId !== undefined ? input.currencyId : (product.currencyId as number | null | undefined);
  const sourcePrice = input.sourcePrice !== undefined ? input.sourcePrice : (product.sourcePrice as number | null | undefined);

  const defaultVariantAttrValues = product.variants[0]?.attributeValues ?? [];

  if (input.pricingMode || input.currencyId !== undefined || input.sourcePrice !== undefined) {
    await validatePricingModeConstraints(
      pricingMode as PricingMode,
      basePrice,
      currencyId,
      sourcePrice,
      [defaultVariantAttrValues.map((av) => ({
        attributeValueId: av.attributeValueId,
        modifierType: av.modifierType,
        modifierValue: av.modifierValue,
      }))]
    );
  }

  let currentPriceIRT: number | undefined;
  if (
    input.pricingMode ||
    input.currencyId !== undefined ||
    input.sourcePrice !== undefined ||
    input.basePrice !== undefined ||
    input.priceBufferPercent !== undefined
  ) {
    const modifiers = defaultVariantAttrValues.map((av) => ({
      modifierType: av.modifierType,
      modifierValue: av.modifierValue,
    }));
    const currencyDb = currencyId
      ? await prisma.currency.findUnique({ where: { id: currencyId }, select: { currentRate: true } })
      : null;
    currentPriceIRT = await computeInitialCurrentPriceIRT(
      pricingMode as PricingMode,
      basePrice,
      sourcePrice ?? null,
      input.priceBufferPercent !== undefined ? input.priceBufferPercent : (product.priceBufferPercent as number | null),
      currencyDb,
      modifiers
    );
  }

  const { categoryIds, displayAttributes, ...rest } = input;

  const updateData: Record<string, unknown> = {
    ...rest,
    slug,
  };

  if (currentPriceIRT !== undefined) {
    updateData.currentPriceIRT = currentPriceIRT;
    updateData.priceUpdatedAt = new Date();
  }

  if (input.pricingMode) {
    updateData.pricingMode = input.pricingMode;
  }

  if (input.currencyId !== undefined) {
    updateData.currencyId = input.currencyId || null;
  }

  if (input.sourcePrice !== undefined) {
    updateData.sourcePrice = input.sourcePrice;
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      ...updateData,
      ...(categoryIds
        ? { categories: { deleteMany: {}, create: categoryIds.map((categoryId) => ({ categoryId })) } }
        : {}),
      ...(typeof displayAttributes !== "undefined"
        ? {
            displayAttributeValues: {
              deleteMany: {},
              create: displayAttributes.map((displayAttribute) => ({
                attributeId: displayAttribute.attributeId,
                value: displayAttribute.value,
              })),
            },
          }
        : {}),
    },
  });

  await recomputeProductAggregates(id);
  return getProductById(id);
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
  currency: { select: { code: true, symbol: true, currentRate: true } },
  variants: {
    include: {
      attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
    },
  },
  displayAttributeValues: { include: { attribute: true } },
} satisfies Prisma.ProductInclude;

// قیمت نهایی هر تنوع (finalPrice، پیش از تخفیف محصول) را مستقیماً روی
// خودش محاسبه و اضافه می‌کند — تا فرانت مجبور نباشد فرمول قیمت‌گذاری
// (priceAdjustment + modifierValue های ویژگی‌ها + تبدیل ارز) را خودش
// دوباره پیاده‌سازی کند و به‌جایش دقیقاً همین عددی را نشان دهد که در سبد
// خرید/سفارش هم استفاده می‌شود.
function attachVariantPrices(product: Record<string, unknown>): Record<string, unknown> {
  const variants = product.variants as Array<Record<string, unknown>> | undefined;
  if (!variants) return product;

  const pricingInput = {
    pricingMode: product.pricingMode as "FIXED_IRT" | "CURRENCY_BASED",
    basePrice: product.basePrice as number,
    sourcePrice: product.sourcePrice as number | null,
    priceBufferPercent: product.priceBufferPercent as number | null,
  };
  const currency = (product.currency as { currentRate: number | null } | null) ?? null;

  return {
    ...product,
    variants: variants.map((v) => ({
      ...v,
      finalPrice: calculateVariantPrice(pricingInput, currency, {
        priceAdjustment: v.priceAdjustment as number,
        attributeValues: (v.attributeValues as Array<Record<string, unknown>>).map((av) => ({
          modifierType: (av.modifierType ?? null) as never,
          modifierValue: (av.modifierValue ?? null) as number | null,
        })),
      }).finalPriceIRT,
    })),
  };
}

export async function getProductBySlugPublic(slug: string, userId?: number) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: PRODUCT_DETAIL_INCLUDE,
  }) as unknown as (Record<string, unknown> & ProductLike) | null;

  if (!product || product.status !== "PUBLISHED") {
    throw ApiError.notFound("محصول پیدا نشد");
  }

  const serialized = serializeProduct(attachVariantPrices(product)) as Record<string, unknown>;

  await trackProductView(product.id as number);

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
  return serializeProduct(attachVariantPrices(product));
}

export async function getProductByIdPublic(id: number, userId?: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_DETAIL_INCLUDE,
  }) as unknown as (Record<string, unknown> & ProductLike) | null;

  if (!product || product.status !== "PUBLISHED") {
    throw ApiError.notFound("محصول پیدا نشد");
  }

  const serialized = serializeProduct(attachVariantPrices(product)) as Record<string, unknown>;

  await trackProductView(id);

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

export async function trackProductView(productId: number): Promise<void> {
  await prisma.product.update({ where: { id: productId }, data: { viewCount: { increment: 1 } } });
}

export async function getRelatedProducts(productId: number) {
  const cats = await prisma.productCategory.findMany({
    where: { productId },
    select: { categoryId: true },
  });
  if (cats.length === 0) return [];

  const related = await prisma.productCategory.groupBy({
    by: ["productId"],
    where: {
      categoryId: { in: cats.map((c) => c.categoryId) },
      productId: { not: productId },
      product: { status: "PUBLISHED" },
    },
    _count: { categoryId: true },
    orderBy: { _count: { categoryId: "desc" } },
    take: 10,
  });
  if (related.length === 0) return [];

  const ids = related.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: { brand: true, images: { where: { isMain: true }, take: 1, include: { media: true } } },
  });
  return related.map((r) => products.find((p) => p.id === r.productId)).filter(Boolean);
}

export async function getAlsoBoughtProducts(productId: number) {
  const variantIds = await prisma.productVariant.findMany({
    where: { productId },
    select: { id: true },
  });
  if (variantIds.length === 0) return [];

  const orderIds = await prisma.orderItem.findMany({
    where: { variantId: { in: variantIds.map((v) => v.id) } },
    select: { orderId: true },
    distinct: ["orderId"],
  });
  if (orderIds.length === 0) return [];

  const coItems = await prisma.orderItem.findMany({
    where: {
      orderId: { in: orderIds.map((o) => o.orderId) },
      variant: { productId: { not: productId } },
    },
    select: { variant: { select: { productId: true } } },
  });

  const freq = new Map<number, number>();
  for (const item of coItems) {
    const pid = item.variant.productId;
    freq.set(pid, (freq.get(pid) ?? 0) + 1);
  }

  const topIds = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([pid]) => pid);
  if (topIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: topIds }, status: "PUBLISHED" },
    include: { brand: true, images: { where: { isMain: true }, take: 1, include: { media: true } } },
  });
  return topIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);
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


