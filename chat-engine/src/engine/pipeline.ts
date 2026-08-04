import { IncomingMessage, EngineReply } from "./types";
import { ProductLookupPort } from "./productMatcher/types";
import { runKeywordLayer } from "./layer1-keywords";
import { runAiLayer } from "./layer2-ai";
import { AiHistoryTurn } from "./layer2-ai/ai.types";

// ----------------------------------------------------------------------------
// یک پیام مشتری، مستقل از کانال (وب‌سایت/اینستاگرام/...)، از این pipeline
// عبور می‌کند: اول لایه ۱ (کلمات رزرو شده) امتحان می‌شود؛ اگر جوابی نداشت
// (یعنی هیچ کلمه‌ی رزرو شده‌ای پیدا نشد)، نوبت لایه ۲ (AI محدود به دیتابیس)
// می‌رسد. لایه ۳ (اپراتور) این‌جا اجرا نمی‌شود — فقط EngineReply.needsOperator
// را برمی‌گردانیم و تصمیم نهایی (تغییر وضعیت مکالمه/نوتیف اپراتور) به عهده‌ی
// conversation.service است.
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
  tenantAiOverride?: "anthropic" | "openai" | null
): Promise<EngineReply> {
  const keywordReply = await runKeywordLayer(lookup, message);
  if (keywordReply) return keywordReply;

  return runAiLayer(lookup, message, history, tenantAiOverride);
}
