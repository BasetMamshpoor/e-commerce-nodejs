import { ProductLookupPort, ResolvedProduct, ProductSearchResult } from "../src/engine/productMatcher/types";

export function makeFakeLookup(products: ResolvedProduct[]): ProductLookupPort {
  return {
    async findByShortCode(code) {
      return products.find((p) => p.shortCode?.toLowerCase() === code.toLowerCase()) ?? null;
    },
    async findById(id) {
      return products.find((p) => p.id === id) ?? null;
    },
    async search(text) {
      const lower = text.toLowerCase();
      return products
        .filter((p) => lower.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(lower))
        .map(toSearchResult);
    },
    async countActiveBrands() {
      return 3;
    },
  };
}

function toSearchResult(p: ResolvedProduct): ProductSearchResult {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortCode: p.shortCode,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    isInStock: p.isInStock,
    mainImageUrl: null,
  };
}

// یک لیست دلخواه از محصولات را برای جست‌وجوی متنی برمی‌گرداند (بدون
// نیازی به تطابق واقعی نام) — برای شبیه‌سازی سناریوی «چند گزینه پیدا شد»
export function fakeSearchLookup(products: ResolvedProduct[], searchResults: ResolvedProduct[]): ProductLookupPort {
  const base = makeFakeLookup(products);
  return {
    ...base,
    async search() {
      return searchResults.map(toSearchResult);
    },
  };
}

export function makeProduct(overrides: Partial<ResolvedProduct> = {}): ResolvedProduct {
  return {
    id: 1,
    name: "کراپ ورزشی",
    slug: "crop-varzeshi",
    shortCode: "CRP01",
    shortDescription: null,
    brandName: "Nike",
    minPrice: 100000,
    maxPrice: 150000,
    isInStock: true,
    hasActiveDiscount: false,
    variants: [],
    ...overrides,
  };
}
