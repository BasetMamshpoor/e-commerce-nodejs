import { allocateProportionally } from "../src/utils/allocation";

describe("utils/allocation allocateProportionally", () => {
  it("مقدار کل را متناسب با وزن‌ها تقسیم می‌کند", () => {
    expect(allocateProportionally(100, [50, 50])).toEqual([50, 50]);
  });

  it("جمع نتیجه همیشه دقیقاً برابر total است (حتی با گردشدن اعشار)", () => {
    const result = allocateProportionally(100, [33, 33, 34]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("باقیمانده‌ی گرد شده به آخرین آیتم اضافه می‌شود", () => {
    // 100 بین سه وزن مساوی -> هرکدام floor(33.33)=33، باقیمانده 1 به آخری
    expect(allocateProportionally(100, [1, 1, 1])).toEqual([33, 33, 34]);
  });

  it("برای total صفر، همه صفر برمی‌گردند", () => {
    expect(allocateProportionally(0, [10, 20])).toEqual([0, 0]);
  });

  it("برای آرایه‌ی خالی، آرایه‌ی خالی برمی‌گرداند", () => {
    expect(allocateProportionally(100, [])).toEqual([]);
  });

  it("وزن نامتقارن را به‌درستی تقسیم می‌کند", () => {
    expect(allocateProportionally(90, [10, 20, 30])).toEqual([15, 30, 45]);
  });
});
