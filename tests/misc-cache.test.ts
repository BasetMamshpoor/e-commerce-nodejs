import { prisma } from "../src/lib/prisma";
import { redis } from "../src/lib/redis";
import { invalidateCache } from "../src/lib/cache";
import { createBlogPost, getBlogPostBySlugPublic, listBlogPostsPublic } from "../src/services/blog/blog-post.service";
import { createBrand, updateBrand, listBrands } from "../src/services/catalog/brand.service";
import { upsertSetting, getPublicSettings } from "../src/services/settings/settings.service";
import { createStory, deleteStory, listActiveStories } from "../src/services/cms/story.service";
import { getLandingPageData } from "../src/services/cms/landing.service";

async function waitForRedisReady() {
  if (redis && redis.status !== "ready") {
    const client = redis;
    await new Promise<void>((resolve) => {
      client.once("ready", () => resolve());
      setTimeout(resolve, 2000);
    });
  }
}

describe("کش پست‌های وبلاگ", () => {
  let postId: number;
  let slug: string;
  let uniqueTitle: string;

  beforeAll(async () => {
    await waitForRedisReady();
    slug = `blog-cache-test-${Date.now()}`;
    uniqueTitle = `Blog Cache Test ${Date.now()}`;
    const post = await createBlogPost(undefined, {
      title: uniqueTitle, slug, content: "content", status: "PUBLISHED",
    } as never);
    postId = post.id;
  });

  afterAll(async () => {
    await prisma.blogPost.deleteMany({ where: { id: postId } });
    await invalidateCache("blog-post");
  });

  it("viewCount حتی وقتی پست از کش می‌آید، همچنان افزایش پیدا می‌کند", async () => {
    await getBlogPostBySlugPublic(slug);
    await getBlogPostBySlugPublic(slug);
    const post = await prisma.blogPost.findUnique({ where: { id: postId } });
    expect(post?.viewCount).toBe(2);
  });

  it("لیست عمومی پست‌ها بدون خطا کار می‌کند و پست تازه را شامل می‌شود", async () => {
    await invalidateCache("blog-post-list");
    const list = await listBlogPostsPublic({ search: uniqueTitle } as never);
    expect(list.meta.total).toBe(1);
  });
});

describe("کش برندها", () => {
  let brandId: number;

  afterAll(async () => {
    await prisma.brand.deleteMany({ where: { id: brandId } });
    await invalidateCache("brand");
  });

  it("بعد از ساخت برند جدید، بلافاصله در لیست دیده می‌شود (invalidate روی write)", async () => {
    const before = await listBrands(true);
    const created = await createBrand({ name: `Brand Cache Test ${Date.now()}` } as never);
    brandId = created.id;

    const after = await listBrands(true);
    expect(after.length).toBe(before.length + 1);
  });

  it("ویرایش برند هم بلافاصله در لیست دیده می‌شود", async () => {
    const newName = `Renamed Brand ${Date.now()}`;
    await updateBrand(brandId, { name: newName } as never);
    const list = await listBrands(true);
    expect(list.find((b) => b.id === brandId)?.name).toBe(newName);
  });
});

describe("کش تنظیمات عمومی", () => {
  const key = `cache_test_setting_${Date.now()}`;

  afterAll(async () => {
    await prisma.setting.deleteMany({ where: { key } });
    await invalidateCache("public-settings");
  });

  it("بعد از ثبت یک تنظیم جدید، بلافاصله در خروجی عمومی دیده می‌شود", async () => {
    await upsertSetting(key, { value: "hello", type: "string" } as never);
    const settings = await getPublicSettings();
    expect(settings[key]).toBe("hello");
  });
});

describe("کش استوری‌های فعال", () => {
  let storyId: number;

  it("بعد از ساخت استوری جدید، بلافاصله در لیست فعال دیده می‌شود", async () => {
    const before = await listActiveStories();
    const created = await createStory({
      title: "Story Cache Test",
      coverImageUrl: "https://example.com/x.jpg",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    } as never);
    storyId = created.id;

    const after = await listActiveStories();
    expect(after.length).toBe(before.length + 1);
  });

  it("بعد از حذف استوری، بلافاصله از لیست فعال حذف می‌شود", async () => {
    await deleteStory(storyId);
    const after = await listActiveStories();
    expect(after.some((s) => s.id === storyId)).toBe(false);
  });
});

describe("کش صفحه‌ی لندینگ", () => {
  afterAll(async () => {
    await invalidateCache("landing-page");
  });

  it("بدون خطا داده برمی‌گرداند و ساختار sections را دارد", async () => {
    const data = await getLandingPageData();
    expect(Array.isArray(data.sections)).toBe(true);
    expect(data.sections.length).toBeGreaterThan(0);
  });

  it("درخواست دوم از کش می‌آید (نتیجه‌ی یکسان)", async () => {
    const first = await getLandingPageData();
    const second = await getLandingPageData();
    expect(JSON.parse(JSON.stringify(first))).toEqual(JSON.parse(JSON.stringify(second)));
  });
});
