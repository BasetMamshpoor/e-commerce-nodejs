import { extractSearchTerms } from "../src/engine/productMatcher/productSearch";
import { computeEffectivePrice, formatToman } from "../src/utils/pricing";

describe("productSearch: extractSearchTerms", () => {
  it("کلمات توقف (stopwords) را حذف می‌کند", () => {
    const terms = extractSearchTerms("کراپ مشکی دارید؟");
    expect(terms).toContain("کراپ");
    expect(terms).not.toContain("دارید");
  });

  it("کلمات خیلی کوتاه (زیر ۲ حرف) را حذف می‌کند", () => {
    const terms = extractSearchTerms("ی کراپ");
    expect(terms).not.toContain("ی");
    expect(terms).toContain("کراپ");
  });

  it("برای متن خالی آرایه‌ی خالی برمی‌گرداند", () => {
    expect(extractSearchTerms("")).toEqual([]);
  });
});

describe("pricing: computeEffectivePrice", () => {
  it("بدون تخفیف، قیمت اصلی را برمی‌گرداند", () => {
    const result = computeEffectivePrice(100000, 0, null, null);
    expect(result).toEqual({ originalPrice: 100000, unitPrice: 100000, discountAmount: 0, isDiscounted: false });
  });

  it("تخفیف درصدی را درست محاسبه می‌کند", () => {
    const result = computeEffectivePrice(100000, 0, "PERCENT", 20);
    expect(result.unitPrice).toBe(80000);
    expect(result.isDiscounted).toBe(true);
  });

  it("تخفیف مبلغ ثابت را درست محاسبه می‌کند", () => {
    const result = computeEffectivePrice(100000, 0, "FIXED", 15000);
    expect(result.unitPrice).toBe(85000);
  });

  it("priceAdjustment تنوع را به قیمت پایه اضافه می‌کند", () => {
    const result = computeEffectivePrice(100000, 20000, null, null);
    expect(result.originalPrice).toBe(120000);
  });

  it("قیمت هرگز منفی نمی‌شود", () => {
    const result = computeEffectivePrice(10000, 0, "FIXED", 50000);
    expect(result.unitPrice).toBe(0);
  });
});

describe("pricing: formatToman", () => {
  it("عدد را با جداکننده‌ی هزارگان و پسوند تومان نمایش می‌دهد", () => {
    expect(formatToman(1234567)).toContain("تومان");
  });
});
