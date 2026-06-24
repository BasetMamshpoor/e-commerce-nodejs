import {
  isItemEligible,
  calculateDiscountAmount,
} from "../src/services/discount/discount-apply.service";

function makeCode(overrides: Partial<{
  type: "PERCENT" | "FIXED";
  value: number;
  maxDiscountAmount: number | null;
  products: { productId: string }[];
  categories: { categoryId: string }[];
}> = {}) {
  return {
    id: "dc1",
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
    expect(isItemEligible(code, { productId: "p1", categoryIds: ["c1"] })).toBe(true);
  });

  it("با محدودیت محصول، فقط محصول مجاز واجد شرایط است", () => {
    const code = makeCode({ products: [{ productId: "p1" }] });
    expect(isItemEligible(code, { productId: "p1", categoryIds: [] })).toBe(true);
    expect(isItemEligible(code, { productId: "p2", categoryIds: [] })).toBe(false);
  });

  it("با محدودیت دسته، اگر یکی از دسته‌های محصول مطابقت داشت کافی است", () => {
    const code = makeCode({ categories: [{ categoryId: "c1" }] });
    expect(isItemEligible(code, { productId: "p1", categoryIds: ["c2", "c1"] })).toBe(true);
    expect(isItemEligible(code, { productId: "p1", categoryIds: ["c3"] })).toBe(false);
  });

  it("اگر هم محصول هم دسته محدود شده باشد، مطابقت با هرکدام کافی است (OR)", () => {
    const code = makeCode({ products: [{ productId: "p1" }], categories: [{ categoryId: "c9" }] });
    expect(isItemEligible(code, { productId: "p2", categoryIds: ["c9"] })).toBe(true);
    expect(isItemEligible(code, { productId: "p1", categoryIds: ["c0"] })).toBe(true);
    expect(isItemEligible(code, { productId: "p2", categoryIds: ["c0"] })).toBe(false);
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
    expect(calculateDiscountAmount(code, 30000)).toBe(30000); // نمی‌تواند بیشتر از subtotal باشد
  });

  it("سقف maxDiscountAmount را رعایت می‌کند", () => {
    const code = makeCode({ type: "PERCENT", value: 50, maxDiscountAmount: 10000 });
    expect(calculateDiscountAmount(code, 100000)).toBe(10000); // 50% می‌شد 50000 ولی سقف 10000 است
  });

  it("برای subtotal صفر، تخفیف صفر برمی‌گرداند", () => {
    const code = makeCode({ type: "PERCENT", value: 50 });
    expect(calculateDiscountAmount(code, 0)).toBe(0);
  });
});
