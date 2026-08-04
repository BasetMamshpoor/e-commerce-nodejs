// ----------------------------------------------------------------------------
// شکل داده‌ای که موتور بعد از خواندن مستقیم از دیتابیس فروشگاه (SQL خام) با
// آن کار می‌کند. عمداً «مسطح» و ساده نگه داشته شده تا وابسته به هیچ کلاینت
// تولیدشده‌ای (مثل Prisma Client) نباشد.
// ----------------------------------------------------------------------------

export interface VariantAttributeValue {
  attributeName: string;
  attributeInputType: string; // TEXT | COLOR | SELECT
  value: string;
}

export interface ResolvedVariant {
  id: number;
  sku: string;
  priceAdjustment: number;
  stock: number;
  attributeValues: VariantAttributeValue[];
}

export interface ResolvedProduct {
  id: number;
  name: string;
  slug: string;
  shortCode: string | null;
  shortDescription: string | null;
  brandName: string | null;
  minPrice: number;
  maxPrice: number;
  isInStock: boolean;
  hasActiveDiscount: boolean;
  variants: ResolvedVariant[];
}

export interface ProductSearchResult {
  id: number;
  name: string;
  slug: string;
  shortCode: string | null;
  minPrice: number;
  maxPrice: number;
  isInStock: boolean;
  mainImageUrl: string | null;
}

// ----------------------------------------------------------------------------
// engine/* هیچ‌وقت مستقیماً pg.Pool صدا نمی‌زند — همیشه از پشت این port.
// دلیلش صرفاً تمیزی معماری نیست: این نقطه‌ای است که یک لایه‌ی کش (Redis)
// می‌تواند شفاف جلوی کوئری‌های واقعی Postgres بنشیند، بدون این‌که engine/*
// اصلاً بداند کش وجود دارد یا نه (پیاده‌سازی «مستقیم» در directLookup.ts و
// پیاده‌سازی «کش‌شده» در src/store/cached-product-lookup.ts هر دو همین
// اینترفیس را برآورده می‌کنند).
// ----------------------------------------------------------------------------
export interface ProductLookupPort {
  findByShortCode(code: string): Promise<ResolvedProduct | null>;
  search(text: string, limit?: number): Promise<ProductSearchResult[]>;
  countActiveBrands(): Promise<number>;
}
