import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { serializeProduct, ProductLike } from "../../utils/serialize";
import { Prisma } from "../../generated/prisma";

const WISHLIST_PRODUCT_INCLUDE = {
  brand: true,
  images: { where: { isMain: true }, take: 1, include: { media: true } },
  categories: { include: { category: true } },
  variants: {
    include: {
      attributeValues: { include: { attributeValue: { include: { attribute: true } } } },
    },
  },
} satisfies Prisma.ProductInclude;

export async function addToWishlist(userId: number, productId: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("محصول پیدا نشد");

  return prisma.wishlist.upsert({
    where: { userId_productId: { userId, productId } },
    create: { userId, productId },
    update: {},
  });
}

export async function removeFromWishlist(userId: number, productId: number): Promise<void> {
  await prisma.wishlist.deleteMany({ where: { userId, productId } });
}

export async function listWishlist(userId: number, page?: number, limit?: number) {
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

  const serializedItems = items.map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    product: serializeProduct(item.product as unknown as Record<string, unknown> & ProductLike),
  }));

  return { items: serializedItems, meta: buildPaginationMeta(total, pagination) };
}

export async function isProductInWishlist(userId: number, productId: number): Promise<boolean> {
  const wishlistItem = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return !!wishlistItem;
}
