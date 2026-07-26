import { PricingMode, ModifierType } from "../generated/prisma";

export interface AttributeValueModifier {
  modifierType: ModifierType | null;
  modifierValue: number | null;
}

export interface ProductPricingInput {
  pricingMode: PricingMode;
  basePrice: number;
  sourcePrice: number | null;
  priceBufferPercent: number | null;
}

export interface CurrencyRateInput {
  currentRate: number | null;
}

export interface PriceBreakdown {
  finalPriceIRT: number;
  sourceAmount: number;
  rateUsed: number | null;
  bufferApplied: number | null;
  fixedIrtAdjustments: number;
  totalAdjustments: number;
}

export function calculateFinalPrice(
  product: ProductPricingInput,
  currency: CurrencyRateInput | null,
  attributeModifiers: AttributeValueModifier[]
): PriceBreakdown {
  if (product.pricingMode === "FIXED_IRT") {
    let fixedIrtAdjustments = 0;
    let percentSum = 0;

    for (const mod of attributeModifiers) {
      if (mod.modifierType === null) continue;
      if (mod.modifierType === "FIXED_IRT") {
        fixedIrtAdjustments += mod.modifierValue ?? 0;
      } else if (mod.modifierType === "PERCENTAGE") {
        // برای محصول ریالی، درصد روی basePrice خود محصول اعمال می‌شود
        // (مثلاً «تنوع XL ده درصد گران‌تر از قیمت پایه»).
        percentSum += mod.modifierValue ?? 0;
      } else {
        throw new Error(`Invalid modifier type ${mod.modifierType} for FIXED_IRT product`);
      }
    }

    const percentAdjustment = product.basePrice * (percentSum / 100);
    const finalPrice = product.basePrice + fixedIrtAdjustments + percentAdjustment;

    return {
      finalPriceIRT: Math.round(finalPrice),
      sourceAmount: product.basePrice,
      rateUsed: null,
      bufferApplied: null,
      fixedIrtAdjustments,
      totalAdjustments: fixedIrtAdjustments + percentAdjustment,
    };
  }

  if (product.pricingMode === "CURRENCY_BASED") {
    let sourceAmount = product.sourcePrice ?? 0;
    let fixedIrtAdjustments = 0;

    for (const mod of attributeModifiers) {
      if (mod.modifierType === null) continue;
      if (mod.modifierType === "PERCENTAGE") {
        const base = product.sourcePrice ?? 0;
        sourceAmount += base * ((mod.modifierValue ?? 0) / 100);
      } else if (mod.modifierType === "FIXED_SOURCE_CURRENCY") {
        sourceAmount += mod.modifierValue ?? 0;
      }
    }

    const rate = currency?.currentRate ?? 0;
    let convertedIRT = sourceAmount * rate;

    let bufferApplied: number | null = null;
    if (product.priceBufferPercent) {
      const bufferAmount = convertedIRT * (product.priceBufferPercent / 100);
      convertedIRT += bufferAmount;
      bufferApplied = product.priceBufferPercent;
    }

    const totalAdjustments = sourceAmount - (product.sourcePrice ?? 0);

    for (const mod of attributeModifiers) {
      if (mod.modifierType === null) continue;
      if (mod.modifierType === "FIXED_IRT") {
        const val = mod.modifierValue ?? 0;
        convertedIRT += val;
        fixedIrtAdjustments += val;
      }
    }

    return {
      finalPriceIRT: Math.round(convertedIRT),
      sourceAmount,
      rateUsed: rate,
      bufferApplied,
      fixedIrtAdjustments,
      totalAdjustments,
    };
  }

  throw new Error(`Unknown pricing mode: ${product.pricingMode}`);
}

// ----------------------------------------------------------------------------
// محاسبه‌ی قیمت یک «تنوع» (variant) مشخص از یک محصول.
//
// چرا این تابع لازم بود: تا قبل از این، دو مکانیزم جدا برای اثر تنوع روی
// قیمت وجود داشت که هماهنگ نبودند:
//   ۱) ProductVariant.priceAdjustment — یک عدد ثابت تومانی روی کل تنوع
//   ۲) ProductVariantAttributeValue.modifierType/modifierValue — تعدیل به
//      ازای هر مقدار ویژگی (رنگ/سایز/...) که calculateFinalPrice می‌فهمد
//
// در نتیجه در بخش‌هایی از کد (سبد خرید، محاسبه‌ی min/max قیمت محصول) فقط از
// priceAdjustment استفاده می‌شد و modifierType/modifierValue کلاً نادیده
// گرفته می‌شد؛ درحالی‌که در ثبت سفارش (order.service) از calculateFinalPrice
// با modifierValue ها استفاده می‌شد. همین ناهماهنگی باعث می‌شد قیمتی که در
// سبد خرید نشان داده می‌شود با قیمتی که هنگام ثبت سفارش واقعاً محاسبه و
// دریافت می‌شود فرق کند.
//
// این تابع priceAdjustment را هم به‌عنوان یک تعدیل نوع FIXED_IRT اضافه به
// لیست modifierهای واقعی تنوع اضافه می‌کند و همه را یک‌جا به calculateFinalPrice
// می‌دهد؛ تا از این پس یک مسیر محاسبه‌ی واحد در همه‌جا (سبد خرید، سفارش،
// aggregate های محصول، نمایش به فرانت) استفاده شود.
// ----------------------------------------------------------------------------

export interface VariantForPricing {
  priceAdjustment: number;
  attributeValues: AttributeValueModifier[];
}

export function buildVariantModifiers(variant: VariantForPricing): AttributeValueModifier[] {
  const modifiers: AttributeValueModifier[] = variant.attributeValues.map((av) => ({
    modifierType: av.modifierType,
    modifierValue: av.modifierValue,
  }));

  if (variant.priceAdjustment) {
    modifiers.push({ modifierType: "FIXED_IRT", modifierValue: variant.priceAdjustment });
  }

  return modifiers;
}

export function calculateVariantPrice(
  product: ProductPricingInput,
  currency: CurrencyRateInput | null,
  variant: VariantForPricing
): PriceBreakdown {
  return calculateFinalPrice(product, currency, buildVariantModifiers(variant));
}
