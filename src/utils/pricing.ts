import { ProductVariant } from "../generated/prisma";

// ----------------------------------------------------------------------------
// محاسبه‌ی قیمت نهایی یک تنوع کالا با درنظرگرفتن تخفیف مخصوص همان تنوع
// (آیتم ۲: «تخفیف مخصوص برای هر تنوع کالایی»).
// این تابع را هم در سبد خرید و هم بعداً در محاسبه‌ی سفارش استفاده می‌کنیم تا
// منطق قیمت‌گذاری یک‌جا و یکدست باشد.
// ----------------------------------------------------------------------------

export interface EffectivePrice {
  originalPrice: number;
  unitPrice: number; // قیمت نهایی بعد از تخفیف (همان originalPrice اگر تخفیفی نباشد)
  discountAmount: number;
  isDiscounted: boolean;
}

export function computeVariantEffectivePrice(
  variant: Pick<
    ProductVariant,
    "price" | "discountType" | "discountValue" | "discountStartAt" | "discountEndAt"
  >
): EffectivePrice {
  const now = new Date();

  const isActiveWindow =
    (!variant.discountStartAt || variant.discountStartAt <= now) &&
    (!variant.discountEndAt || variant.discountEndAt >= now);

  if (!variant.discountType || !variant.discountValue || !isActiveWindow) {
    return {
      originalPrice: variant.price,
      unitPrice: variant.price,
      discountAmount: 0,
      isDiscounted: false,
    };
  }

  const discountAmount =
    variant.discountType === "PERCENT"
      ? Math.round((variant.price * variant.discountValue) / 100)
      : variant.discountValue;

  const unitPrice = Math.max(variant.price - discountAmount, 0);

  return {
    originalPrice: variant.price,
    unitPrice,
    discountAmount: variant.price - unitPrice,
    isDiscounted: true,
  };
}
