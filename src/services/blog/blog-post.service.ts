import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { serializeBlogPost } from "../../utils/serialize";
import {
  CreateBlogPostInput,
  UpdateBlogPostInput,
  ListBlogPostsQuery,
  AdminListBlogPostsQuery,
} from "../../validations/blog.validation";
import { BlogPost, Media, BlogCategory } from "../../generated/prisma";

type PostWithRelations = BlogPost & {
  coverImage: Media | null;
  category: BlogCategory | null;
};

const DETAIL_INCLUDE = { coverImage: true, category: true };

async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== excludeId);
}

export async function createBlogPost(authorId: string | undefined, input: CreateBlogPostInput) {
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

  const post = (await prisma.blogPost.create({
    data: {
      title: input.title,
      slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImageId: input.coverImageId,
      categoryId: input.categoryId,
      status: input.status,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
      authorId,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    },
    include: DETAIL_INCLUDE,
  })) as unknown as PostWithRelations;

  return serializeBlogPost(post);
}

export async function updateBlogPost(id: string, input: UpdateBlogPostInput) {
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

  const updated = (await prisma.blogPost.update({
    where: { id },
    data: { ...input, slug, ...(becomingPublished ? { publishedAt: new Date() } : {}) },
    include: DETAIL_INCLUDE,
  })) as unknown as PostWithRelations;

  return serializeBlogPost(updated);
}

export async function deleteBlogPost(id: string): Promise<void> {
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
  })) as unknown as PostWithRelations | null;
  if (!post || post.status !== "PUBLISHED") throw ApiError.notFound("پست وبلاگ پیدا نشد");
  return serializeBlogPost(post);
}

export async function getBlogPostByIdAdmin(id: string) {
  const post = (await prisma.blogPost.findUnique({
    where: { id },
    include: DETAIL_INCLUDE,
  })) as unknown as PostWithRelations | null;
  if (!post) throw ApiError.notFound("پست وبلاگ پیدا نشد");
  return serializeBlogPost(post);
}

export async function trackBlogPostView(id: string): Promise<void> {
  await prisma.blogPost.update({ where: { id }, data: { viewCount: { increment: 1 } } });
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
    items: (items as unknown as PostWithRelations[]).map(serializeBlogPost),
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
    items: (items as unknown as PostWithRelations[]).map(serializeBlogPost),
    meta: buildPaginationMeta(total, pagination),
  };
}
