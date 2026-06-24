import { slugify, ensureUniqueSlug } from "../src/utils/slug";

describe("utils/slug", () => {
  it("فاصله‌ها را به خط‌تیره تبدیل می‌کند", () => {
    expect(slugify("گوشی موبایل سامسونگ")).toBe("گوشی-موبایل-سامسونگ");
  });

  it("حروف انگلیسی را lowercase می‌کند", () => {
    expect(slugify("Samsung Galaxy S24")).toBe("samsung-galaxy-s24");
  });

  it("نشانه‌گذاری اضافی را حذف و خط‌تیره‌های تکراری را یکی می‌کند", () => {
    expect(slugify("گوشی!! موبایل... سامسونگ")).toBe("گوشی-موبایل-سامسونگ");
  });

  it("ensureUniqueSlug در صورت تکراری‌بودن، پسوند عددی اضافه می‌کند", async () => {
    const taken = new Set(["iphone-15", "iphone-15-2"]);
    const result = await ensureUniqueSlug("iPhone 15", async (s) => taken.has(s));
    expect(result).toBe("iphone-15-3");
  });

  it("ensureUniqueSlug اگر تکراری نباشد، همان base را برمی‌گرداند", async () => {
    const result = await ensureUniqueSlug("Product X", async () => false);
    expect(result).toBe("product-x");
  });
});
