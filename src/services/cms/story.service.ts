import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { CreateStoryInput, UpdateStoryInput } from "../../validations/story.validation";
import { syncUrlWithMediaId } from "../../utils/mediaSync";
import { getOrSetCache, invalidateCache } from "../../lib/cache";

export async function createStory(input: CreateStoryInput) {
  const { productIds, ...rest } = syncUrlWithMediaId(
    syncUrlWithMediaId(input, "coverImageMediaId", "coverImageUrl"),
    "videoMediaId",
    "videoUrl"
  );
  const created = await prisma.story.create({
    data: {
      ...rest,
      order: rest.order ?? 0,
      products: productIds?.length ? { create: productIds.map((productId) => ({ productId })) } : undefined,
    },
    include: { products: { include: { product: { select: { id: true, name: true, slug: true } } } } },
  });
  await invalidateCache("active-stories");
  return created;
}

export async function updateStory(id: number, input: UpdateStoryInput) {
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) throw ApiError.notFound("استوری پیدا نشد");

  const { productIds, ...rest } = syncUrlWithMediaId(
    syncUrlWithMediaId(input, "coverImageMediaId", "coverImageUrl"),
    "videoMediaId",
    "videoUrl"
  );

  await prisma.story.update({ where: { id }, data: rest });

  if (productIds !== undefined) {
    await prisma.storyProduct.deleteMany({ where: { storyId: id } });
    if (productIds.length > 0) {
      await prisma.storyProduct.createMany({ data: productIds.map((productId) => ({ storyId: id, productId })), skipDuplicates: true });
    }
  }

  await invalidateCache("active-stories");
  return prisma.story.findUniqueOrThrow({ where: { id }, include: { products: { include: { product: { select: { id: true, name: true, slug: true } } } } } });
}

export async function deleteStory(id: number): Promise<void> {
  const story = await prisma.story.findUnique({ where: { id } });
  if (!story) throw ApiError.notFound("استوری پیدا نشد");
  await prisma.story.delete({ where: { id } });
  await invalidateCache("active-stories");
}

// ----------------------------------------------------------------------------
// TTL کوتاه ۶۰ ثانیه‌ای علاوه بر invalidate روی هر تغییر: چون فیلتر
// `expiresAt: { gt: now }` است، حتی بدون هیچ تغییری در دیتابیس، مجموعه‌ی
// «استوری‌های فعال» با گذر زمان (وقتی یک استوری منقضی می‌شود) خودش تغییر
// می‌کند — invalidate-on-write به‌تنهایی این حالت را پوشش نمی‌دهد.
// ----------------------------------------------------------------------------
export async function listActiveStories() {
  return getOrSetCache("active-stories:list", 60, async () => {
    const now = new Date();
    const stories = await prisma.story.findMany({
      where: { isActive: true, expiresAt: { gt: now } },
      orderBy: { order: "asc" },
      include: { products: { include: { product: { include: { images: { where: { isMain: true }, take: 1 } } } } } },
    });

    return stories.map((story, index) => ({
      ...story,
      nextId: stories[index + 1]?.id ?? null,
      prevId: index > 0 ? stories[index - 1].id : null,
    }));
  });
}

export async function listStoriesAdmin(query: { page?: number; limit?: number }) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const [items, total] = await Promise.all([
    prisma.story.findMany({ orderBy: { createdAt: "desc" }, skip: pagination.skip, take: pagination.take, include: { products: true } }),
    prisma.story.count(),
  ]);
  return { items, meta: buildPaginationMeta(total, pagination) };
}
