import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { getDescendantCategoryIds } from "./category.service";
import { ListProductsQuery, AdminListProductsQuery } from "../../validations/product.validation";
import { Prisma } from "../../generated/prisma";
import { getOrSetCache } from "../../lib/cache";

// ----------------------------------------------------------------------------
// کش برای صفحه‌ی «لیست/جستجوی محصولات» فروشگاه (نه پنل ادمین).
//
// چرا فقط TTL کوتاه (بدون invalidation دقیق روی هر تغییر)؟ چون این endpoint
// (برخلاف درخت دسته‌بندی) به تقریباً هر نوع تغییری در سیستم حساس است:
// موجودی (با ثبت سفارش)، قیمت (با تغییر تنوع یا نرخ ارز)، تخفیف فعال
// (با فعال/غیرفعال‌شدن کد تخفیف)، وضعیت انتشار محصول، و غیره. این
// مسیرهای نوشتاری آن‌قدر پراکنده‌اند که invalidate کردن دقیق برایشان
// پرریسک است — یک مسیر فراموش‌شده یعنی داده‌ی قدیمی برای مدت نامعلوم.
//
// به‌جایش یک TTL کوتاه (۳۰ ثانیه) به‌عنوان مرز بالای staleness استفاده
// می‌شود: بدترین حالت این است که یک محصول تا ۳۰ ثانیه با قیمت/موجودیِ
// یک لحظه‌ی قبل در لیست دیده شود — و این فقط صفحه‌ی «مرور/جستجو» را
// تحت‌تأثیر قرار می‌دهد؛ صفحه‌ی جزئیات محصول و مسیر پرداخت (که واقعاً
// روی آن‌ها پول رد و بدل می‌شود) اصلاً کش نمی‌شوند و همیشه لحظه‌ای و
// دقیق‌اند.
function buildListCacheKey(prefix: string, query: Record<string, unknown>): string {
  const sortedEntries = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `${prefix}:${JSON.stringify(sortedEntries)}`;
}

const LISTING_CACHE_TTL_SECONDS = 30;

const LIST_INCLUDE = {
  brand: true,
  categories: { include: { category: true } },
  images: { where: { isMain: true }, take: 1, include: { media: true } },
} satisfies Prisma.ProductInclude;

function parseIdList(value?: string): number[] | undefined {
  if (!value) return undefined;
  const ids = value
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v > 0);
  return ids.length > 0 ? ids : undefined;
}

function buildSortOrder(sort: ListProductsQuery["sort"]): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "price_asc":
      return { minPrice: "asc" };
    case "price_desc":
      return { minPrice: "desc" };
    case "popular":
      return { viewCount: "desc" };
    case "most_viewed":
      return { viewCount: "desc" };
    case "most_popular":
      return { avgRating: "desc" };
    case "bestselling":
      return { totalSold: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

async function buildAttributeFilterConditions(
  attributeValueIdsParam?: string
): Promise<Prisma.ProductWhereInput[]> {
  const ids = parseIdList(attributeValueIdsParam);
  if (!ids) return [];

  const values = await prisma.attributeValue.findMany({
    where: { id: { in: ids } },
    select: { id: true, attributeId: true },
  });

  const groups = new Map<number, number[]>();
  for (const v of values) {
    const arr = groups.get(v.attributeId) ?? [];
    arr.push(v.id);
    groups.set(v.attributeId, arr);
  }

  return Array.from(groups.values()).map((groupIds) => ({
    variants: { some: { attributeValues: { some: { attributeValueId: { in: groupIds } } } } },
  }));
}

async function buildCommonConditions(query: ListProductsQuery): Promise<Prisma.ProductWhereInput[]> {
  const AND: Prisma.ProductWhereInput[] = [];

  if (query.categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: query.categorySlug } });
    if (!category) throw ApiError.notFound("دسته‌بندی پیدا نشد");
    const ids = await getDescendantCategoryIds(category.id);
    AND.push({ categories: { some: { categoryId: { in: ids } } } });
  }

  const brandIds = parseIdList(query.brandIds);
  if (brandIds) AND.push({ brandId: { in: brandIds } });

  if (query.minPrice !== undefined) AND.push({ maxPrice: { gte: query.minPrice } });
  if (query.maxPrice !== undefined) AND.push({ minPrice: { lte: query.maxPrice } });

  if (query.inStock) AND.push({ isInStock: true });
  if (query.hasDiscount) AND.push({ hasActiveDiscount: true });
  if (query.isFeatured) AND.push({ isFeatured: true });

  if (query.search) {
    AND.push({
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { shortDescription: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  AND.push(...(await buildAttributeFilterConditions(query.attributeValueIds)));

  return AND;
}

export async function listProductsStorefront(query: ListProductsQuery) {
  return getOrSetCache(
    buildListCacheKey("product-list", query as unknown as Record<string, unknown>),
    LISTING_CACHE_TTL_SECONDS,
    async () => {
      const pagination = parsePagination({ page: query.page, limit: query.limit });
      const AND = await buildCommonConditions(query);
      AND.push({ status: "PUBLISHED" });

      const where: Prisma.ProductWhereInput = { AND };
      const orderBy = buildSortOrder(query.sort);

      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip: pagination.skip,
          take: pagination.take,
          include: LIST_INCLUDE,
        }),
        prisma.product.count({ where }),
      ]);

      return { items, meta: buildPaginationMeta(total, pagination) };
    }
  );
}

export async function listProductsAdmin(query: AdminListProductsQuery) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const AND = await buildCommonConditions(query);
  if (query.status) AND.push({ status: query.status });

  const where: Prisma.ProductWhereInput = AND.length > 0 ? { AND } : {};
  const orderBy = buildSortOrder(query.sort);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
      include: LIST_INCLUDE,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}

export async function getStorefrontFilters(categorySlug?: string) {
  return getOrSetCache(
    `product-filters:${categorySlug ?? "__all__"}`,
    LISTING_CACHE_TTL_SECONDS,
    async () => {
      let categoryIds: number[] | undefined;

      if (categorySlug) {
        const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
        if (!category) throw ApiError.notFound("دسته‌بندی پیدا نشد");
        categoryIds = await getDescendantCategoryIds(category.id);
      }

      const productWhere: Prisma.ProductWhereInput = {
        status: "PUBLISHED",
        ...(categoryIds ? { categories: { some: { categoryId: { in: categoryIds } } } } : {}),
      };

      const [brands, priceAgg] = await Promise.all([
        prisma.brand.findMany({
          where: { isActive: true, products: { some: productWhere } },
          orderBy: { name: "asc" },
        }),
        prisma.product.aggregate({
          where: productWhere,
          _min: { minPrice: true },
          _max: { maxPrice: true },
        }),
      ]);

      let attributes: Awaited<ReturnType<typeof prisma.attribute.findMany>>;

      if (categoryIds) {
        const links = await prisma.categoryAttribute.findMany({
          where: { categoryId: { in: categoryIds } },
          include: { attribute: { include: { values: true } } },
        });

        const unique = new Map<number, Awaited<ReturnType<typeof prisma.attribute.findMany>>[number]>();
        for (const link of links) unique.set(link.attribute.id, link.attribute);
        attributes = Array.from(unique.values());
      } else {
        attributes = await prisma.attribute.findMany({
          where: { isFilterable: true },
          include: { values: true },
        });
      }

      return {
        brands,
        priceRange: {
          min: priceAgg._min.minPrice ?? 0,
          max: priceAgg._max.maxPrice ?? 0,
        },
        attributes,
      };
    }
  );
}
