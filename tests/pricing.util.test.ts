import { computeVariantEffectivePrice } from "../src/utils/pricing";

const base = {
  price: 100000,
  discountType: null as "PERCENT" | "FIXED" | null,
  discountValue: null as number | null,
  discountStartAt: null as Date | null,
  discountEndAt: null as Date | null,
};

describe("utils/pricing computeVariantEffectivePrice", () => {
  it("بدون تخفیف، قیمت نهایی همان قیمت اصلی است", () => {
    const result = computeVariantEffectivePrice(base);
    expect(result).toEqual({
      originalPrice: 100000,
      unitPrice: 100000,
      discountAmount: 0,
      isDiscounted: false,
    });
  });

  it("تخفیف درصدی را درست محاسبه می‌کند", () => {
    const result = computeVariantEffectivePrice({
      ...base,
      discountType: "PERCENT",
      discountValue: 20,
    });
    expect(result.unitPrice).toBe(80000);
    expect(result.discountAmount).toBe(20000);
    expect(result.isDiscounted).toBe(true);
  });

  it("تخفیف مبلغ ثابت را درست محاسبه می‌کند", () => {
    const result = computeVariantEffectivePrice({
      ...base,
      discountType: "FIXED",
      discountValue: 15000,
    });
    expect(result.unitPrice).toBe(85000);
    expect(result.discountAmount).toBe(15000);
  });

  it("تخفیفی که هنوز شروع نشده را نادیده می‌گیرد", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const result = computeVariantEffectivePrice({
      ...base,
      discountType: "PERCENT",
      discountValue: 50,
      discountStartAt: tomorrow,
    });
    expect(result.isDiscounted).toBe(false);
    expect(result.unitPrice).toBe(100000);
  });

  it("تخفیفی که منقضی شده را نادیده می‌گیرد", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = computeVariantEffectivePrice({
      ...base,
      discountType: "PERCENT",
      discountValue: 50,
      discountEndAt: yesterday,
    });
    expect(result.isDiscounted).toBe(false);
  });

  it("تخفیف مبلغ ثابت بزرگ‌تر از قیمت را به صفر محدود می‌کند (نه عدد منفی)", () => {
    const result = computeVariantEffectivePrice({
      ...base,
      price: 10000,
      discountType: "FIXED",
      discountValue: 50000,
    });
    expect(result.unitPrice).toBe(0);
  });
});
