// ----------------------------------------------------------------------------
// کمک‌کننده‌های یکدست‌سازی پاسخ API برای فرانت‌اند:
//
// ۱) هرجا تصویری نمایش داده می‌شود، یک فیلد flat مثل `url`/`logoUrl`/
//    `imageUrl`/`avatarUrl` کنار همان شیء اصلی قرار می‌گیرد (علاوه بر شیء
//    `media`/`logo`/`image`/`avatar` تودرتو که برای دسترسی به alt/mimeType
//    و... نگه داشته می‌شود؛ فرانت می‌تواند هرکدام را که خواست استفاده کند).
// ۲) جدول‌های واسط (junction) مثل ProductCategory یا
//    ProductVariantAttributeValue قبل از ارسال به فرانت «صاف» می‌شوند —
//    یعنی فرانت مستقیم Category[] یا AttributeValue[] می‌بیند، نه ساختار
//    رابطه‌ی دیتابیسی.
//
// این فایل فقط presentation/serialization است؛ به دیتابیس کاری ندارد.
// ----------------------------------------------------------------------------
interface ProductImageLike {
  id: number;
  order: number;
  isMain: boolean;
  media?: { id: number; url: string; alt: string | null };
}

export function serializeProductImage(img: ProductImageLike) {
  return {
    id: img.id,
    url: img.media?.url ?? null,
    order: img.order,
    isMain: img.isMain,
  };
}

interface AttributeValueJunctionLike {
  attributeValue: {
    id: number;
    value: string;
    colorHex: string | null;
    order: number;
    attribute: { id: number; name: string; slug: string; inputType: string };
  };
}

export function serializeVariantAttributeValue(junction: AttributeValueJunctionLike) {
  const { attributeValue } = junction;
  return {
    id: attributeValue.id,
    value: attributeValue.value,
    colorHex: attributeValue.colorHex,
    order: attributeValue.order,
    attribute: attributeValue.attribute,
  };
}

interface VariantLike {
  attributeValues: AttributeValueJunctionLike[];
}

export function serializeVariant<T extends VariantLike>(variant: T) {
  return {
    ...variant,
    attributeValues: variant.attributeValues.map(serializeVariantAttributeValue),
  };
}

export interface ProductLike {
  images?: ProductImageLike[];
  categories?: { category: Record<string, unknown> }[];
  variants?: VariantLike[];
}

/** خروجی محصول (لیست یا جزئیات) را کاملاً برای فرانت آماده می‌کند:
 * brand.logoUrl، images[].url، categories به‌صورت Category[] تخت،
 * variants[].images[].url و variants[].attributeValues به‌صورت تخت.
 * هرکدام از images/categories/variants که در include نیامده باشند، نادیده
 * گرفته می‌شوند (مثلاً در لیست فروشگاه فقط یک تصویر اصلی می‌آید، نه variants).
 */
export function serializeProduct<T extends ProductLike>(product: T) {
  return {
    ...product,
    ...(product.images ? { images: product.images.map(serializeProductImage) } : {}),
    ...(product.categories
      ? { categories: product.categories.map((pc) => ({ ...pc.category, imageUrl: (pc.category as { imageUrl?: string }).imageUrl ?? null })) }
      : {}),
    ...(product.variants ? { variants: product.variants.map(serializeVariant) } : {}),
  };
}
