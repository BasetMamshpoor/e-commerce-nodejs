import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

const MAX_COMPARISON_ITEMS = 4;

export async function getComparisonByProductIds(productIds: number[]) {
  if (productIds.length < 1 || productIds.length > MAX_COMPARISON_ITEMS) {
    throw ApiError.badRequest(`حداقل ۱ و حداکثر ${MAX_COMPARISON_ITEMS} محصول را ارسال کنید`);
  }

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "PUBLISHED" },
    include: {
      brand: true,
      categories: { include: { category: true } },
      images: { where: { isMain: true }, take: 1 },
      variants: {
        where: { isActive: true },
        include: {
          attributeValues: {
            include: { attributeValue: { include: { attribute: true } } },
          },
        },
      },
    },
  });

  return { items: products.map((product) => ({ product })) };
}
