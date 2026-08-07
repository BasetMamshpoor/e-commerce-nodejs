import { IncomingMessage, EngineReply, ConversationContext } from "./types";
import { ProductLookupPort } from "./productMatcher/types";
import { runKeywordLayer } from "./layer1-keywords";
import { runAiLayer } from "./layer2-ai";
import { AiHistoryTurn } from "./layer2-ai/ai.types";

// ----------------------------------------------------------------------------
// یک پیام مشتری، مستقل از کانال (وب‌سایت/اینستاگرام/...)، از این pipeline
// عبور می‌کند: اول لایه ۱ (کلمات رزرو شده) امتحان می‌شود؛ اگر جوابی نداشت
// (یعنی هیچ کلمه‌ی رزرو شده‌ای پیدا نشد، و پاسخ به سوال معلقی هم نبود)،
// نوبت لایه ۲ (AI محدود به دیتابیس) می‌رسد. لایه ۳ (اپراتور) این‌جا اجرا
// نمی‌شود — فقط EngineReply.needsOperator را برمی‌گردانیم و تصمیم نهایی
// (تغییر وضعیت مکالمه/نوتیف اپراتور) به عهده‌ی conversation.service است.
//
// context (ConversationContext) هر دو لایه را از حافظه‌ی مکالمه آگاه
// می‌کند — چه پیام قبلی موتور منتظر چه پاسخی بود، و آخرین محصولی که در
// همین مکالمه شناسایی شده کدام است.
//
// توجه: engine/* اصلاً نمی‌داند دیتابیس Postgres است، SQL خام است یا پشت
// lookup کش Redis نشسته — فقط با ProductLookupPort کار می‌کند. این یعنی
// همین pipeline بدون هیچ تغییری هم در تست (پیاده‌سازی fake) و هم در
// production (پیاده‌سازی کش‌شده) کار می‌کند.
// ----------------------------------------------------------------------------

export async function runEnginePipeline(
  lookup: ProductLookupPort,
  message: IncomingMessage,
  history: AiHistoryTurn[],
  context: ConversationContext,
  tenantAiOverride?: string | null
): Promise<EngineReply> {
  const keywordReply = await runKeywordLayer(lookup, message, context);
  if (keywordReply) return keywordReply;

  return runAiLayer(lookup, message, history, context, tenantAiOverride);
}
