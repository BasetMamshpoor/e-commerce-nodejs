import { getOrSetCache, invalidateCache } from "../src/lib/cache";
import { redis } from "../src/lib/redis";
import { prisma } from "../src/lib/prisma";
import { createCategory, updateCategory, deleteCategory, getCategoryTree } from "../src/services/catalog/category.service";

describe("getOrSetCache / invalidateCache", () => {
  const key = `test-cache-${Date.now()}`;

  beforeAll(async () => {
    if (redis && redis.status !== "ready") {
      const client = redis;
      await new Promise<void>((resolve) => {
        client.once("ready", () => resolve());
        setTimeout(resolve, 2000);
      });
    }
  });

  afterEach(async () => {
    await invalidateCache(key);
  });

  it("بار دوم مقدار کش‌شده را برمی‌گرداند و fetcher دوباره صدا زده نمی‌شود", async () => {
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return { value: "hello", calls };
    };

    const first = await getOrSetCache(key, 60, fetcher);
    const second = await getOrSetCache(key, 60, fetcher);

    expect(first).toEqual({ value: "hello", calls: 1 });
    expect(second).toEqual({ value: "hello", calls: 1 }); // از کش آمده، calls افزایش پیدا نکرده
    expect(calls).toBe(1);
  });

  it("بعد از invalidateCache دوباره fetcher صدا زده می‌شود", async () => {
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return calls;
    };

    await getOrSetCache(key, 60, fetcher);
    await invalidateCache(key);
    const afterInvalidate = await getOrSetCache(key, 60, fetcher);

    expect(afterInvalidate).toBe(2);
  });
});

describe("getCategoryTree caching", () => {
  let categoryId: number;

  afterAll(async () => {
    await prisma.category.deleteMany({ where: { id: categoryId } }).catch(() => {});
    await invalidateCache("category-tree");
  });

  it("ساخت دسته‌بندی جدید بلافاصله در درخت دیده می‌شود (کش باطل می‌شود)", async () => {
    const treeBefore = await getCategoryTree(true);
    const countBefore = treeBefore.length;

    const created = await createCategory({ name: `Cache Test Cat ${Date.now()}` } as never);
    categoryId = created.id;

    const treeAfter = await getCategoryTree(true);
    expect(treeAfter.length).toBe(countBefore + 1);
    expect(treeAfter.some((c) => c.id === categoryId)).toBe(true);
  });

  it("ویرایش دسته‌بندی هم بلافاصله در درخت دیده می‌شود", async () => {
    const newName = `Renamed ${Date.now()}`;
    await updateCategory(categoryId, { name: newName } as never);
    const tree = await getCategoryTree(true);
    expect(tree.find((c) => c.id === categoryId)?.name).toBe(newName);
  });

  it("حذف دسته‌بندی هم بلافاصله در درخت دیده می‌شود", async () => {
    await deleteCategory(categoryId);
    const tree = await getCategoryTree(true);
    expect(tree.some((c) => c.id === categoryId)).toBe(false);
  });
});
