import { Pool } from "pg";
import { ProductLookupPort } from "../engine/productMatcher/types";
import { createDirectProductLookup } from "../engine/productMatcher/directLookup";
import { extractSearchTerms } from "../engine/productMatcher/productSearch";
import { RedisCacheService } from "../redis/redis-cache.service";

// ----------------------------------------------------------------------------
// همان ProductLookupPort، فقط جلوی هر متد یک لایه‌ی کش Redis نشسته. کلید
// همیشه tenant-scoped است (چون هر تنانت دیتابیس/محصولات جدا دارد).
//
// TTL ها عمداً کوتاه‌اند: قیمت/موجودی می‌تواند توسط ادمین هر لحظه عوض شود؛
// چند ثانیه بیات‌بودن برای یک ربات چت قابل قبول است، اما چند دقیقه نه.
// شمارش برندها تقریباً هیچ‌وقت عوض نمی‌شود، پس TTL بلندتری دارد.
// ----------------------------------------------------------------------------

const SHORT_CODE_TTL_SECONDS = 20;
const SEARCH_TTL_SECONDS = 20;
const BRAND_COUNT_TTL_SECONDS = 300;

export function createCachedProductLookup(pool: Pool, cache: RedisCacheService, tenantKey: string): ProductLookupPort {
  const direct = createDirectProductLookup(pool);

  return {
    findByShortCode: (code) => {
      const key = `product:code:${tenantKey}:${code.toLowerCase()}`;
      return cache.wrap(key, SHORT_CODE_TTL_SECONDS, () => direct.findByShortCode(code));
    },

    findById: (id) => {
      const key = `product:id:${tenantKey}:${id}`;
      return cache.wrap(key, SHORT_CODE_TTL_SECONDS, () => direct.findById(id));
    },

    search: (text, limit = 5) => {
      // کلید بر اساس کلمات معنادار استخراج‌شده است، نه متن خام — یعنی
      // «کراپ مشکی دارید؟» و «کراپ مشکی رو دارید؟» یک کلید کش می‌شوند.
      const normalizedTerms = extractSearchTerms(text).sort().join(",");
      const key = `product:search:${tenantKey}:${normalizedTerms}:${limit}`;
      return cache.wrap(key, SEARCH_TTL_SECONDS, () => direct.search(text, limit));
    },

    countActiveBrands: () => {
      const key = `product:brand-count:${tenantKey}`;
      return cache.wrap(key, BRAND_COUNT_TTL_SECONDS, () => direct.countActiveBrands());
    },
  };
}
