import { prisma } from "../src/lib/prisma";
import { redis } from "../src/lib/redis";
import { invalidateCache } from "../src/lib/cache";
import { getProductBySlugPublic } from "../src/services/catalog/product.service";

describe("کش صفحه‌ی جزئیات محصول (getProductBySlugPublic)", () => {
  let productId: number;
  let slug: string;
  let userId: number;

  beforeAll(async () => {
    if (redis && redis.status !== "ready") {
      const client = redis;
      await new Promise<void>((resolve) => {
        client.once("ready", () => resolve());
        setTimeout(resolve, 2000);
      });
    }

    slug = `product-detail-cache-test-${Date.now()}`;
    const product = await prisma.product.create({
      data: { name: "Product Detail Cache Test", slug, basePrice: 50000, status: "PUBLISHED", pricingMode: "FIXED_IRT" },
    });
    productId = product.id;

    const user = await prisma.user.create({ data: { phone: `0902${Date.now()}`.slice(0, 15), role: "CUSTOMER" } });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.wishlist.deleteMany({ where: { productId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await invalidateCache(`product-detail:slug:${slug}`);
  });

  it("viewCount حتی وقتی داده‌ی محصول از کش می‌آید، همچنان درست افزایش پیدا می‌کند", async () => {
    await getProductBySlugPublic(slug);
    await getProductBySlugPublic(slug); // این یکی باید از کش بیاید

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.viewCount).toBe(2);
  });

  it("وضعیت isWish هر کاربر جدا محاسبه می‌شود، حتی اگر داده‌ی محصول کش شده باشد", async () => {
    const withoutWish = await getProductBySlugPublic(slug, userId);
    expect((withoutWish as { isWish: boolean }).isWish).toBe(false);

    await prisma.wishlist.create({ data: { userId, productId } });

    const withWish = await getProductBySlugPublic(slug, userId);
    expect((withWish as { isWish: boolean }).isWish).toBe(true);
  });
});
