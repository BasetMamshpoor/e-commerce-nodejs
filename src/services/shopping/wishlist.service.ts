import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { serializeProduct, ProductLike } from "../../utils/serialize";
import { Product } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// لیست محصولات مورد علاقه — آیتم ۵.
// محصول هر آیتم به‌صورت کامل (با variants/images) برمی‌گردد تا فرانت بتواند
// مستقیم از همین صفحه دکمه‌ی «افزودن به سبد» بگذارد، بدون نیاز به رفتن به
// صفحه‌ی محصول.
// ----------------------------------------------------------------------------

const WISHLIST_PRODUCT_INCLUDE = {
  brand: { include: { logo: true } },
  images: { include: { media: true }, orderBy: { order: "asc" as const } },
  categories: { include: { category: { include: { image: true } } } },
  variants: {
    include: {
      images: { include: { media: true }, orderBy: { order: "asc" as const } },
      attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
    },
  },
};

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("محصول پیدا نشد");

  return prisma.wishlist.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  await prisma.wishlist.deleteMany({ where: { userId, productId } });
}

export async function listWishlist(userId: string, page?: number, limit?: number) {
  const pagination = parsePagination({ page, limit });

  const [items, total] = await Promise.all([
    prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: { product: { include: WISHLIST_PRODUCT_INCLUDE } },
    }),
    prisma.wishlist.count({ where: { userId } }),
  ]);

  const serializedItems = (
    items as unknown as { id: string; createdAt: Date; product: Product & ProductLike }[]
  ).map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    product: serializeProduct(item.product),
  }));

  return { items: serializedItems, meta: buildPaginationMeta(total, pagination) };
}
