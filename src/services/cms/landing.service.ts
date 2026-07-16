import { prisma } from "../../lib/prisma";

export async function getLandingPageData() {
  const now = new Date();

  const [banners, popups, stories, categories, latestBlogPosts, brands, featuredProducts, topSellingProducts, topRatedProducts, flashSales] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
      orderBy: { order: "asc" },
    }),
    prisma.popup.findMany({
      where: { isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
    }),
    prisma.story.findMany({
      where: { isActive: true, expiresAt: { gt: now } },
      orderBy: { order: "asc" },
      include: { products: { include: { product: { select: { id: true, name: true, slug: true } } } } },
    }),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { order: "asc" },
      include: { children: { where: { isActive: true } } },
    }),
    prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, excerpt: true, coverImageUrl: true, publishedAt: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 12,
    }),
    prisma.product.findMany({
      where: { status: "PUBLISHED", isFeatured: true, isInStock: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { brand: true, images: { where: { isMain: true }, take: 1, include: { media: true } } },
    }),
    prisma.product.findMany({
      where: { status: "PUBLISHED", isInStock: true },
      orderBy: { viewCount: "desc" },
      take: 10,
      include: { brand: true, images: { where: { isMain: true }, take: 1, include: { media: true } } },
    }),
    prisma.product.findMany({
      where: { status: "PUBLISHED", isInStock: true },
      orderBy: { avgRating: "desc" },
      take: 10,
      include: { brand: true, images: { where: { isMain: true }, take: 1, include: { media: true } } },
    }),
    prisma.product.findMany({
      where: { status: "PUBLISHED", isInStock: true, hasActiveDiscount: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { brand: true, images: { where: { isMain: true }, take: 1, include: { media: true } } },
    }),
  ]);

  const settings = await prisma.setting.findMany();
  const settingsMap = settings.reduce<Record<string, string>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  return {
    sections: [
      { type: "banners", data: banners },
      { type: "popups", data: popups },
      { type: "stories", data: stories.map((story, index) => ({
        ...story,
        nextId: stories[index + 1]?.id ?? null,
        prevId: index > 0 ? stories[index - 1].id : null,
      })) },
      { type: "categories", data: categories },
      { type: "featured_products", label: "محصولات ویژه", data: featuredProducts },
      { type: "latest_products", label: "جدیدترین محصولات", data: topSellingProducts },
      { type: "top_rated_products", label: "محصولات پرامتیاز", data: topRatedProducts },
      { type: "flash_sales", label: "تخفیف‌های ویژه", data: flashSales },
      { type: "latest_blog_posts", label: "آخرین مقالات", data: latestBlogPosts },
      { type: "popular_brands", data: brands },
    ],
    settings: settingsMap,
  };
}
