import { Pool } from "pg";
import { ResolvedProduct, ResolvedVariant, ProductLookupPort } from "./types";

// ----------------------------------------------------------------------------
// روش اول تشخیص محصول: کد کوتاه یکتایی که فروشنده زیر بیوگرافی/کپشن پست
// می‌گذارد (ستون "shortCode" جدول "Product"). اگر مشتری دقیقاً همین کد را
// بفرستد، محصول بدون هیچ ابهامی پیدا می‌شود.
//
// این کوئری‌ها SQL خام‌اند (بدون Prisma) و مستقیماً به Pool تنانتِ مربوطه
// وصل می‌شوند — نام جدول/ستون‌ها دقیقاً همان‌هایی است که Prisma در پروژه‌ی
// بک‌اند اصلی تولید می‌کند (بدون @@map، یعنی نام مدل = نام جدول).
// ----------------------------------------------------------------------------

export const PRODUCT_CODE_PATTERN = /\b([A-Za-z0-9\-]{3,20})\b/g;

export async function findProductByShortCode(pool: Pool, rawCode: string): Promise<ResolvedProduct | null> {
  const code = rawCode.trim();
  if (!code) return null;

  const productRes = await pool.query<{
    id: number;
    name: string;
    slug: string;
    shortCode: string | null;
    shortDescription: string | null;
    minPrice: number;
    maxPrice: number;
    isInStock: boolean;
    hasActiveDiscount: boolean;
    brandName: string | null;
  }>(
    `SELECT p.id, p.name, p.slug, p."shortCode", p."shortDescription",
            p."minPrice", p."maxPrice", p."isInStock", p."hasActiveDiscount",
            b.name AS "brandName"
     FROM "Product" p
     LEFT JOIN "Brand" b ON b.id = p."brandId"
     WHERE p."shortCode" = $1 AND p.status = 'PUBLISHED'
     LIMIT 1`,
    [code]
  );

  const product = productRes.rows[0];
  if (!product) return null;

  const variants = await loadVariantsWithAttributes(pool, product.id);

  return { ...product, variants };
}

async function loadVariantsWithAttributes(pool: Pool, productId: number): Promise<ResolvedVariant[]> {
  const rowsRes = await pool.query<{
    variantId: number;
    sku: string;
    priceAdjustment: number;
    stock: number;
    attributeName: string | null;
    attributeInputType: string | null;
    value: string | null;
  }>(
    `SELECT v.id AS "variantId", v.sku, v."priceAdjustment", v.stock,
            a.name AS "attributeName", a."inputType" AS "attributeInputType", av.value
     FROM "ProductVariant" v
     LEFT JOIN "ProductVariantAttributeValue" pvav ON pvav."variantId" = v.id
     LEFT JOIN "AttributeValue" av ON av.id = pvav."attributeValueId"
     LEFT JOIN "Attribute" a ON a.id = av."attributeId"
     WHERE v."productId" = $1 AND v."isActive" = true
     ORDER BY v.id`,
    [productId]
  );

  const variantsById = new Map<number, ResolvedVariant>();
  for (const row of rowsRes.rows) {
    let variant = variantsById.get(row.variantId);
    if (!variant) {
      variant = { id: row.variantId, sku: row.sku, priceAdjustment: row.priceAdjustment, stock: row.stock, attributeValues: [] };
      variantsById.set(row.variantId, variant);
    }
    if (row.attributeName && row.attributeInputType && row.value) {
      variant.attributeValues.push({
        attributeName: row.attributeName,
        attributeInputType: row.attributeInputType,
        value: row.value,
      });
    }
  }

  return [...variantsById.values()];
}

// در متن پیام مشتری دنبال توکن‌هایی می‌گردیم که ممکن است کد محصول باشند و
// هرکدام را چک می‌کنیم (بیشتر پیام‌ها یک یا دو توکن این‌شکلی دارند، پس
// هزینه‌ی این چند lookup ناچیز است — و هرکدام هم جداگانه از پشت
// ProductLookupPort رد می‌شود، یعنی اگر پیاده‌سازی کش‌شده باشد، هر کد به‌طور
// جداگانه کش می‌شود، نه کل جمله).
export async function findProductByShortCodeInText(
  lookup: Pick<ProductLookupPort, "findByShortCode">,
  text: string
): Promise<ResolvedProduct | null> {
  const candidates = text.match(PRODUCT_CODE_PATTERN) ?? [];
  for (const candidate of candidates) {
    const product = await lookup.findByShortCode(candidate);
    if (product) return product;
  }
  return null;
}
