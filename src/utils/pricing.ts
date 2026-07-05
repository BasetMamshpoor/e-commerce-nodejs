import { DiscountType } from "../generated/prisma";

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

export function computeProductEffectivePrice(
  basePrice: number,
  priceAdjustment: number,
  discountType: DiscountType | null,
  discountValue: number | null,
  discountStartAt: Date | null,
  discountEndAt: Date | null
): EffectivePrice {
  const originalPrice = basePrice + priceAdjustment;
  const now = new Date();

  const isActiveWindow =
    (!discountStartAt || discountStartAt <= now) &&
    (!discountEndAt || discountEndAt >= now);

  if (!discountType || !discountValue || !isActiveWindow) {
    return {
      originalPrice,
      unitPrice: originalPrice,
      discountAmount: 0,
      isDiscounted: false,
    };
  }

  const discountAmount =
    discountType === "PERCENT"
      ? Math.round((originalPrice * discountValue) / 100)
      : discountValue;

  const unitPrice = Math.max(originalPrice - discountAmount, 0);

  return {
    originalPrice,
    unitPrice,
    discountAmount: originalPrice - unitPrice,
    isDiscounted: true,
  };
}
