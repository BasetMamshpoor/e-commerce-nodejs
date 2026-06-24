import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";

// ----------------------------------------------------------------------------
// لیست محصولات مورد علاقه — آیتم ۵
// ----------------------------------------------------------------------------

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
      include: {
        product: {
          include: {
            brand: true,
            images: { where: { isMain: true }, take: 1, include: { media: true } },
          },
        },
      },
    }),
    prisma.wishlist.count({ where: { userId } }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}
