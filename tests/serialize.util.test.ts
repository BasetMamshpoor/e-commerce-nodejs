import {
  mediaUrl,
  serializeProductImage,
  serializeVariantImage,
  serializeVariantAttributeValue,
  serializeCategory,
  serializeBrand,
  serializeProduct,
} from "../src/utils/serialize";

describe("utils/serialize", () => {
  it("mediaUrl برای null مقدار null برمی‌گرداند", () => {
    expect(mediaUrl(null)).toBeNull();
    expect(mediaUrl(undefined)).toBeNull();
  });

  it("mediaUrl برای یک رسانه، url آن را برمی‌گرداند", () => {
    expect(mediaUrl({ url: "https://x.com/a.jpg", alt: "تست" })).toBe("https://x.com/a.jpg");
  });

  it("serializeProductImage فیلدهای url/alt را flat می‌کند و media را هم نگه می‌دارد (رفع باگ #۱)", () => {
    const result = serializeProductImage({
      id: "img1",
      mediaId: "m1",
      order: 0,
      isMain: true,
      media: { url: "https://x.com/a.jpg", alt: "آلت" },
    });
    expect(result.url).toBe("https://x.com/a.jpg");
    expect(result.alt).toBe("آلت");
    expect(result.media).toEqual({ url: "https://x.com/a.jpg", alt: "آلت" });
  });

  it("serializeVariantImage هم همین رفتار را دارد", () => {
    const result = serializeVariantImage({
      id: "vi1",
      mediaId: "m2",
      order: 1,
      media: { url: "https://x.com/b.jpg", alt: null },
    });
    expect(result.url).toBe("https://x.com/b.jpg");
  });

  it("serializeVariantAttributeValue ساختار junction را به AttributeValue تخت تبدیل می‌کند (رفع باگ #۲)", () => {
    const result = serializeVariantAttributeValue({
      attributeValue: {
        id: "av1",
        value: "سفید",
        colorHex: "#FFFFFF",
        order: 0,
        attribute: { id: "attr1", name: "رنگ", slug: "color", inputType: "COLOR" },
      },
    });
    expect(result).toEqual({
      id: "av1",
      value: "سفید",
      colorHex: "#FFFFFF",
      order: 0,
      attribute: { id: "attr1", name: "رنگ", slug: "color", inputType: "COLOR" },
    });
    // نباید کلید junction اضافه (attributeValueId جدا) در خروجی باشد
    expect((result as Record<string, unknown>).attributeValueId).toBeUndefined();
  });

  it("serializeCategory فیلد imageUrl را اضافه می‌کند (رفع باگ #۴)", () => {
    const result = serializeCategory({
      id: "c1",
      imageId: "m1",
      image: { url: "https://x.com/cat.jpg", alt: null },
    });
    expect(result.imageUrl).toBe("https://x.com/cat.jpg");
  });

  it("serializeBrand فیلد logoUrl را اضافه می‌کند (رفع باگ #۴)", () => {
    const result = serializeBrand({ id: "b1", logoId: "m1", logo: { url: "https://x.com/logo.png", alt: null } });
    expect(result.logoUrl).toBe("https://x.com/logo.png");
  });

  it("serializeBrand برای logo نال، logoUrl را null می‌گذارد", () => {
    const result = serializeBrand({ id: "b1", logoId: null, logo: null });
    expect(result.logoUrl).toBeNull();
  });

  it("serializeProduct دسته‌بندی‌ها را از حالت junction به آرایه‌ی تخت Category[] تبدیل می‌کند (رفع باگ #۳)", () => {
    const result = serializeProduct({
      id: "p1",
      categories: [
        { productId: "p1", categoryId: "c1", category: { id: "c1", imageId: null, image: null } },
      ],
    });
    expect(result.categories).toEqual([{ id: "c1", imageId: null, image: null, imageUrl: null }]);
  });

  it("serializeProduct وقتی images/categories/variants نیامده باشند، کرش نمی‌کند", () => {
    const result = serializeProduct({ id: "p1", brand: null });
    expect(result.brand).toBeNull();
    expect((result as Record<string, unknown>).images).toBeUndefined();
  });
});
