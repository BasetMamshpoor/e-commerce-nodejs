import { Pool } from "pg";
import { ProductSearchResult, SearchOutcome } from "./types";
import { parseProductQuery } from "./attributeExtraction";

// ----------------------------------------------------------------------------
// روش دوم تشخیص محصول: وقتی مشتری کد محصول را نمی‌داند. برخلاف قبل که فقط
// یک ILIKE ساده روی نام محصول بود، این نسخه جمله را تجزیه می‌کند (نام/نوع
// محصول + رنگ + سایز) و فیلتر رنگ/سایز را در سطح تنوع‌ها (variants) اعمال
// می‌کند — یعنی «کفش قهوه‌ای سایز ۴۲» واقعاً بین تنوع‌های کفش دنبال رنگ و
// سایز دقیق می‌گردد، نه فقط اسم محصول.
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
  "میخوام",
  "کنید",
  "کنم",
  "معرفی",
  "توضیح",
  "بده",
  "بدید",
  "این",
  "یه",
  "محصول",
  "محصولی",
  "جستجو",
  "جستجوی",
  "پیدا",
  "یک",
]);

export function extractSearchTerms(text: string): string[] {
  return text
    .replace(/[?؟!.,،]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

// اگر تعداد تطابق‌های واقعی از limit بیشتر باشد، یعنی جست‌وجو احتمالاً
// مبهم بوده (مثلاً فقط «کفش») — به‌جای نشان‌دادن یک لیست شلوغ، از مشتری
// می‌خواهیم دقیق‌تر بگوید (رجوع به layer1-keywords/index.ts)
export async function searchProducts(pool: Pool, text: string, limit = 5): Promise<SearchOutcome> {
  const parsed = parseProductQuery(text);
  return searchByParsedQuery(pool, parsed, limit);
}

export async function searchByParsedQuery(
  pool: Pool,
  parsed: { nameTerms: string[]; color?: string; size?: string },
  limit = 5
): Promise<SearchOutcome> {
  const { nameTerms, color, size } = parsed;
  if (nameTerms.length === 0 && !color && !size) {
    return { results: [], hasMore: false };
  }

  const conditions: string[] = ['p.status = \'PUBLISHED\''];
  const params: unknown[] = [];

  if (nameTerms.length > 0) {
    const nameConditions = nameTerms
      .map((term) => {
        params.push(`%${term}%`);
        const idx = params.length;
        return `(p.name ILIKE $${idx} OR p."shortDescription" ILIKE $${idx} OR b.name ILIKE $${idx})`;
      })
      .join(" OR ");
    conditions.push(`(${nameConditions})`);
  }

  if (color) {
    params.push(color);
    const idx = params.length;
    conditions.push(`EXISTS (
      SELECT 1 FROM "ProductVariant" cv
      JOIN "ProductVariantAttributeValue" cpvav ON cpvav."variantId" = cv.id
      JOIN "AttributeValue" cav ON cav.id = cpvav."attributeValueId"
      JOIN "Attribute" ca ON ca.id = cav."attributeId"
      WHERE cv."productId" = p.id AND ca."inputType" = 'COLOR' AND cav.value ILIKE $${idx}
    )`);
  }

  if (size) {
    params.push(`%${size}%`);
    const idx = params.length;
    conditions.push(`EXISTS (
      SELECT 1 FROM "ProductVariant" sv
      JOIN "ProductVariantAttributeValue" spvav ON spvav."variantId" = sv.id
      JOIN "AttributeValue" sav ON sav.id = spvav."attributeValueId"
      JOIN "Attribute" sa ON sa.id = sav."attributeId"
      WHERE sv."productId" = p.id AND sa."inputType" != 'COLOR' AND sav.value ILIKE $${idx}
    )`);
  }

  // یکی بیشتر از limit می‌گیریم تا بفهمیم «بیشتر هم هست یا نه» — بدون
  // نیاز به یک کوئری COUNT جداگانه
  params.push(limit + 1);
  const limitIdx = params.length;

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
     WHERE ${conditions.join(" AND ")}
     ORDER BY p."isInStock" DESC, p."totalSold" DESC
     LIMIT $${limitIdx}`,
    params
  );

  const hasMore = res.rows.length > limit;
  return { results: res.rows.slice(0, limit), hasMore };
}
