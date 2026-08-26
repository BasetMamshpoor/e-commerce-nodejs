import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { slugify, ensureUniqueSlug } from "../../utils/slug";
import {
  CreateAttributeInput,
  UpdateAttributeInput,
  CreateAttributeValueInput,
  UpdateAttributeValueInput,
} from "../../validations/attribute.validation";

async function isSlugTaken(slug: string, excludeId?: number): Promise<boolean> {
  const existing = await prisma.attribute.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== excludeId);
}

export async function createAttribute(input: CreateAttributeInput) {
  const slug = input.slug
    ? slugify(input.slug)
    : await ensureUniqueSlug(input.name, (c) => isSlugTaken(c));

  if (input.slug && (await isSlugTaken(slug))) {
    throw ApiError.conflict("این slug قبلاً استفاده شده است");
  }

  return prisma.attribute.create({
    data: {
      name: input.name,
      slug,
      inputType: input.inputType,
      isFilterable: input.isFilterable,
      isVariant: input.isVariant,
      isDisplay: input.isDisplay ?? false,
      categories: input.categoryIds?.length
        ? { create: input.categoryIds.map((categoryId) => ({ categoryId })) }
        : undefined,
    },
    include: { categories: { select: { categoryId: true } } },
  });
}

export async function updateAttribute(id: number, input: UpdateAttributeInput) {
  const attribute = await prisma.attribute.findUnique({ where: { id } });
  if (!attribute) throw ApiError.notFound("ویژگی پیدا نشد");

  let slug: string | undefined;
  if (input.slug) {
    slug = slugify(input.slug);
    if (await isSlugTaken(slug, id)) {
      throw ApiError.conflict("این slug قبلاً استفاده شده است");
    }
  }

  const { categoryIds, ...rest } = input;

  return prisma.attribute.update({
    where: { id },
    data: {
      ...rest,
      slug,
      // undefined categoryIds (key omitted entirely) means "don't touch
      // category associations" — only an explicit array (including an
      // empty one, meaning "applies to all categories again") replaces
      // them, via full delete+recreate since this is a small join table.
      ...(categoryIds !== undefined
        ? {
            categories: {
              deleteMany: {},
              create: categoryIds.map((categoryId) => ({ categoryId })),
            },
          }
        : {}),
    },
    include: { categories: { select: { categoryId: true } } },
  });
}

export async function deleteAttribute(id: number): Promise<void> {
  const attribute = await prisma.attribute.findUnique({ where: { id } });
  if (!attribute) throw ApiError.notFound("ویژگی پیدا نشد");

  const usedInVariants = await prisma.productVariantAttributeValue.count({
    where: { attributeValue: { attributeId: id } },
  });
  if (usedInVariants > 0) {
    throw ApiError.conflict("این ویژگی در حال استفاده توسط تنوع‌های محصول است و قابل حذف نیست");
  }

  await prisma.attribute.delete({ where: { id } });
}

export async function listAttributes(categoryIds?: number[]) {
  return prisma.attribute.findMany({
    where:
      categoryIds && categoryIds.length > 0
        ? {
            OR: [
              // Applies to (at least one of) the given categories...
              { categories: { some: { categoryId: { in: categoryIds } } } },
              // ...or has no category restriction at all (applies everywhere).
              { categories: { none: {} } },
            ],
          }
        : undefined,
    include: {
      values: { orderBy: { order: "asc" } },
      // Needed by the admin attributes page (to show/edit which categories
      // an attribute applies to) and by product create/edit (to filter the
      // variant/display attribute pickers down to the product's selected
      // categories) — previously never included, so both consumers had no
      // way to know this without fetching categories one-by-one.
      categories: { select: { categoryId: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getAttributeById(id: number) {
  const attribute = await prisma.attribute.findUnique({
    where: { id },
    include: { values: { orderBy: { order: "asc" } } },
  });
  if (!attribute) throw ApiError.notFound("ویژگی پیدا نشد");
  return attribute;
}

export async function addAttributeValue(attributeId: number, input: CreateAttributeValueInput) {
  await getAttributeById(attributeId);

  const duplicate = await prisma.attributeValue.findUnique({
    where: { attributeId_value: { attributeId, value: input.value } },
  });
  if (duplicate) {
    throw ApiError.conflict("این مقدار قبلاً برای این ویژگی ثبت شده است");
  }

  return prisma.attributeValue.create({
    data: {
      attributeId,
      value: input.value,
      colorHex: input.colorHex,
      order: input.order ?? 0,
    },
  });
}

export async function updateAttributeValue(valueId: number, input: UpdateAttributeValueInput) {
  const value = await prisma.attributeValue.findUnique({ where: { id: valueId } });
  if (!value) throw ApiError.notFound("مقدار ویژگی پیدا نشد");

  if (input.value && input.value !== value.value) {
    const duplicate = await prisma.attributeValue.findUnique({
      where: { attributeId_value: { attributeId: value.attributeId, value: input.value } },
    });
    if (duplicate) throw ApiError.conflict("این مقدار قبلاً برای این ویژگی ثبت شده است");
  }

  return prisma.attributeValue.update({ where: { id: valueId }, data: input });
}

export async function deleteAttributeValue(valueId: number): Promise<void> {
  const value = await prisma.attributeValue.findUnique({ where: { id: valueId } });
  if (!value) throw ApiError.notFound("مقدار ویژگی پیدا نشد");

  const usedInVariants = await prisma.productVariantAttributeValue.count({
    where: { attributeValueId: valueId },
  });
  if (usedInVariants > 0) {
    throw ApiError.conflict("این مقدار در حال استفاده توسط تنوع‌های محصول است و قابل حذف نیست");
  }

  await prisma.attributeValue.delete({ where: { id: valueId } });
}
