import { Pool } from "pg";
import { ProductSearchResult } from "./types";

// ----------------------------------------------------------------------------
// روش دوم تشخیص محصول: وقتی مشتری کد محصول را نمی‌داند («کراپ مشکی دارید؟»).
// یک جست‌وجوی ساده‌ی متنی (ILIKE) روی نام/توضیح‌کوتاه/برند محصول می‌زنیم و
// چند گزینه‌ی نزدیک برمی‌گردانیم تا مشتری خودش انتخاب کند.
// ----------------------------------------------------------------------------

const STOPWORDS = new Set([
  "دارید",
  "دارین",
  "هست",
  "هستش",
  "آیا",
  "میخوام",
  "می‌خوام",
  "لطفا",
  "لطفاً",
  "قیمت",
  "چنده",
  "چقدره",
  "رنگ",
  "سایز",
]);

export function extractSearchTerms(text: string): string[] {
  return text
    .replace(/[?؟!.,،]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

export async function searchProducts(pool: Pool, text: string, limit = 5): Promise<ProductSearchResult[]> {
  const terms = extractSearchTerms(text);
  if (terms.length === 0) return [];

  const conditions = terms
    .map((_, i) => `(p.name ILIKE $${i + 1} OR p."shortDescription" ILIKE $${i + 1} OR b.name ILIKE $${i + 1})`)
    .join(" OR ");
  const params = terms.map((term) => `%${term}%`);

  const res = await pool.query<{
    id: number;
    name: string;
    slug: string;
    shortCode: string | null;
    minPrice: number;
    maxPrice: number;
    isInStock: boolean;
    mainImageUrl: string | null;
  }>(
    `SELECT p.id, p.name, p.slug, p."shortCode", p."minPrice", p."maxPrice", p."isInStock",
            m.url AS "mainImageUrl"
     FROM "Product" p
     LEFT JOIN "Brand" b ON b.id = p."brandId"
     LEFT JOIN "ProductImage" pi ON pi."productId" = p.id AND pi."isMain" = true
     LEFT JOIN "Media" m ON m.id = pi."mediaId"
     WHERE p.status = 'PUBLISHED' AND (${conditions})
     ORDER BY p."isInStock" DESC, p."totalSold" DESC
     LIMIT $${terms.length + 1}`,
    [...params, limit]
  );

  return res.rows;
}
