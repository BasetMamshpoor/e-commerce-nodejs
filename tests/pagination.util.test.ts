import { parsePagination, buildPaginationMeta } from "../src/utils/pagination";

describe("utils/pagination", () => {
  it("مقادیر پیش‌فرض را وقتی چیزی ارسال نشده برمی‌گرداند", () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 20, skip: 0, take: 20 });
  });

  it("page و limit را به عدد تبدیل می‌کند و skip را درست حساب می‌کند", () => {
    const result = parsePagination({ page: "3", limit: "10" });
    expect(result).toEqual({ page: 3, limit: 10, skip: 20, take: 10 });
  });

  it("limit بیشتر از سقف مجاز را به MAX_LIMIT محدود می‌کند", () => {
    const result = parsePagination({ limit: 500 });
    expect(result.limit).toBe(100);
  });

  it("page یا limit نامعتبر (منفی/صفر) را به پیش‌فرض برمی‌گرداند", () => {
    const result = parsePagination({ page: -1, limit: 0 });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("buildPaginationMeta تعداد صفحات را درست محاسبه می‌کند", () => {
    const params = parsePagination({ page: 1, limit: 10 });
    const meta = buildPaginationMeta(95, params);
    expect(meta).toEqual({ total: 95, page: 1, limit: 10, totalPages: 10 });
  });

  it("buildPaginationMeta برای صفر نتیجه هم حداقل یک صفحه نشان می‌دهد", () => {
    const params = parsePagination({ page: 1, limit: 10 });
    const meta = buildPaginationMeta(0, params);
    expect(meta.totalPages).toBe(1);
  });
});
