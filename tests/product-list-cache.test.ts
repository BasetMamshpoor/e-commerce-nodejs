import { prisma } from "../src/lib/prisma";
import { redis } from "../src/lib/redis";
import { invalidateCache } from "../src/lib/cache";
import { listProductsStorefront, getStorefrontFilters } from "../src/services/catalog/product-query.service";

describe("کش لیست محصولات فروشگاه (listProductsStorefront)", () => {
  const productIds: number[] = [];
  const slugPrefix = `cache-list-test-${Date.now()}`;

  beforeAll(async () => {
    if (redis && redis.status !== "ready") {
      const client = redis;
      await new Promise<void>((resolve) => {
        client.once("ready", () => resolve());
        setTimeout(resolve, 2000);
      });
    }

    const p1 = await prisma.product.create({
      data: {
        name: `${slugPrefix}-A`, slug: `${slugPrefix}-a`, basePrice: 10000,
        status: "PUBLISHED", pricingMode: "FIXED_IRT",
      },
    });
    productIds.push(p1.id);
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { id: { in: productIds } } });
    await invalidateCache("product-list");
    await invalidateCache("product-filters");
  });

  it("درخواست دوم با پارامترهای یکسان از کش می‌آید (محصول جدید هنوز دیده نمی‌شود)", async () => {
    const query = { search: slugPrefix } as never;

    const first = await listProductsStorefront(query);
    expect(first.meta.total).toBe(1);

    const p2 = await prisma.product.create({
      data: {
        name: `${slugPrefix}-B`, slug: `${slugPrefix}-b`, basePrice: 20000,
        status: "PUBLISHED", pricingMode: "FIXED_IRT",
      },
    });
    productIds.push(p2.id);

    // چون هنوز کش منقضی نشده، همچنان باید همون نتیجه‌ی قبلی (۱ محصول) برگرده
    const second = await listProductsStorefront(query);
    expect(second.meta.total).toBe(1);
  });

  it("بعد از باطل‌شدن کش (شبیه‌سازی پایان TTL)، محصول جدید هم دیده می‌شود", async () => {
    const query = { search: slugPrefix } as never;
    await invalidateCache("product-list");

    const afterInvalidate = await listProductsStorefront(query);
    expect(afterInvalidate.meta.total).toBe(2);
  });

  it("پارامترهای متفاوت (مثلاً page متفاوت) کش جداگانه دارند و با هم قاطی نمی‌شوند", async () => {
    const queryPage1 = { search: slugPrefix, page: 1 } as never;
    const queryPage2 = { search: slugPrefix, page: 2, limit: 1 } as never;

    const resultPage1 = await listProductsStorefront(queryPage1);
    const resultPage2 = await listProductsStorefront(queryPage2);

    expect(resultPage1.items.length).toBeGreaterThan(0);
    // صفحه‌ی دوم با limit=1 باید حداکثر یک آیتم برگرداند (کش این دو کوئری با هم قاطی نشده)
    expect(resultPage2.items.length).toBeLessThanOrEqual(1);
  });
});

describe("کش فیلترهای فروشگاه (getStorefrontFilters)", () => {
  afterAll(async () => {
    await invalidateCache("product-filters");
  });

  it("دو بار فراخوانی با همان دسته‌بندی، بدون خطا و با ساختار یکسان برمی‌گردد", async () => {
    const first = await getStorefrontFilters(undefined);
    const second = await getStorefrontFilters(undefined);
    // نکته: چون کش از JSON.stringify/parse رد می‌شود، فیلدهای Date در
    // نتیجه‌ی کش‌شده به رشته‌ی ISO تبدیل می‌شوند (نه Date واقعی) — این
    // دقیقاً همان چیزی است که یک پاسخ JSON API هم تولید می‌کند (تنها
    // مصرف‌کننده‌ی واقعی این تابع)، پس مقایسه را بعد از سریالایز یکسان
    // انجام می‌دهیم تا این تفاوتِ بی‌اهمیت باعث fail کاذب نشود.
    expect(JSON.parse(JSON.stringify(first))).toEqual(JSON.parse(JSON.stringify(second)));
  });
});
