import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import {
  CreateBlogPostInput,
  UpdateBlogPostInput,
  ListBlogPostsQuery,
  AdminListBlogPostsQuery,
} from "../../validations/blog.validation";
import { BlogPost, BlogCategory, BlogPostProduct, Product } from "../../generated/prisma";

type PostWithRelations = BlogPost & {
  category: BlogCategory | null;
  products: (BlogPostProduct & { product: Product })[];
};

const DETAIL_INCLUDE = { category: true, products: { include: { product: true } } };

async function isSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== excludeId);
}

export async function createBlogPost(authorId: number | undefined, input: CreateBlogPostInput) {
  if (input.categoryId) {
    const category = await prisma.blogCategory.findUnique({ where: { id: input.categoryId } });
    if (!category) throw ApiError.badRequest("دسته‌بندی انتخاب‌شده معتبر نیست");
  }

  const slug = input.slug
    ? slugify(input.slug)
    : await ensureUniqueSlug(input.title, (c) => isSlugTaken(c));

  if (input.slug && (await isSlugTaken(slug))) {
    throw ApiError.conflict("این slug قبلاً استفاده شده است");
  }

  return prisma.blogPost.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImageMediaId: input.coverImageMediaId,
      coverImageUrl:input.coverImageUrl,
      categoryId: input.categoryId,
      status: input.status,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
      authorId,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
      products: input.productIds?.length
        ? { create: input.productIds.map((productId) => ({ productId })) }
        : undefined,
    },
    include: DETAIL_INCLUDE,
  }) as Promise<PostWithRelations>;
}

export async function updateBlogPost(id: number, input: UpdateBlogPostInput) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) throw ApiError.notFound("پست وبلاگ پیدا نشد");

  if (input.categoryId) {
    const category = await prisma.blogCategory.findUnique({ where: { id: input.categoryId } });
    if (!category) throw ApiError.badRequest("دسته‌بندی انتخاب‌شده معتبر نیست");
  }

  let slug: string | undefined;
  if (input.slug) {
    slug = slugify(input.slug);
    if (await isSlugTaken(slug, id)) throw ApiError.conflict("این slug قبلاً استفاده شده است");
  }

  // اولین بار که وضعیت به PUBLISHED تغییر می‌کند، publishedAt ست می‌شود
  const becomingPublished = input.status === "PUBLISHED" && post.status !== "PUBLISHED";

  const { productIds, ...postData } = input;

  const updated = (await prisma.blogPost.update({
    where: { id },
    data: { ...postData, slug, ...(becomingPublished ? { publishedAt: new Date() } : {}) },
    include: DETAIL_INCLUDE,
  })) as PostWithRelations;

  if (productIds !== undefined) {
    await prisma.blogPostProduct.deleteMany({ where: { blogPostId: id } });
    if (productIds.length) {
      await prisma.blogPostProduct.createMany({
        data: productIds.map((productId) => ({ blogPostId: id, productId })),
        skipDuplicates: true,
      });
    }
    return (await prisma.blogPost.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    })) as PostWithRelations;
  }

  return updated;
}

export async function deleteBlogPost(id: number): Promise<void> {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) throw ApiError.notFound("پست وبلاگ پیدا نشد");
  await prisma.blogPost.delete({ where: { id } });
  // کامنت‌های این پست (پلی‌مورفیک، بدون FK واقعی) به‌صورت خودکار حذف نمی‌شوند؛
  // عمداً نگه‌داشته می‌شوند مگر با ابزار پاک‌سازی جدا حذف شوند.
}

export async function getBlogPostBySlugPublic(slug: string) {
  const post = (await prisma.blogPost.findUnique({
    where: { slug },
    include: DETAIL_INCLUDE,
  })) as PostWithRelations | null;
  if (!post || post.status !== "PUBLISHED") throw ApiError.notFound("پست وبلاگ پیدا نشد");

  await prisma.blogPost.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } });

  return post;
}

export async function getBlogPostByIdAdmin(id: number) {
  const post = (await prisma.blogPost.findUnique({
    where: { id },
    include: DETAIL_INCLUDE,
  })) as PostWithRelations | null;
  if (!post) throw ApiError.notFound("پست وبلاگ پیدا نشد");
  return post;
}

async function buildWhere(query: ListBlogPostsQuery) {
  const where: Record<string, unknown> = {};
  if (query.categorySlug) {
    const category = await prisma.blogCategory.findUnique({ where: { slug: query.categorySlug } });
    if (!category) throw ApiError.notFound("دسته‌بندی وبلاگ پیدا نشد");
    where.categoryId = category.id;
  }
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { excerpt: { contains: query.search, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function listBlogPostsPublic(query: ListBlogPostsQuery) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where = { ...(await buildWhere(query)), status: "PUBLISHED" as const };

  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: DETAIL_INCLUDE,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    items: items as unknown as PostWithRelations[],
    meta: buildPaginationMeta(total, pagination),
  };
}

export async function listBlogPostsAdmin(query: AdminListBlogPostsQuery) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where = { ...(await buildWhere(query)), ...(query.status ? { status: query.status } : {}) };

  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: DETAIL_INCLUDE,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    items: items as unknown as PostWithRelations[],
    meta: buildPaginationMeta(total, pagination),
  };
}
