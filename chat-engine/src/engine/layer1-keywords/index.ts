import { IncomingMessage, EngineReply } from "../types";
import { matchIntents } from "./matcher";
import { PRODUCT_SCOPED_INTENTS } from "./keywords.config";
import { findProductByShortCodeInText } from "../productMatcher/productCode";
import { ProductLookupPort } from "../productMatcher/types";
import { resolveProductScopedIntent } from "./resolvers/productIntent.resolver";
import { resolveGenericIntent } from "./resolvers/generic.resolver";
import { buildSearchOptionsReply, buildAskForCodeReply } from "./resolvers/searchOptions.resolver";

// ----------------------------------------------------------------------------
// لایه ۱: تشخیص کلمات رزرو شده در متن مشتری و پاسخ‌دادن مستقیم از دیتابیس
// فروشگاه (از پشت lookup — ممکن است پیاده‌سازی مستقیم یا کش‌شده باشد، این
// لایه فرقی نمی‌کند)، بدون درگیرکردن هوش مصنوعی. اگر هیچ کلمه‌ی رزرو
// شده‌ای در متن نبود، null برمی‌گردد تا pipeline اصلی سراغ لایه ۲ (AI) برود.
// ----------------------------------------------------------------------------

export async function runKeywordLayer(lookup: ProductLookupPort, message: IncomingMessage): Promise<EngineReply | null> {
  const intents = matchIntents(message.text);
  if (intents.length === 0) return null;

  const primaryIntent = intents[0];

  // intent هایی که به یک محصول خاص وابسته نیستند (نحوه سفارش، ارسال و ...)
  if (!PRODUCT_SCOPED_INTENTS.has(primaryIntent)) {
    const text = resolveGenericIntent(primaryIntent);
    if (!text) return null;
    return { layer: "KEYWORD", text, confidence: 1, needsOperator: false, metadata: { intent: primaryIntent } };
  }

  // روش اول: کد محصول مستقیم در متن پیام
  const product = await findProductByShortCodeInText(lookup, message.text);
  if (product) {
    const text = resolveProductScopedIntent(primaryIntent, product);
    if (text) {
      return {
        layer: "KEYWORD",
        text,
        confidence: 1,
        needsOperator: false,
        metadata: { intent: primaryIntent, productId: product.id, matchedBy: "shortCode" },
      };
    }
  }

  // روش دوم: کد محصول نداریم — جست‌وجوی متنی و ارائه‌ی گزینه‌های نزدیک
  const results = await lookup.search(message.text);
  const text = results.length > 0 ? buildSearchOptionsReply(results) : buildAskForCodeReply();

  return {
    layer: "KEYWORD",
    text,
    confidence: 1,
    needsOperator: false,
    metadata: {
      intent: primaryIntent,
      matchedBy: "search",
      candidateProductIds: results.map((r) => r.id),
    },
  };
}
