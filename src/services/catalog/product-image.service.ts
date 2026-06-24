import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";

export async function addProductImage(
  productId: string,
  input: { mediaId: string; order?: number; isMain?: boolean }
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound("محصول پیدا نشد");

  if (input.isMain) {
    await prisma.productImage.updateMany({ where: { productId }, data: { isMain: false } });
  }

  return prisma.productImage.create({
    data: {
      productId,
      mediaId: input.mediaId,
      order: input.order ?? 0,
      isMain: input.isMain ?? false,
    },
  });
}

export async function removeProductImage(productId: string, imageId: string): Promise<void> {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) {
    throw ApiError.notFound("تصویر پیدا نشد");
  }
  await prisma.productImage.delete({ where: { id: imageId } });
}
