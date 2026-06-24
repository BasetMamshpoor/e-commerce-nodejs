import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import {
  CreateDiscountCodeInput,
  UpdateDiscountCodeInput,
  AdminListDiscountCodesQuery,
} from "../../validations/discount.validation";
import { DiscountCode } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// کد تخفیف با تمام محدودیت‌های درخواستی — آیتم ۴
// ----------------------------------------------------------------------------

async function assertReferencesExist(input: {
  productIds?: string[];
  categoryIds?: string[];
  userIds?: string[];
}): Promise<void> {
  if (input.productIds && input.productIds.length > 0) {
    const count = await prisma.product.count({ where: { id: { in: input.productIds } } });
    if (count !== input.productIds.length) {
      throw ApiError.badRequest("یک یا چند محصول انتخاب‌شده معتبر نیست");
    }
  }
  if (input.categoryIds && input.categoryIds.length > 0) {
    const count = await prisma.category.count({ where: { id: { in: input.categoryIds } } });
    if (count !== input.categoryIds.length) {
      throw ApiError.badRequest("یک یا چند دسته‌بندی انتخاب‌شده معتبر نیست");
    }
  }
  if (input.userIds && input.userIds.length > 0) {
    const count = await prisma.user.count({ where: { id: { in: input.userIds } } });
    if (count !== input.userIds.length) {
      throw ApiError.badRequest("یک یا چند کاربر انتخاب‌شده معتبر نیست");
    }
  }
}

async function assertCodeFree(code: string, excludeId?: string): Promise<void> {
  const existing = await prisma.discountCode.findUnique({ where: { code } });
  if (existing && existing.id !== excludeId) {
    throw ApiError.conflict("این کد تخفیف قبلاً ثبت شده است");
  }
}

export async function createDiscountCode(
  input: CreateDiscountCodeInput
): Promise<DiscountCode> {
  const code = input.code.toUpperCase();
  await assertCodeFree(code);
  await assertReferencesExist(input);

  return prisma.discountCode.create({
    data: {
      code,
      type: input.type,
      value: input.value,
      maxDiscountAmount: input.maxDiscountAmount,
      minCartAmount: input.minCartAmount,
      maxUsage: input.maxUsage,
      maxUsagePerUser: input.maxUsagePerUser,
      startsAt: input.startsAt,
      expiresAt: input.expiresAt,
      isActive: input.isActive,
      products: { create: input.productIds.map((productId) => ({ productId })) },
      categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) },
      users: { create: input.userIds.map((userId) => ({ userId })) },
    },
  });
}

export async function updateDiscountCode(
  id: string,
  input: UpdateDiscountCodeInput
): Promise<DiscountCode> {
  const existing = await prisma.discountCode.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("کد تخفیف پیدا نشد");

  await assertReferencesExist(input);

  let code: string | undefined;
  if (input.code) {
    code = input.code.toUpperCase();
    await assertCodeFree(code, id);
  }

  const { productIds, categoryIds, userIds, ...rest } = input;

  return prisma.discountCode.update({
    where: { id },
    data: {
      ...rest,
      code,
      ...(productIds
        ? { products: { deleteMany: {}, create: productIds.map((productId) => ({ productId })) } }
        : {}),
      ...(categoryIds
        ? {
            categories: {
              deleteMany: {},
              create: categoryIds.map((categoryId) => ({ categoryId })),
            },
          }
        : {}),
      ...(userIds
        ? { users: { deleteMany: {}, create: userIds.map((userId) => ({ userId })) } }
        : {}),
    },
  });
}

export async function deleteDiscountCode(id: string): Promise<void> {
  const discountCode = await prisma.discountCode.findUnique({ where: { id } });
  if (!discountCode) throw ApiError.notFound("کد تخفیف پیدا نشد");

  if (discountCode.usageCount > 0) {
    throw ApiError.conflict(
      "این کد تخفیف قبلاً استفاده شده و قابل حذف نیست؛ به‌جای حذف، آن را غیرفعال (isActive=false) کنید"
    );
  }

  await prisma.discountCode.delete({ where: { id } });
}

const ADMIN_DETAIL_INCLUDE = {
  products: { include: { product: { select: { id: true, name: true, slug: true } } } },
  categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
  users: { include: { user: { select: { id: true, fullName: true, email: true, phone: true } } } },
};

export async function getDiscountCodeById(id: string) {
  const discountCode = await prisma.discountCode.findUnique({
    where: { id },
    include: ADMIN_DETAIL_INCLUDE,
  });
  if (!discountCode) throw ApiError.notFound("کد تخفیف پیدا نشد");
  return discountCode;
}

export async function listDiscountCodesAdmin(query: AdminListDiscountCodesQuery) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });

  const where = {
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.search ? { code: { contains: query.search.toUpperCase() } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.discountCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.discountCode.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}
