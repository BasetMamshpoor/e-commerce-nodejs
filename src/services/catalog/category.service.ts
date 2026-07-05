import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import { CreateCategoryInput, UpdateCategoryInput } from "../../validations/category.validation";
import { Prisma } from "../../generated/prisma";

export interface CategoryTreeNode {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  parentId: number | null;
  children: CategoryTreeNode[];
  [key: string]: unknown;
}

async function isSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const existing = await prisma.category.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== excludeId);
}

async function assertParentValid(parentId: number, categoryId?: number): Promise<void> {
  const parent = await prisma.category.findUnique({ where: { id: parentId } });
  if (!parent) throw ApiError.badRequest("دسته‌بندی والد پیدا نشد");

  if (!categoryId) return;

  if (parentId === categoryId) {
    throw ApiError.badRequest("یک دسته‌بندی نمی‌تواند والد خودش باشد");
  }

  const descendantIds = await getDescendantCategoryIds(categoryId, false);
  if (descendantIds.includes(parentId)) {
    throw ApiError.badRequest("والد جدید نمی‌تواند یکی از زیرمجموعه‌های همین دسته باشد");
  }
}

export async function createCategory(input: CreateCategoryInput) {
  if (input.parentId) {
    await assertParentValid(input.parentId);
  }

  const slug = input.slug
    ? slugify(input.slug)
    : await ensureUniqueSlug(input.name, (candidate) => isSlugTaken(candidate));

  if (input.slug && (await isSlugTaken(slug))) {
    throw ApiError.conflict("این slug قبلاً استفاده شده است");
  }

  return prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      imageUrl: input.imageUrl,
      parentId: input.parentId,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
    },
  });
}

export async function updateCategory(id: number, input: UpdateCategoryInput) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("دسته‌بندی پیدا نشد");

  if (input.parentId) {
    await assertParentValid(input.parentId, id);
  }

  let slug: string | undefined;
  if (input.slug) {
    slug = slugify(input.slug);
    if (await isSlugTaken(slug, id)) {
      throw ApiError.conflict("این slug قبلاً استفاده شده است");
    }
  }

  return prisma.category.update({
    where: { id },
    data: { ...input, slug },
  });
}

export async function deleteCategory(id: number): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("دسته‌بندی پیدا نشد");

  const childCount = await prisma.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    throw ApiError.conflict("این دسته‌بندی زیرمجموعه دارد؛ ابتدا زیرمجموعه‌ها را حذف یا منتقل کنید");
  }

  await prisma.category.delete({ where: { id } });
}

export async function getCategoryById(id: number) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("دسته‌بندی پیدا نشد");
  return category;
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) throw ApiError.notFound("دسته‌بندی پیدا نشد");
  return category;
}

export async function listCategoriesFlat(includeInactive: boolean) {
  return prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

export async function getCategoryTree(includeInactive: boolean): Promise<CategoryTreeNode[]> {
  const all = await prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return buildTree(all, null) as unknown as CategoryTreeNode[];
}

function buildTree<T extends { id: number; parentId: number | null }>(
  all: T[],
  parentId: number | null
): (T & { children: unknown[] })[] {
  return all
    .filter((c) => c.parentId === parentId)
    .map((c) => ({ ...c, children: buildTree(all, c.id) })) as (T & { children: unknown[] })[];
}

export async function getDescendantCategoryIds(categoryId: number, includeSelf = true): Promise<number[]> {
  const all = await prisma.category.findMany({ select: { id: true, parentId: true } });

  const result: number[] = includeSelf ? [categoryId] : [];
  let frontier: number[] = [categoryId];

  while (frontier.length > 0) {
    const children = all.filter((c) => c.parentId && frontier.includes(c.parentId)).map((c) => c.id);
    result.push(...children);
    frontier = children;
  }

  return result;
}

export async function attachAttributeToCategory(categoryId: number, attributeId: number) {
  const exists = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!exists) throw ApiError.notFound("دسته‌بندی پیدا نشد");

  const attribute = await prisma.attribute.findUnique({ where: { id: attributeId } });
  if (!attribute) throw ApiError.notFound("ویژگی پیدا نشد");

  return prisma.categoryAttribute.upsert({
    where: { categoryId_attributeId: { categoryId, attributeId } },
    create: { categoryId, attributeId },
    update: {},
  });
}

export async function detachAttributeFromCategory(categoryId: number, attributeId: number) {
  await prisma.categoryAttribute.deleteMany({ where: { categoryId, attributeId } });
}

export async function listCategoryAttributes(categoryId: number) {
  return prisma.categoryAttribute.findMany({
    where: { categoryId },
    include: { attribute: { include: { values: true } } },
  });
}
