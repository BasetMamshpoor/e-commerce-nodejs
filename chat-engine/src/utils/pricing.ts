// ----------------------------------------------------------------------------
// همان فرمول src/utils/pricing.ts پروژه‌ی اصلی: قیمت پایه‌ی محصول +
// priceAdjustment تنوع، و تخفیف (که در دیتابیس فعلی سطح محصول است، نه تنوع).
// به‌خاطر استقلال موتور از بک‌اند، اینجا هیچ تایپی از Prisma import نمی‌شود.
// ----------------------------------------------------------------------------

export type DiscountTypeLike = "PERCENT" | "FIXED";

export interface EffectivePrice {
  originalPrice: number;
  unitPrice: number;
  discountAmount: number;
  isDiscounted: boolean;
}

export function computeEffectivePrice(
  basePrice: number,
  priceAdjustment: number,
  discountType: DiscountTypeLike | null,
  discountValue: number | null
): EffectivePrice {
  const originalPrice = basePrice + priceAdjustment;

  if (!discountType || !discountValue) {
    return { originalPrice, unitPrice: originalPrice, discountAmount: 0, isDiscounted: false };
  }

  const discountAmount =
    discountType === "PERCENT" ? Math.round((originalPrice * discountValue) / 100) : discountValue;

  const unitPrice = Math.max(originalPrice - discountAmount, 0);

  return {
    originalPrice,
    unitPrice,
    discountAmount: originalPrice - unitPrice,
    isDiscounted: unitPrice < originalPrice,
  };
}

export function formatToman(amount: number): string {
  return `${amount.toLocaleString("fa-IR")} تومان`;
}
