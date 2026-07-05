import { computeProductEffectivePrice } from "../src/utils/pricing";

describe("utils/pricing computeProductEffectivePrice", () => {
  it("بدون تخفیف، قیمت نهایی همان basePrice + priceAdjustment است", () => {
    const result = computeProductEffectivePrice(100000, 0, null, null, null, null);
    expect(result).toEqual({
      originalPrice: 100000,
      unitPrice: 100000,
      discountAmount: 0,
      isDiscounted: false,
    });
  });

  it("priceAdjustment به قیمت پایه اضافه می‌شود", () => {
    const result = computeProductEffectivePrice(100000, 20000, null, null, null, null);
    expect(result.originalPrice).toBe(120000);
    expect(result.unitPrice).toBe(120000);
  });

  it("تخفیف درصدی را درست محاسبه می‌کند", () => {
    const result = computeProductEffectivePrice(100000, 0, "PERCENT", 20, null, null);
    expect(result.unitPrice).toBe(80000);
    expect(result.discountAmount).toBe(20000);
    expect(result.isDiscounted).toBe(true);
  });

  it("تخفیف مبلغ ثابت را درست محاسبه می‌کند", () => {
    const result = computeProductEffectivePrice(100000, 0, "FIXED", 15000, null, null);
    expect(result.unitPrice).toBe(85000);
    expect(result.discountAmount).toBe(15000);
  });

  it("تخفیفی که هنوز شروع نشده را نادیده می‌گیرد", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const result = computeProductEffectivePrice(100000, 0, "PERCENT", 50, tomorrow, null);
    expect(result.isDiscounted).toBe(false);
    expect(result.unitPrice).toBe(100000);
  });

  it("تخفیفی که منقضی شده را نادیده می‌گیرد", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = computeProductEffectivePrice(100000, 0, "PERCENT", 50, null, yesterday);
    expect(result.isDiscounted).toBe(false);
  });

  it("تخفیف مبلغ ثابت بزرگ‌تر از قیمت را به صفر محدود می‌کند", () => {
    const result = computeProductEffectivePrice(10000, 0, "FIXED", 50000, null, null);
    expect(result.unitPrice).toBe(0);
  });
});
