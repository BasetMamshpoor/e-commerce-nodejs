import { KeywordIntent } from "../keywords.config";
import { ResolvedProduct } from "../../productMatcher/types";
import { formatToman } from "../../../utils/pricing";

export function resolvePriceReply(product: ResolvedProduct): string {
  if (product.minPrice <= 0) {
    return `متاسفانه قیمت «${product.name}» فعلاً ثبت نشده — لطفاً کمی صبر کنید یا با پشتیبانی هماهنگ کنید.`;
  }

  const priceText =
    product.minPrice === product.maxPrice
      ? formatToman(product.minPrice)
      : `از ${formatToman(product.minPrice)} تا ${formatToman(product.maxPrice)} (بسته به تنوع انتخابی)`;

  const discountNote = product.hasActiveDiscount ? " (شامل تخفیف فعال)" : "";
  return `قیمت «${product.name}»: ${priceText}${discountNote}`;
}

export function resolveStockReply(product: ResolvedProduct): string {
  return product.isInStock
    ? `بله، «${product.name}» موجود است. ✅`
    : `متاسفانه «${product.name}» فعلاً موجود نیست. 🙁`;
}

export function resolveBrandReply(product: ResolvedProduct): string {
  return product.brandName
    ? `«${product.name}» محصول برند ${product.brandName} است.`
    : `اطلاعات برند برای «${product.name}» ثبت نشده است.`;
}

export function resolveDiscountReply(product: ResolvedProduct): string {
  if (!product.hasActiveDiscount) {
    return `فعلاً تخفیف فعالی روی «${product.name}» نداریم.`;
  }
  return `بله، «${product.name}» الان تخفیف فعال دارد! ${resolvePriceReply(product)}`;
}

// intent هایی که به یک ویژگی خاص محصول (رنگ/سایز) مربوطند
function resolveVariantAttributeReply(
  product: ResolvedProduct,
  attributeInputTypeFilter: (inputType: string) => boolean,
  attributeLabel: string
): string {
  const availableValues = new Map<string, boolean>(); // value -> این مقدار حداقل در یک تنوع موجود است؟

  for (const variant of product.variants) {
    for (const av of variant.attributeValues) {
      if (!attributeInputTypeFilter(av.attributeInputType)) continue;
      const inStock = variant.stock > 0;
      availableValues.set(av.value, availableValues.get(av.value) || inStock);
    }
  }

  if (availableValues.size === 0) {
    return `«${product.name}» ${attributeLabel}‌بندی خاصی ندارد (تک‌مدل است).`;
  }

  const list = [...availableValues.entries()]
    .map(([value, inStock]) => `${value}${inStock ? "" : " (ناموجود)"}`)
    .join("، ");

  return `${attributeLabel}‌های موجود برای «${product.name}»: ${list}`;
}

export function resolveColorReply(product: ResolvedProduct): string {
  return resolveVariantAttributeReply(product, (inputType) => inputType === "COLOR", "رنگ");
}

export function resolveSizeReply(product: ResolvedProduct): string {
  return resolveVariantAttributeReply(product, (inputType) => inputType !== "COLOR", "سایز/مشخصات");
}

const RESOLVERS: Partial<Record<KeywordIntent, (product: ResolvedProduct) => string>> = {
  PRICE: resolvePriceReply,
  STOCK: resolveStockReply,
  BRAND: resolveBrandReply,
  DISCOUNT: resolveDiscountReply,
  COLOR: resolveColorReply,
  SIZE: resolveSizeReply,
};

export function resolveProductScopedIntent(intent: KeywordIntent, product: ResolvedProduct): string | null {
  return RESOLVERS[intent]?.(product) ?? null;
}
