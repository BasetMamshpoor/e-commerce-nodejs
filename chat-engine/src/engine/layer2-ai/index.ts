import { env } from "../../config/env";
import { IncomingMessage, EngineReply, ConversationContext } from "../types";
import { ProductLookupPort } from "../productMatcher/types";
import { buildGroundedContext } from "./contextBuilder";
import { getAiProvider } from "./factory";
import { AiHistoryTurn } from "./ai.types";

// ----------------------------------------------------------------------------
// لایه ۲: وقتی لایه ۱ (کلمات رزرو شده) نتوانست پاسخ بدهد. هوش مصنوعی فقط با
// context ای که از دیتابیس فروشگاه ساخته‌ایم صحبت می‌کند — هیچ دانش عمومی/
// اینترنتی اجازه‌ی استفاده ندارد. اگر اطمینان مدل از AI_CONFIDENCE_THRESHOLD
// کمتر باشد، needsOperator=true برمی‌گردد تا لایه ۳ مکالمه را دست بگیرد.
// ----------------------------------------------------------------------------

const SYSTEM_PROMPT_TEMPLATE = (dbContext: string) => `
تو دستیار پاسخگوی فروشگاه اینترنتی هستی. فقط و فقط بر اساس اطلاعاتی که در
بخش «اطلاعات دیتابیس» زیر آمده پاسخ بده. هرگز از دانش عمومی خودت، اینترنت،
یا هر منبع دیگری خارج از همین اطلاعات استفاده نکن. اگر پاسخ سوال مشتری در
این اطلاعات نبود، صادقانه بگو نمی‌دانی و confidence را پایین گزارش کن (به
جای حدس‌زدن).

لحن پاسخ باید کوتاه، محاوره‌ای، دوستانه و فارسی باشد — مثل یک فروشنده‌ی
واقعی که مودبانه و مستقیم جواب می‌دهد.

خروجی را دقیقاً و فقط به‌صورت یک JSON با همین شکل بده (بدون هیچ متن اضافه‌ی
قبل یا بعدش):
{"reply": "متن پاسخ فارسی", "confidence": عددی بین 0 تا 1}

قانون تعیین confidence:
- اگر سوال کاملاً بر اساس اطلاعات دیتابیس زیر قابل پاسخ است: بین 0.7 تا 1
- اگر تا حدی مرتبط است ولی مطمئن نیستی: بین 0.3 تا 0.7
- اگر اطلاعات دیتابیس هیچ ربطی به سوال ندارد یا سوال نیاز به تصمیم/استثنا
  دارد (مثل چانه‌زنی روی قیمت، شکایت، مرجوعی خاص): زیر 0.3

اطلاعات دیتابیس:
${dbContext || "(اطلاعات مرتبطی در دیتابیس پیدا نشد)"}
`.trim();

export async function runAiLayer(
  lookup: ProductLookupPort,
  message: IncomingMessage,
  history: AiHistoryTurn[],
  conversationContext: ConversationContext,
  tenantAiOverride?: string | null
): Promise<EngineReply> {
  const dbContext = await buildGroundedContext(lookup, message.text, conversationContext);
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE(dbContext);
  const provider = getAiProvider(tenantAiOverride);

  try {
    const result = await provider.answer({ systemPrompt, history, customerMessage: message.text });
    return {
      layer: "AI",
      text: result.text,
      confidence: result.confidence,
      needsOperator: result.confidence < env.AI_CONFIDENCE_THRESHOLD,
      metadata: { provider: provider.name },
    };
  } catch (err) {
    // اگر سرویس AI در دسترس نبود (کلید تنظیم نشده/قطعی سرویس)، به‌جای کرش
    // کردن، مستقیم مکالمه را برای اپراتور علامت می‌زنیم.
    return {
      layer: "AI",
      text: "الان نمی‌تونم دقیق جواب بدم، همین الان یکی از همکارها بهتون پاسخ می‌ده.",
      confidence: 0,
      needsOperator: true,
      metadata: { provider: provider.name, error: err instanceof Error ? err.message : String(err) },
    };
  }
}
