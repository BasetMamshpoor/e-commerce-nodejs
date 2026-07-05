import {
  serializeProductImage,
  serializeVariantAttributeValue,
  serializeProduct,
} from "../src/utils/serialize";

describe("utils/serialize", () => {
  it("serializeProductImage فیلدهای url/isMain را برمی‌گرداند", () => {
    const result = serializeProductImage({
      id: 1,
      order: 0,
      isMain: true,
      media: { id: 10, url: "https://x.com/a.jpg", alt: null },
    });
    expect(result.url).toBe("https://x.com/a.jpg");
    expect(result.isMain).toBe(true);
  });

  it("serializeVariantAttributeValue ساختار junction را به AttributeValue تخت تبدیل می‌کند", () => {
    const result = serializeVariantAttributeValue({
      attributeValue: {
        id: 1,
        value: "سفید",
        colorHex: "#FFFFFF",
        order: 0,
        attribute: { id: 1, name: "رنگ", slug: "color", inputType: "COLOR" },
      },
    });
    expect(result).toEqual({
      id: 1,
      value: "سفید",
      colorHex: "#FFFFFF",
      order: 0,
      attribute: { id: 1, name: "رنگ", slug: "color", inputType: "COLOR" },
    });
  });

  it("serializeProduct دسته‌بندی‌ها را از حالت junction به آرایه‌ی تخت Category[] تبدیل می‌کند", () => {
    const result = serializeProduct({
      id: 1,
      categories: [
        { category: { id: 1, name: "test", imageUrl: "https://x.com/cat.jpg" } },
      ],
    });
    expect(result.categories).toBeDefined();
    expect(result.categories!.length).toBe(1);
  });

  it("serializeProduct وقتی images/categories/variants نیامده باشند، کرش نمی‌کند", () => {
    const result = serializeProduct({});
    expect((result as Record<string, unknown>).images).toBeUndefined();
  });
});
