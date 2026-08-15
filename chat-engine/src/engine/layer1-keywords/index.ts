import { IncomingMessage, EngineReply, ConversationContext, PendingAction } from "../types";
import { matchIntents } from "./matcher";
import { PRODUCT_SCOPED_INTENTS, KeywordIntent } from "./keywords.config";
import { findProductByShortCodeInText } from "../productMatcher/productCode";
import { ProductLookupPort, ResolvedProduct } from "../productMatcher/types";
import { parseProductQuery } from "../productMatcher/attributeExtraction";
import { resolveProductScopedIntent } from "./resolvers/productIntent.resolver";
import { resolveGenericIntent } from "./resolvers/generic.resolver";
import {
  buildSearchOptionsReply,
  buildAskForCodeReply,
  buildAskWhatProductReply,
  buildNarrowSearchReply,
} from "./resolvers/searchOptions.resolver";
import { parseOptionSelection } from "./parseOptionSelection";

// حداکثر تعداد کاندیدی که با گزینه نشان می‌دهیم؛ بیشتر از این یعنی
// جست‌وجو مبهم بوده و باید از مشتری دقیق‌تر بخواهیم
const MAX_OPTIONS = 5;

// ----------------------------------------------------------------------------
// لایه ۱: تشخیص کلمات رزرو شده در متن مشتری و پاسخ‌دادن مستقیم از دیتابیس
// فروشگاه — اما نه فقط بر اساس همین یک پیام تنها. قبل از هر چیز چک می‌کند
// آیا این پیام «پاسخ به سوالی است که خودِ موتور همین الان پرسیده» (مثلاً
// «کد محصول رو بفرست»، «کدوم گزینه؟»، یا «دقیق‌تر بگو») یا ادامه‌ی طبیعی
// همان محصولی است که چند پیام قبل درباره‌اش صحبت شده — نه یک پیام تازه و
// بی‌ربط.
//
// اگر هیچ کلمه‌ی رزرو شده‌ای در متن نبود (و پاسخ به هیچ سوال معلقی هم نبود)،
// null برمی‌گردد تا pipeline اصلی سراغ لایه ۲ (AI) برود.
// ----------------------------------------------------------------------------

export async function runKeywordLayer(
  lookup: ProductLookupPort,
  message: IncomingMessage,
  context: ConversationContext
): Promise<EngineReply | null> {
  // مرحله‌ی صفر: اگر خودِ موتور در پیام قبلی منتظر پاسخ خاصی بود، اول همان
  // را امتحان کن — پیام مشتری اینجا لزوماً کلمه‌ی رزرو شده‌ای هم ندارد
  // (مثلاً فقط «13» یا «۲» یا «اسپورت کتان»)، برای همین این چک باید قبل
  // از matchIntents باشد.
  if (context.pendingAction) {
    const resolved = await resolvePendingAction(lookup, message, context.pendingAction);
    if (resolved) return resolved;
    // اگر resolve نشد، یعنی مشتری موضوع را عوض کرده — می‌رویم روال عادی زیر
  }

  const intents = matchIntents(message.text);
  if (intents.length === 0) return null;

  const primaryIntent = intents[0];

  // intent هایی که به یک محصول خاص وابسته نیستند (نحوه سفارش، ارسال و ...)
  if (!PRODUCT_SCOPED_INTENTS.has(primaryIntent)) {
    const text = resolveGenericIntent(primaryIntent);
    if (!text) return null;

    // درخواست مستقیم صحبت با پشتیبانی — به‌جای پاسخ‌دادن، مستقیم به لایه ۳
    // ارجاع می‌دهیم (نه لایه ۲/AI که فقط سوال‌های واقعی را جواب می‌دهد)
    const needsOperator = primaryIntent === "CONTACT_SUPPORT";

    return {
      layer: "KEYWORD",
      text,
      confidence: 1,
      needsOperator,
      metadata: { intent: primaryIntent },
    };
  }

  // روش اول: کد محصول مستقیم در متن پیام
  let product = await findProductByShortCodeInText(lookup, message.text);
  let matchedBy = "shortCode";

  // روش دوم: کدی در متن نبود — ولی اگر همین مکالمه قبلاً روی یک محصول
  // مشخص فوکوس داشته، فرض می‌کنیم این سوال هم درباره‌ی همان محصول است
  // («قیمتش چنده؟» → بعداً «رنگاش چی داره؟» بدون تکرار کد)
  if (!product && context.lastProductId) {
    product = await lookup.findById(context.lastProductId);
    matchedBy = "contextCarryover";
  }

  if (product) {
    const text = resolveProductScopedIntent(primaryIntent, product);
    if (text) {
      return {
        layer: "KEYWORD",
        text,
        confidence: 1,
        needsOperator: false,
        metadata: { intent: primaryIntent, productId: product.id, matchedBy },
      };
    }
  }

  // روش سوم: هیچ محصولی (نه از متن، نه از تاریخچه) پیدا نشد — جست‌وجوی
  // متنی و ساختاریافته (نام/رنگ/سایز، بین تنوع‌ها هم می‌گردد)
  return performSearchStep(lookup, message, primaryIntent, message.text);
}

// ----------------------------------------------------------------------------
// جست‌وجو می‌زند و بر اساس تعداد نتایج تصمیم می‌گیرد: صفر نتیجه → درخواست
// کد؛ خیلی زیاد (مبهم) → درخواست دقیق‌تر بگو (و queryText را برای ترکیب با
// پیام بعدی نگه می‌دارد)؛ در غیر این صورت → لیست گزینه‌ها (با شناسه‌ی
// دقیق هرکدام برای انتخاب بعدی).
// ----------------------------------------------------------------------------
async function performSearchStep(
  lookup: ProductLookupPort,
  message: IncomingMessage,
  primaryIntent: KeywordIntent,
  queryText: string
): Promise<EngineReply> {
  const parsed = parseProductQuery(queryText);
  const hasCriteria = parsed.nameTerms.length > 0 || Boolean(parsed.color) || Boolean(parsed.size);

  // فقط برای intent عمومی INFO (مثلاً دکمه‌ی «جستجوی محصول») معنا دارد که
  // بپرسیم «دنبال چی هستید؟» — برای intent های خاص مثل PRICE/STOCK با
  // معیار خالی («قیمت این چنده؟» بدون گفتن کدوم محصول)، مشتری معلومه یک
  // محصول خاص را در ذهن دارد، پس مسیر معمول «کد رو بفرست» درست‌تر است.
  if (!hasCriteria && primaryIntent === "INFO") {
    const pendingAction: PendingAction = { type: "AWAITING_NARROWER_SEARCH", intent: primaryIntent, previousQuery: "" };
    return {
      layer: "KEYWORD",
      text: buildAskWhatProductReply(),
      confidence: 1,
      needsOperator: false,
      metadata: { intent: primaryIntent, matchedBy: "search-empty-query", pendingAction },
    };
  }

  const { results, hasMore } = await lookup.search(queryText, MAX_OPTIONS);

  if (results.length === 0) {
    const pendingAction: PendingAction = { type: "AWAITING_PRODUCT_CODE", intent: primaryIntent };
    return {
      layer: "KEYWORD",
      text: buildAskForCodeReply(message.channel),
      confidence: 1,
      needsOperator: false,
      metadata: { intent: primaryIntent, matchedBy: "search", pendingAction },
    };
  }

  if (hasMore) {
    // نتایج بیشتر از MAX_OPTIONS بود — احتمالاً پرس‌وجو مبهم است؛ به‌جای
    // یک لیست شلوغ، از مشتری دقیق‌تر می‌خواهیم و متن فعلی را نگه می‌داریم
    const pendingAction: PendingAction = { type: "AWAITING_NARROWER_SEARCH", intent: primaryIntent, previousQuery: queryText };
    return {
      layer: "KEYWORD",
      text: buildNarrowSearchReply(),
      confidence: 1,
      needsOperator: false,
      metadata: { intent: primaryIntent, matchedBy: "search-too-broad", pendingAction },
    };
  }

  const pendingAction: PendingAction = {
    type: "AWAITING_OPTION_SELECTION",
    intent: primaryIntent,
    candidateProductIds: results.map((r) => r.id),
  };

  return {
    layer: "KEYWORD",
    text: buildSearchOptionsReply(message.channel, results),
    confidence: 1,
    needsOperator: false,
    metadata: {
      intent: primaryIntent,
      matchedBy: "search",
      // لیست کامل (با عکس/قیمت) برای کانال‌هایی مثل تلگرام که می‌توانند
      // هرکدام را با عکس و دکمه‌ی جداگانه نشان بدهند — engine خودش کاری
      // با این فیلد ندارد، فقط برای مصرف لایه‌ی کانال ذخیره می‌شود
      searchResults: results,
      pendingAction,
    },
  };
}

// ----------------------------------------------------------------------------
// تلاش برای تفسیر پیام مشتری به‌عنوان پاسخ به سوالی که موتور قبلاً پرسیده.
// اگر پیام اصلاً شبیه پاسخ نبود (مثلاً موضوع را عوض کرده)، null برمی‌گرداند
// تا caller روال عادی تشخیص intent را ادامه بدهد — نه اینکه به‌زور تفسیرش کند.
// ----------------------------------------------------------------------------
async function resolvePendingAction(
  lookup: ProductLookupPort,
  message: IncomingMessage,
  pending: PendingAction
): Promise<EngineReply | null> {
  if (pending.type === "AWAITING_PRODUCT_CODE") {
    const trimmed = message.text.trim();
    // در این حالت با اطمینان بیشتر کل پیام را هم به‌عنوان کد امتحان می‌کنیم
    // (نه فقط توکن‌های regex-match شده)، چون می‌دانیم دقیقاً همین را خواسته بودیم
    const product = (await lookup.findByShortCode(trimmed)) ?? (await findProductByShortCodeInText(lookup, message.text));
    if (!product) return null;

    return buildResolvedReply(pending.intent, product, "pendingCode");
  }

  if (pending.type === "AWAITING_OPTION_SELECTION") {
    const index = parseOptionSelection(message.text, pending.candidateProductIds.length);
    if (index === null) return null;

    const productId = pending.candidateProductIds[index - 1];
    const product = await lookup.findById(productId);
    if (!product) return null;

    return buildResolvedReply(pending.intent, product, "pendingOptionSelection");
  }

  if (pending.type === "AWAITING_NARROWER_SEARCH") {
    // متن قبلی («کفش») را با پیام تازه («اسپورت کتان») ترکیب می‌کنیم تا
    // جست‌وجوی دقیق‌تری بزنیم؛ همان تصمیم‌گیریِ ۰/زیاد/چندتا دوباره اجرا
    // می‌شود — اگر بازهم مبهم بود، دوباره AWAITING_NARROWER_SEARCH می‌شود
    const combinedQuery = `${pending.previousQuery} ${message.text}`.trim();
    return performSearchStep(lookup, message, pending.intent as KeywordIntent, combinedQuery);
  }

  return null;
}

function buildResolvedReply(intentValue: string, product: ResolvedProduct, matchedBy: string): EngineReply {
  const intent = intentValue as KeywordIntent;
  const text = resolveProductScopedIntent(intent, product) ?? `«${product.name}» رو پیدا کردم.`;
  return {
    layer: "KEYWORD",
    text,
    confidence: 1,
    needsOperator: false,
    metadata: { intent, productId: product.id, matchedBy },
  };
}
