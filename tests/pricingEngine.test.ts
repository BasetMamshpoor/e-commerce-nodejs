import { calculateFinalPrice, calculateVariantPrice, ProductPricingInput, CurrencyRateInput, AttributeValueModifier } from "../src/services/pricingEngine";

describe("pricingEngine calculateFinalPrice", () => {
  describe("FIXED_IRT products", () => {
    const fixedProduct: ProductPricingInput = {
      pricingMode: "FIXED_IRT",
      basePrice: 500000,
      sourcePrice: null,
      priceBufferPercent: null,
    };

    it("returns basePrice with no modifiers", () => {
      const result = calculateFinalPrice(fixedProduct, null, []);
      expect(result.finalPriceIRT).toBe(500000);
      expect(result.sourceAmount).toBe(500000);
      expect(result.rateUsed).toBeNull();
      expect(result.fixedIrtAdjustments).toBe(0);
    });

    it("adds positive FIXED_IRT modifier", () => {
      const mods: AttributeValueModifier[] = [
        { modifierType: "FIXED_IRT", modifierValue: 50000 },
      ];
      const result = calculateFinalPrice(fixedProduct, null, mods);
      expect(result.finalPriceIRT).toBe(550000);
      expect(result.fixedIrtAdjustments).toBe(50000);
    });

    it("subtracts negative FIXED_IRT modifier", () => {
      const mods: AttributeValueModifier[] = [
        { modifierType: "FIXED_IRT", modifierValue: -30000 },
      ];
      const result = calculateFinalPrice(fixedProduct, null, mods);
      expect(result.finalPriceIRT).toBe(470000);
      expect(result.fixedIrtAdjustments).toBe(-30000);
    });

    it("handles multiple FIXED_IRT modifiers", () => {
      const mods: AttributeValueModifier[] = [
        { modifierType: "FIXED_IRT", modifierValue: 20000 },
        { modifierType: "FIXED_IRT", modifierValue: 15000 },
        { modifierType: "FIXED_IRT", modifierValue: -10000 },
      ];
      const result = calculateFinalPrice(fixedProduct, null, mods);
      expect(result.finalPriceIRT).toBe(525000);
      expect(result.fixedIrtAdjustments).toBe(25000);
    });

    it("applies PERCENTAGE modifier on basePrice for FIXED_IRT product (e.g. an XL size costs 10% more)", () => {
      const mods: AttributeValueModifier[] = [
        { modifierType: "PERCENTAGE", modifierValue: 10 },
      ];
      const result = calculateFinalPrice(fixedProduct, null, mods);
      // 500,000 + 500,000*10% = 550,000
      expect(result.finalPriceIRT).toBe(550000);
    });

    it("combines PERCENTAGE and FIXED_IRT modifiers together for FIXED_IRT product", () => {
      const mods: AttributeValueModifier[] = [
        { modifierType: "PERCENTAGE", modifierValue: 10 },
        { modifierType: "FIXED_IRT", modifierValue: 20000 },
      ];
      const result = calculateFinalPrice(fixedProduct, null, mods);
      // 500,000 + 500,000*10% + 20,000 = 570,000
      expect(result.finalPriceIRT).toBe(570000);
      expect(result.fixedIrtAdjustments).toBe(20000);
    });

    it("throws on FIXED_SOURCE_CURRENCY modifier for FIXED_IRT product", () => {
      const mods: AttributeValueModifier[] = [
        { modifierType: "FIXED_SOURCE_CURRENCY", modifierValue: 5 },
      ];
      expect(() => calculateFinalPrice(fixedProduct, null, mods)).toThrow(
        "Invalid modifier type FIXED_SOURCE_CURRENCY for FIXED_IRT product"
      );
    });
  });

  describe("CURRENCY_BASED products", () => {
    const currencyRate: CurrencyRateInput = { currentRate: 100000 };

    const baseProduct: ProductPricingInput = {
      pricingMode: "CURRENCY_BASED",
      basePrice: 0,
      sourcePrice: 10,
      priceBufferPercent: null,
    };

    it("converts sourcePrice to IRT with rate", () => {
      const result = calculateFinalPrice(baseProduct, currencyRate, []);
      expect(result.finalPriceIRT).toBe(1_000_000);
      expect(result.sourceAmount).toBe(10);
      expect(result.rateUsed).toBe(100000);
      expect(result.bufferApplied).toBeNull();
    });

    it("applies PERCENTAGE modifier on source price", () => {
      const mods: AttributeValueModifier[] = [
        { modifierType: "PERCENTAGE", modifierValue: 50 },
      ];
      const result = calculateFinalPrice(baseProduct, currencyRate, mods);
      expect(result.sourceAmount).toBe(15);
      expect(result.finalPriceIRT).toBe(1_500_000);
    });

    it("applies FIXED_SOURCE_CURRENCY modifier", () => {
      const mods: AttributeValueModifier[] = [
        { modifierType: "FIXED_SOURCE_CURRENCY", modifierValue: 5 },
      ];
      const result = calculateFinalPrice(baseProduct, currencyRate, mods);
      expect(result.sourceAmount).toBe(15);
      expect(result.finalPriceIRT).toBe(1_500_000);
    });

    it("applies FIXED_IRT modifier after currency conversion", () => {
      const mods: AttributeValueModifier[] = [
        { modifierType: "FIXED_IRT", modifierValue: 200000 },
      ];
      const result = calculateFinalPrice(baseProduct, currencyRate, mods);
      expect(result.sourceAmount).toBe(10);
      expect(result.finalPriceIRT).toBe(1_200_000);
      expect(result.fixedIrtAdjustments).toBe(200000);
    });

    it("applies all three modifier types combined", () => {
      const mods: AttributeValueModifier[] = [
        { modifierType: "PERCENTAGE", modifierValue: 20 },
        { modifierType: "FIXED_SOURCE_CURRENCY", modifierValue: 5 },
        { modifierType: "FIXED_IRT", modifierValue: 100000 },
      ];
      const result = calculateFinalPrice(baseProduct, currencyRate, mods);
      // sourceAmount = 10 + (10 * 20/100) + 5 = 17
      expect(result.sourceAmount).toBe(17);
      // convertedIRT = 17 * 100000 = 1,700,000
      // fixedIrtAdjustments = 100000
      // finalPriceIRT = 1,800,000
      expect(result.finalPriceIRT).toBe(1_800_000);
      expect(result.fixedIrtAdjustments).toBe(100000);
    });

    it("applies priceBufferPercent correctly", () => {
      const productWithBuffer: ProductPricingInput = {
        pricingMode: "CURRENCY_BASED",
        basePrice: 0,
        sourcePrice: 10,
        priceBufferPercent: 5,
      };
      const result = calculateFinalPrice(productWithBuffer, currencyRate, []);
      // convertedIRT = 10 * 100000 = 1,000,000
      // buffer = 1,000,000 * 5/100 = 50,000
      // total = 1,050,000
      expect(result.finalPriceIRT).toBe(1_050_000);
      expect(result.bufferApplied).toBe(5);
    });

    it("handles zero rate gracefully", () => {
      const zeroRate: CurrencyRateInput = { currentRate: 0 };
      const result = calculateFinalPrice(baseProduct, zeroRate, []);
      expect(result.finalPriceIRT).toBe(0);
      expect(result.rateUsed).toBe(0);
    });

    it("handles zero sourcePrice gracefully", () => {
      const zeroSource: ProductPricingInput = {
        pricingMode: "CURRENCY_BASED",
        basePrice: 0,
        sourcePrice: 0,
        priceBufferPercent: null,
      };
      const result = calculateFinalPrice(zeroSource, currencyRate, []);
      expect(result.finalPriceIRT).toBe(0);
    });

    it("combines buffer with FIXED_IRT modifier", () => {
      const productWithBuffer: ProductPricingInput = {
        pricingMode: "CURRENCY_BASED",
        basePrice: 0,
        sourcePrice: 10,
        priceBufferPercent: 10,
      };
      const mods: AttributeValueModifier[] = [
        { modifierType: "FIXED_IRT", modifierValue: 50000 },
      ];
      const result = calculateFinalPrice(productWithBuffer, currencyRate, mods);
      // convertedIRT = 10 * 100000 = 1,000,000
      // buffer = 1,000,000 * 10/100 = 100,000 -> 1,100,000
      // fixedIrt = 50,000 -> 1,150,000
      expect(result.finalPriceIRT).toBe(1_150_000);
      expect(result.bufferApplied).toBe(10);
      expect(result.fixedIrtAdjustments).toBe(50000);
    });

    it("handles null currentRate (currency not yet fetched)", () => {
      const nullRate: CurrencyRateInput = { currentRate: null };
      const result = calculateFinalPrice(baseProduct, nullRate, []);
      expect(result.finalPriceIRT).toBe(0);
      expect(result.rateUsed).toBe(0);
    });
  });
});

// ----------------------------------------------------------------------------
// calculateVariantPrice: قبلاً priceAdjustment (فیلد روی خودِ ProductVariant)
// و modifierType/modifierValue (فیلد روی هر مقدار ویژگی تنوع) در دو مسیر
// جدا و ناهماهنگ محاسبه می‌شدند — این تست‌ها تضمین می‌کنند که هر دو با هم و
// در یک محاسبه‌ی واحد اعمال می‌شوند.
// ----------------------------------------------------------------------------
describe("pricingEngine calculateVariantPrice", () => {
  it("برای محصول FIXED_IRT هم priceAdjustment و هم مدیفایر ویژگی را با هم جمع می‌زند", () => {
    const product: ProductPricingInput = {
      pricingMode: "FIXED_IRT",
      basePrice: 100000,
      sourcePrice: null,
      priceBufferPercent: null,
    };
    const result = calculateVariantPrice(product, null, {
      priceAdjustment: 5000,
      attributeValues: [{ modifierType: "FIXED_IRT", modifierValue: 20000 }],
    });
    expect(result.finalPriceIRT).toBe(125000);
  });

  it("وقتی priceAdjustment صفر باشد، فقط مدیفایر ویژگی اثر می‌گذارد", () => {
    const product: ProductPricingInput = {
      pricingMode: "FIXED_IRT",
      basePrice: 100000,
      sourcePrice: null,
      priceBufferPercent: null,
    };
    const result = calculateVariantPrice(product, null, {
      priceAdjustment: 0,
      attributeValues: [{ modifierType: "FIXED_IRT", modifierValue: -10000 }],
    });
    expect(result.finalPriceIRT).toBe(90000);
  });

  it("برای محصول CURRENCY_BASED، priceAdjustment به‌عنوان تعدیل تومانی بعد از تبدیل ارز اضافه می‌شود", () => {
    const product: ProductPricingInput = {
      pricingMode: "CURRENCY_BASED",
      basePrice: 0,
      sourcePrice: 10,
      priceBufferPercent: 0,
    };
    const currency: CurrencyRateInput = { currentRate: 100000 };
    const result = calculateVariantPrice(product, currency, {
      priceAdjustment: 5000,
      attributeValues: [{ modifierType: "PERCENTAGE", modifierValue: 10 }],
    });
    // sourceAmount = 10 + 10*10% = 11 -> convertedIRT = 1,100,000 + priceAdjustment 5,000
    expect(result.finalPriceIRT).toBe(1_105_000);
  });

  it("دو تنوع با مدیفایرهای متفاوت باید قیمت نهایی متفاوتی داشته باشند (رگرسیون باگ min/max ثابت)", () => {
    const product: ProductPricingInput = {
      pricingMode: "FIXED_IRT",
      basePrice: 200000,
      sourcePrice: null,
      priceBufferPercent: null,
    };
    const cheap = calculateVariantPrice(product, null, {
      priceAdjustment: 0,
      attributeValues: [],
    });
    const expensive = calculateVariantPrice(product, null, {
      priceAdjustment: 0,
      attributeValues: [{ modifierType: "FIXED_IRT", modifierValue: 30000 }],
    });
    expect(cheap.finalPriceIRT).toBe(200000);
    expect(expensive.finalPriceIRT).toBe(230000);
    expect(cheap.finalPriceIRT).not.toBe(expensive.finalPriceIRT);
  });
});
