import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import { serializeCategory } from "../../utils/serialize";
import { CreateCategoryInput, UpdateCategoryInput } from "../../validations/category.validation";
import { Category, Media } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// دسته‌بندی چندلایه (درختی) — آیتم ۳
// ----------------------------------------------------------------------------

type CategoryWithImage = Category & { image: Media | null };

export interface CategoryTreeNode extends CategoryWithImage {
  imageUrl: string | null;
  children: CategoryTreeNode[];
}

async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.category.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== excludeId);
}

async function assertParentValid(parentId: string, categoryId?: string): Promise<void> {
  const parent = await prisma.category.findUnique({ where: { id: parentId } });
  if (!parent) throw ApiError.badRequest("دسته‌بندی والد پیدا نشد");

  if (!categoryId) return; // در حالت ایجاد، خودِ دسته هنوز وجود ندارد، چرخش ممکن نیست

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

  const category = (await prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      imageId: input.imageId,
      parentId: input.parentId,
      order: input.order ?? 0,
      isActive: input.isActive ?? true,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      canonicalUrl: input.canonicalUrl,
    },
    include: { image: true },
  })) as unknown as CategoryWithImage;

  return serializeCategory(category);
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
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

  const updated = (await prisma.category.update({
    where: { id },
    data: { ...input, slug },
    include: { image: true },
  })) as unknown as CategoryWithImage;

  return serializeCategory(updated);
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound("دسته‌بندی پیدا نشد");

  const childCount = await prisma.category.count({ where: { parentId: id } });
  if (childCount > 0) {
    throw ApiError.conflict(
      "این دسته‌بندی زیرمجموعه دارد؛ ابتدا زیرمجموعه‌ها را حذف یا منتقل کنید"
    );
  }

  // پیوندهای ProductCategory / CategoryAttribute / DiscountCodeCategory به‌صورت
  // خودکار (onDelete: Cascade در schema) حذف می‌شوند؛ خودِ محصولات دست‌نخورده باقی می‌مانند.
  await prisma.category.delete({ where: { id } });
}

export async function getCategoryById(id: string) {
  const category = (await prisma.category.findUnique({
    where: { id },
    include: { image: true },
  })) as unknown as CategoryWithImage | null;
  if (!category) throw ApiError.notFound("دسته‌بندی پیدا نشد");
  return serializeCategory(category);
}

export async function getCategoryBySlug(slug: string) {
  const category = (await prisma.category.findUnique({
    where: { slug },
    include: { image: true },
  })) as unknown as CategoryWithImage | null;
  if (!category) throw ApiError.notFound("دسته‌بندی پیدا نشد");
  return serializeCategory(category);
}

export async function listCategoriesFlat(includeInactive: boolean) {
  const categories = (await prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { image: true },
  })) as unknown as CategoryWithImage[];

  return categories.map(serializeCategory);
}

export async function getCategoryTree(includeInactive: boolean): Promise<CategoryTreeNode[]> {
  const all = (await prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { image: true },
  })) as unknown as CategoryWithImage[];

  const flatWithUrl = all.map(serializeCategory) as (ReturnType<typeof serializeCategory> & {
    id: string;
    parentId: string | null;
  })[];

  return buildTree(flatWithUrl, null) as unknown as CategoryTreeNode[];
}

function buildTree<T extends { id: string; parentId: string | null }>(
  all: T[],
  parentId: string | null
): (T & { children: T[] })[] {
  return all
    .filter((c) => c.parentId === parentId)
    .map((c) => ({ ...c, children: buildTree(all, c.id) })) as (T & { children: T[] })[];
}

/**
 * شناسه‌ی خودِ دسته به‌همراه تمام زیرمجموعه‌ها (در همه‌ی سطوح) را برمی‌گرداند.
 * در فیلتر محصولات بر اساس دسته استفاده می‌شود تا با انتخاب یک دسته‌ی والد،
 * محصولات زیرمجموعه‌ها هم نمایش داده شوند.
 */
export async function getDescendantCategoryIds(
  categoryId: string,
  includeSelf = true
): Promise<string[]> {
  const all = await prisma.category.findMany({ select: { id: true, parentId: true } });

  const result: string[] = includeSelf ? [categoryId] : [];
  let frontier = [categoryId];

  while (frontier.length > 0) {
    const children = all.filter((c) => c.parentId && frontier.includes(c.parentId)).map((c) => c.id);
    result.push(...children);
    frontier = children;
  }

  return result;
}

// ----------------------------------------------------------------------------
// پیوند ویژگی‌ها به دسته‌بندی (برای ساخت فیلترهای مرتبط با هر دسته)
// ----------------------------------------------------------------------------

export async function attachAttributeToCategory(categoryId: string, attributeId: string) {
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

export async function detachAttributeFromCategory(categoryId: string, attributeId: string) {
  await prisma.categoryAttribute.deleteMany({ where: { categoryId, attributeId } });
}

export async function listCategoryAttributes(categoryId: string) {
  return prisma.categoryAttribute.findMany({
    where: { categoryId },
    include: { attribute: { include: { values: true } } },
  });
}
