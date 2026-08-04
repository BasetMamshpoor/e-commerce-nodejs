import {
  resolvePriceReply,
  resolveStockReply,
  resolveColorReply,
  resolveSizeReply,
} from "../src/engine/layer1-keywords/resolvers/productIntent.resolver";
import { ResolvedProduct } from "../src/engine/productMatcher/types";

function makeProduct(overrides: Partial<ResolvedProduct> = {}): ResolvedProduct {
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

describe("layer1 resolvers: price/stock", () => {
  it("وقتی min و max برابرند، یک قیمت واحد نشان می‌دهد", () => {
    const product = makeProduct({ minPrice: 100000, maxPrice: 100000 });
    expect(resolvePriceReply(product)).toContain("تومان");
    expect(resolvePriceReply(product)).not.toContain("از");
  });

  it("وقتی min و max فرق دارند، بازه‌ی قیمت نشان می‌دهد", () => {
    const product = makeProduct({ minPrice: 100000, maxPrice: 150000 });
    const text = resolvePriceReply(product);
    expect(text).toContain("از");
    expect(text).toContain("تا");
  });

  it("موجودی محصول را درست گزارش می‌دهد", () => {
    expect(resolveStockReply(makeProduct({ isInStock: true }))).toContain("موجود است");
    expect(resolveStockReply(makeProduct({ isInStock: false }))).toContain("موجود نیست");
  });
});

describe("layer1 resolvers: color/size", () => {
  const productWithVariants = makeProduct({
    variants: [
      {
        id: 1,
        sku: "SKU-1",
        priceAdjustment: 0,
        stock: 5,
        attributeValues: [{ attributeName: "رنگ", attributeInputType: "COLOR", value: "مشکی" }],
      },
      {
        id: 2,
        sku: "SKU-2",
        priceAdjustment: 0,
        stock: 0,
        attributeValues: [{ attributeName: "رنگ", attributeInputType: "COLOR", value: "سفید" }],
      },
    ],
  });

  it("رنگ‌های موجود و ناموجود را جدا نشان می‌دهد", () => {
    const text = resolveColorReply(productWithVariants);
    expect(text).toContain("مشکی");
    expect(text).toContain("سفید (ناموجود)");
  });

  it("برای محصول تک‌مدل بدون تنوع رنگ، پیام مناسب می‌دهد", () => {
    const text = resolveColorReply(makeProduct({ variants: [] }));
    expect(text).toContain("تک‌مدل");
  });

  it("سایز را از بین ویژگی‌های غیر-رنگ گزارش می‌دهد", () => {
    const product = makeProduct({
      variants: [
        {
          id: 1,
          sku: "SKU-1",
          priceAdjustment: 0,
          stock: 3,
          attributeValues: [{ attributeName: "سایز", attributeInputType: "SELECT", value: "L" }],
        },
      ],
    });
    expect(resolveSizeReply(product)).toContain("L");
  });
});
