import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";

export async function createStory(input: { title: string; coverImageMediaId: number; videoMediaId?: number; expiresAt: Date; order?: number; productIds?: number[] }) {
  return prisma.story.create({
    data: {
      title: input.title,
      coverImageMediaId: input.coverImageMediaId,
      videoMediaId: input.videoMediaId,
      expiresAt: input.expiresAt,
      order: input.order ?? 0,
      products: input.productIds?.length ? { create: input.productIds.map((productId) => ({ productId })) } : undefined,
    },
    include: { products: { include: { product: { select: { id: true, name: true, slug: true } } } } },
  });
}

export async function updateStory(id: number, input: Partial<{ title: string; coverImageMediaId: number; videoMediaId?: number; expiresAt: Date; order: number; isActive: boolean; productIds: number[] }>) {
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) throw ApiError.notFound("استوری پیدا نشد");

  const { productIds, ...rest } = input;

  await prisma.story.update({ where: { id }, data: rest });

  if (productIds !== undefined) {
    await prisma.storyProduct.deleteMany({ where: { storyId: id } });
    if (productIds.length > 0) {
      await prisma.storyProduct.createMany({ data: productIds.map((productId) => ({ storyId: id, productId })), skipDuplicates: true });
    }
  }

  return prisma.story.findUniqueOrThrow({ where: { id }, include: { products: { include: { product: { select: { id: true, name: true, slug: true } } } } } });
}

export async function deleteStory(id: number): Promise<void> {
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) throw ApiError.notFound("استوری پیدا نشد");
  await prisma.story.delete({ where: { id } });
}

export async function listActiveStories() {
  const now = new Date();
  const stories = await prisma.story.findMany({
    where: { isActive: true, expiresAt: { gt: now } },
    orderBy: { order: "asc" },
    include: { coverImage: true, video: true, products: { include: { product: { include: { images: { where: { isMain: true }, take: 1 } } } } } },
  });

  return stories.map((story, index) => ({
    ...story,
    nextId: stories[index + 1]?.id ?? null,
    prevId: index > 0 ? stories[index - 1].id : null,
  }));
}

export async function listStoriesAdmin(query: { page?: number; limit?: number }) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const [items, total] = await Promise.all([
    prisma.story.findMany({ orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take, include: { products: true } }),
    prisma.story.count(),
  ]);
  return { items, meta: buildPaginationMeta(total, pagination) };
}
