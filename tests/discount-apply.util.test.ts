import {
  isItemEligible,
  calculateDiscountAmount,
} from "../src/services/discount/discount-apply.service";

function makeCode(overrides: Partial<{
  type: "PERCENT" | "FIXED";
  value: number;
  maxDiscountAmount: number | null;
  products: { productId: number }[];
  categories: { categoryId: number }[];
}> = {}) {
  return {
    id: 1,
    code: "TEST",
    type: overrides.type ?? "PERCENT",
    value: overrides.value ?? 10,
    maxDiscountAmount: overrides.maxDiscountAmount ?? null,
    minCartAmount: null,
    maxUsage: null,
    maxUsagePerUser: null,
    usageCount: 0,
    startsAt: null,
    expiresAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    products: overrides.products ?? [],
    categories: overrides.categories ?? [],
    users: [],
  };
}

describe("discount-apply: isItemEligible", () => {
  it("بدون هیچ محدودیت محصول/دسته، همه‌چیز واجد شرایط است", () => {
    const code = makeCode();
    expect(isItemEligible(code, { productId: 1, categoryIds: [1] })).toBe(true);
  });

  it("با محدودیت محصول، فقط محصول مجاز واجد شرایط است", () => {
    const code = makeCode({ products: [{ productId: 1 }] });
    expect(isItemEligible(code, { productId: 1, categoryIds: [] })).toBe(true);
    expect(isItemEligible(code, { productId: 2, categoryIds: [] })).toBe(false);
  });

  it("با محدودیت دسته، اگر یکی از دسته‌های محصول مطابقت داشت کافی است", () => {
    const code = makeCode({ categories: [{ categoryId: 1 }] });
    expect(isItemEligible(code, { productId: 1, categoryIds: [2, 1] })).toBe(true);
    expect(isItemEligible(code, { productId: 1, categoryIds: [3] })).toBe(false);
  });

  it("اگر هم محصول هم دسته محدود شده باشد، مطابقت با هرکدام کافی است (OR)", () => {
    const code = makeCode({ products: [{ productId: 1 }], categories: [{ categoryId: 9 }] });
    expect(isItemEligible(code, { productId: 2, categoryIds: [9] })).toBe(true);
    expect(isItemEligible(code, { productId: 1, categoryIds: [0] })).toBe(true);
    expect(isItemEligible(code, { productId: 2, categoryIds: [0] })).toBe(false);
  });
});

describe("discount-apply: calculateDiscountAmount", () => {
  it("تخفیف درصدی را روی subtotal واجدشرایط محاسبه می‌کند", () => {
    const code = makeCode({ type: "PERCENT", value: 20 });
    expect(calculateDiscountAmount(code, 100000)).toBe(20000);
  });

  it("تخفیف مبلغ ثابت را برمی‌گرداند مگر بیشتر از subtotal باشد", () => {
    const code = makeCode({ type: "FIXED", value: 50000 });
    expect(calculateDiscountAmount(code, 100000)).toBe(50000);
    expect(calculateDiscountAmount(code, 30000)).toBe(30000);
  });

  it("سقف maxDiscountAmount را رعایت می‌کند", () => {
    const code = makeCode({ type: "PERCENT", value: 50, maxDiscountAmount: 10000 });
    expect(calculateDiscountAmount(code, 100000)).toBe(10000);
  });

  it("برای subtotal صفر، تخفیف صفر برمی‌گرداند", () => {
    const code = makeCode({ type: "PERCENT", value: 50 });
    expect(calculateDiscountAmount(code, 0)).toBe(0);
  });
});
