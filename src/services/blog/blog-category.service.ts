import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import {
  CreateBlogCategoryInput,
  UpdateBlogCategoryInput,
} from "../../validations/blog.validation";
import { BlogCategory } from "../../generated/prisma";

async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.blogCategory.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== excludeId);
}

export async function createBlogCategory(input: CreateBlogCategoryInput): Promise<BlogCategory> {
  const slug = input.slug
    ? slugify(input.slug)
    : await ensureUniqueSlug(input.name, (c) => isSlugTaken(c));

  if (input.slug && (await isSlugTaken(slug))) {
    throw ApiError.conflict("این slug قبلاً استفاده شده است");
  }

  return prisma.blogCategory.create({ data: { ...input, slug } });
}

export async function updateBlogCategory(
  id: string,
  input: UpdateBlogCategoryInput
): Promise<BlogCategory> {
  const category = await prisma.blogCategory.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("دسته‌بندی وبلاگ پیدا نشد");

  let slug: string | undefined;
  if (input.slug) {
    slug = slugify(input.slug);
    if (await isSlugTaken(slug, id)) throw ApiError.conflict("این slug قبلاً استفاده شده است");
  }

  return prisma.blogCategory.update({ where: { id }, data: { ...input, slug } });
}

export async function deleteBlogCategory(id: string): Promise<void> {
  const category = await prisma.blogCategory.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("دسته‌بندی وبلاگ پیدا نشد");

  const postCount = await prisma.blogPost.count({ where: { categoryId: id } });
  if (postCount > 0) {
    throw ApiError.conflict("این دسته‌بندی پست دارد؛ ابتدا پست‌ها را منتقل کنید");
  }

  await prisma.blogCategory.delete({ where: { id } });
}

export async function listBlogCategories(): Promise<BlogCategory[]> {
  return prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
}

export async function getBlogCategoryBySlug(slug: string): Promise<BlogCategory> {
  const category = await prisma.blogCategory.findUnique({ where: { slug } });
  if (!category) throw ApiError.notFound("دسته‌بندی وبلاگ پیدا نشد");
  return category;
}
