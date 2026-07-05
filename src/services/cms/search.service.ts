import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";

export async function globalSearch(query: string) {
  if (!query || query.trim().length < 2) {
    return { products: [], blogPosts: [], categories: [], brands: [] };
  }

  const [products, blogPosts, categories, brands] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED", OR: [{ name: { contains: query, mode: "insensitive" } }, { shortDescription: { contains: query, mode: "insensitive" } }] },
      take: 10,
      include: { brand: true, images: { where: { isMain: true }, take: 1, include: { media: true } } },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED", OR: [{ title: { contains: query, mode: "insensitive" } }, { excerpt: { contains: query, mode: "insensitive" } }] },
      take: 5,
      select: { id: true, title: true, slug: true, excerpt: true, coverImageMediaId: true },
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: query, mode: "insensitive" } },
      take: 5,
      select: { id: true, name: true, slug: true, imageUrl: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true, name: { contains: query, mode: "insensitive" } },
      take: 5,
      select: { id: true, name: true, slug: true, logoUrl: true },
    }),
  ]);

  return { products, blogPosts, categories, brands };
}

export async function quickSearch(query: string) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const limit = 5;

  const [products, categories, blogPosts] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED", name: { contains: query, mode: "insensitive" } },
      take: limit,
      select: { id: true, name: true, slug: true },
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: query, mode: "insensitive" } },
      take: 3,
      select: { id: true, name: true, slug: true },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED", title: { contains: query, mode: "insensitive" } },
      take: 3,
      select: { id: true, title: true, slug: true },
    }),
  ]);

  const result: Array<Record<string, unknown>> = [];
  for (const p of products) result.push({ type: "product", id: p.id, title: p.name, slug: p.slug });
  for (const c of categories) result.push({ type: "category", id: c.id, title: c.name, slug: c.slug });
  for (const b of blogPosts) result.push({ type: "blog_post", id: b.id, title: b.title, slug: b.slug });

  return result;
}

interface MainSearchQuery {
  q: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
  brandIds?: string;
  categoryIds?: string;
  inStock?: boolean;
  hasDiscount?: boolean;
  sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "most_popular" | "bestselling";
}

export async function mainSearch(query: MainSearchQuery) {
  if (!query.q || query.q.trim().length < 2) {
    return { items: [], filters: {}, meta: buildPaginationMeta(0, { page: 1, limit: 20, skip: 0, take: 20 }) };
  }

  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const AND: Array<Record<string, unknown>> = [
    { status: "PUBLISHED" },
    { OR: [{ name: { contains: query.q, mode: "insensitive" } }, { shortDescription: { contains: query.q, mode: "insensitive" } }] },
  ];

  if (query.minPrice !== undefined) AND.push({ maxPrice: { gte: query.minPrice } });
  if (query.maxPrice !== undefined) AND.push({ minPrice: { lte: query.maxPrice } });

  const brandIdsArr = query.brandIds?.split(",").map(Number).filter(Boolean) ?? [];
  if (brandIdsArr.length > 0) AND.push({ brandId: { in: brandIdsArr } });

  const categoryIdsArr = query.categoryIds?.split(",").map(Number).filter(Boolean) ?? [];
  if (categoryIdsArr.length > 0) AND.push({ categories: { some: { categoryId: { in: categoryIdsArr } } } });

  if (query.inStock) AND.push({ isInStock: true });
  if (query.hasDiscount) AND.push({ hasActiveDiscount: true });

  const where = { AND };

  const orderBy: Record<string, string> = {};
  switch (query.sort) {
    case "price_asc": orderBy.minPrice = "asc"; break;
    case "price_desc": orderBy.minPrice = "desc"; break;
    case "newest": orderBy.createdAt = "desc"; break;
    case "most_popular": orderBy.avgRating = "desc"; break;
    case "bestselling": orderBy.totalSold = "desc"; break;
    default: orderBy.createdAt = "desc";
  }

  const [items, total, brandsWithCount, priceRange] = await Promise.all([
    prisma.product.findMany({
      where: where as never,
      orderBy,
      skip: pagination.skip,
      take: pagination.take,
      include: { brand: true, images: { where: { isMain: true }, take: 1, include: { media: true } } },
    }),
    prisma.product.count({ where: where as never }),
    prisma.brand.findMany({
      where: { isActive: true, products: { some: where as never } },
      orderBy: { name: "asc" },
    }),
    prisma.product.aggregate({
      where: where as never,
      _min: { minPrice: true },
      _max: { maxPrice: true },
    }),
  ]);

  const filters = {
    brands: brandsWithCount,
    priceRange: {
      min: priceRange._min.minPrice ?? 0,
      max: priceRange._max.maxPrice ?? 0,
    },
    hasDiscount: true,
    inStock: true,
  };

  return { items, filters, meta: buildPaginationMeta(total, pagination) };
}
