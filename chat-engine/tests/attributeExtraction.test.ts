import { parseProductQuery } from "../src/engine/productMatcher/attributeExtraction";

describe("parseProductQuery", () => {
  it("رنگ، سایز عددی و نام محصول را از یک جمله جدا می‌کند", () => {
    const parsed = parseProductQuery("کفش مجلسی قهوه‌ای سایز ۴۲ دارید؟");

    expect(parsed.color).toBe("قهوه‌ای");
    expect(parsed.size).toBe("42");
    expect(parsed.nameTerms).toContain("کفش");
    expect(parsed.nameTerms).toContain("مجلسی");
  });

  it("سایز بدون کلمه‌ی «سایز» هم تشخیص داده می‌شود اگر در بازه‌ی معقول باشد", () => {
    const parsed = parseProductQuery("کتونی 43 مشکی می‌خوام");
    expect(parsed.size).toBe("43");
    expect(parsed.color).toBe("مشکی");
  });

  it("عددهای خارج از بازه‌ی سایز را نادیده می‌گیرد", () => {
    const parsed = parseProductQuery("قیمتش 99 تومنه؟");
    expect(parsed.size).toBeUndefined();
  });

  it("سایز حرفی (XL) را تشخیص می‌دهد", () => {
    const parsed = parseProductQuery("تیشرت سایز XL دارید؟");
    expect(parsed.size).toBe("XL");
  });

  it("بدون رنگ/سایز فقط nameTerms برمی‌گرداند", () => {
    const parsed = parseProductQuery("کوله پشتی مسافرتی");
    expect(parsed.color).toBeUndefined();
    expect(parsed.size).toBeUndefined();
    expect(parsed.nameTerms.length).toBeGreaterThan(0);
  });
});
