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

interface MediaLike {
  url: string;
  alt: string | null;
}

export function mediaUrl(media?: MediaLike | null): string | null {
  return media?.url ?? null;
}

interface ProductImageLike {
  id: string;
  mediaId: string;
  order: number;
  isMain: boolean;
  media: MediaLike;
}

export function serializeProductImage(img: ProductImageLike) {
  return {
    id: img.id,
    mediaId: img.mediaId,
    order: img.order,
    isMain: img.isMain,
    url: img.media.url,
    alt: img.media.alt,
    media: img.media,
  };
}

interface VariantImageLike {
  id: string;
  mediaId: string;
  order: number;
  media: MediaLike;
}

export function serializeVariantImage(img: VariantImageLike) {
  return {
    id: img.id,
    mediaId: img.mediaId,
    order: img.order,
    url: img.media.url,
    alt: img.media.alt,
    media: img.media,
  };
}

interface AttributeValueJunctionLike {
  attributeValue: {
    id: string;
    value: string;
    colorHex: string | null;
    order: number;
    attribute: { id: string; name: string; slug: string; inputType: string };
  };
}

/** جدول واسط ProductVariantAttributeValue را به یک AttributeValue تخت (با attribute تودرتو) تبدیل می‌کند */
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

interface CategoryLike {
  imageId: string | null;
  image?: MediaLike | null;
}

export function serializeCategory<T extends CategoryLike>(category: T) {
  return { ...category, imageUrl: mediaUrl(category.image) };
}

interface CategoryJunctionLike {
  category: CategoryLike;
}

interface BrandLike {
  logoId: string | null;
  logo?: MediaLike | null;
}

export function serializeBrand<T extends BrandLike>(brand: T) {
  return { ...brand, logoUrl: mediaUrl(brand.logo) };
}

interface ShippingCompanyLike {
  logoId: string | null;
  logo?: MediaLike | null;
}

export function serializeShippingCompany<T extends ShippingCompanyLike>(company: T) {
  return { ...company, logoUrl: mediaUrl(company.logo) };
}

interface UserLike {
  avatarId: string | null;
  avatar?: MediaLike | null;
}

export function serializeUserAvatar<T extends UserLike>(user: T) {
  return { ...user, avatarUrl: mediaUrl(user.avatar) };
}

interface VariantLike {
  images: VariantImageLike[];
  attributeValues: AttributeValueJunctionLike[];
}

export function serializeVariant<T extends VariantLike>(variant: T) {
  return {
    ...variant,
    images: variant.images.map(serializeVariantImage),
    attributeValues: variant.attributeValues.map(serializeVariantAttributeValue),
  };
}

export interface ProductLike {
  brand?: BrandLike | null;
  images?: ProductImageLike[];
  categories?: CategoryJunctionLike[];
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
    brand: product.brand ? serializeBrand(product.brand) : null,
    ...(product.images ? { images: product.images.map(serializeProductImage) } : {}),
    ...(product.categories
      ? { categories: product.categories.map((pc) => serializeCategory(pc.category)) }
      : {}),
    ...(product.variants ? { variants: product.variants.map(serializeVariant) } : {}),
  };
}

interface BlogPostLike {
  coverImageId: string | null;
  coverImage?: MediaLike | null;
}

export function serializeBlogPost<T extends BlogPostLike>(post: T) {
  return { ...post, coverImageUrl: mediaUrl(post.coverImage) };
}
