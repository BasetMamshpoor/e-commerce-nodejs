import { Pool } from "pg";
import { ProductLookupPort } from "./types";
import { findProductByShortCode } from "./productCode";
import { searchProducts } from "./productSearch";
import { countActiveBrands } from "./storeStats";

// ----------------------------------------------------------------------------
// پیاده‌سازی «مستقیم» ProductLookupPort — هر صدازدن یعنی یک کوئری واقعی به
// Postgres. برای تست‌ها و به‌عنوان لایه‌ی زیرین پیاده‌سازی کش‌شده استفاده
// می‌شود (src/store/cached-product-lookup.ts).
// ----------------------------------------------------------------------------

export function createDirectProductLookup(pool: Pool): ProductLookupPort {
  return {
    findByShortCode: (code) => findProductByShortCode(pool, code),
    search: (text, limit) => searchProducts(pool, text, limit),
    countActiveBrands: () => countActiveBrands(pool),
  };
}
