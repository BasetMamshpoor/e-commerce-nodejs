import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { getDescendantCategoryIds } from "./category.service";
import { ListProductsQuery, AdminListProductsQuery } from "../../validations/product.validation";
import { Attribute, AttributeValue, Product, Brand } from "../../generated/prisma";
import { serializeProduct, serializeBrand, ProductLike } from "../../utils/serialize";

// ----------------------------------------------------------------------------
// نکته‌ی مهم درباره‌ی فیلتر بر اساس چند ویژگی هم‌زمان (مثلاً رنگ=قرمز و سایز=L):
// فیلتر در سطح «محصول» انجام می‌شود نه «تنوع». یعنی محصولی که یک تنوعِ قرمز
// و یک تنوعِ دیگر با سایز L دارد (نه لزوماً در یک تنوع) هم در نتیجه می‌آید.
// این دقیقاً همان رفتاری است که اکثر فروشگاه‌های اینترنتی در صفحه‌ی لیست
// محصولات دارند (ترکیب دقیق را کاربر در صفحه‌ی خود محصول انتخاب می‌کند).
// ----------------------------------------------------------------------------

const LIST_INCLUDE = {
  brand: { include: { logo: true } },
  categories: { include: { category: { include: { image: true } } } },
  images: { where: { isMain: true }, take: 1, include: { media: true } },
};

function parseIdList(value?: string): string[] | undefined {
  if (!value) return undefined;
  const ids = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}

function buildSortOrder(sort: ListProductsQuery["sort"]) {
  switch (sort) {
    case "price_asc":
      return { minPrice: "asc" as const };
    case "price_desc":
      return { minPrice: "desc" as const };
    case "popular":
      return { viewCount: "desc" as const };
    default:
      return { createdAt: "desc" as const };
  }
}

async function buildAttributeFilterConditions(
  attributeValueIdsParam?: string
): Promise<Record<string, unknown>[]> {
  const ids = parseIdList(attributeValueIdsParam);
  if (!ids) return [];

  const values = await prisma.attributeValue.findMany({
    where: { id: { in: ids } },
    select: { id: true, attributeId: true },
  });

  const groups = new Map<string, string[]>();
  for (const v of values) {
    const arr = groups.get(v.attributeId) ?? [];
    arr.push(v.id);
    groups.set(v.attributeId, arr);
  }

  // برای هر ویژگی یک شرط جدا (AND بین ویژگی‌های مختلف، OR بین مقادیر یک ویژگی)
  return Array.from(groups.values()).map((groupIds) => ({
    variants: { some: { attributeValues: { some: { attributeValueId: { in: groupIds } } } } },
  }));
}

async function buildCommonConditions(
  query: ListProductsQuery
): Promise<Record<string, unknown>[]> {
  const AND: Record<string, unknown>[] = [];

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
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const AND = await buildCommonConditions(query);
  AND.push({ status: "PUBLISHED" });

  const where = { AND };
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

  return {
    items: (items as unknown as (Product & ProductLike)[]).map(serializeProduct),
    meta: buildPaginationMeta(total, pagination),
  };
}

export async function listProductsAdmin(query: AdminListProductsQuery) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const AND = await buildCommonConditions(query);
  if (query.status) AND.push({ status: query.status });

  const where = AND.length > 0 ? { AND } : {};
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

  return {
    items: (items as unknown as (Product & ProductLike)[]).map(serializeProduct),
    meta: buildPaginationMeta(total, pagination),
  };
}

// ----------------------------------------------------------------------------
// متادیتای فیلتر برای ساخت UI صفحه‌ی فروشگاه (بدون شمارش تعداد محصول هر گزینه —
// اگر بعداً لازم شد، می‌توان با چند کوئری groupBy اضافه اضافه کرد)
// ----------------------------------------------------------------------------

export async function getStorefrontFilters(categorySlug?: string) {
  let categoryIds: string[] | undefined;

  if (categorySlug) {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) throw ApiError.notFound("دسته‌بندی پیدا نشد");
    categoryIds = await getDescendantCategoryIds(category.id);
  }

  const productWhere = {
    status: "PUBLISHED" as const,
    ...(categoryIds ? { categories: { some: { categoryId: { in: categoryIds } } } } : {}),
  };

  const [brands, priceAgg] = await Promise.all([
    prisma.brand.findMany({
      where: { isActive: true, products: { some: productWhere } },
      orderBy: { name: "asc" },
      include: { logo: true },
    }),
    prisma.product.aggregate({
      where: productWhere,
      _min: { minPrice: true },
      _max: { maxPrice: true },
    }),
  ]);

  let attributes: (Attribute & { values: AttributeValue[] })[];

  if (categoryIds) {
    const links = (await prisma.categoryAttribute.findMany({
      where: { categoryId: { in: categoryIds } },
      include: { attribute: { include: { values: true } } },
    })) as unknown as { attribute: Attribute & { values: AttributeValue[] } }[];

    const unique = new Map<string, Attribute & { values: AttributeValue[] }>();
    for (const link of links) unique.set(link.attribute.id, link.attribute);
    attributes = Array.from(unique.values());
  } else {
    attributes = (await prisma.attribute.findMany({
      where: { isFilterable: true },
      include: { values: true },
    })) as (Attribute & { values: AttributeValue[] })[];
  }

  return {
    brands: (brands as unknown as (Brand & { logo: { url: string; alt: string | null } | null })[]).map(
      serializeBrand
    ),
    priceRange: {
      min: priceAgg._min.minPrice ?? 0,
      max: priceAgg._max.maxPrice ?? 0,
    },
    attributes,
  };
}
