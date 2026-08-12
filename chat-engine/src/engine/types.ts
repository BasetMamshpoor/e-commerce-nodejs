// ----------------------------------------------------------------------------
// تایپ‌های مشترک بین لایه‌های موتور پاسخگو.
// هر آداپتور کانال (وب‌سایت، اینستاگرام، واتساپ، تلگرام، بله) موظف است
// پیام ورودی خودش را به IncomingMessage تبدیل کند و همین یک pipeline مشترک
// (engine/pipeline.ts) را صدا بزند — منطق پاسخگویی یک‌جا و مستقل از کانال
// نوشته می‌شود.
// ----------------------------------------------------------------------------

import { Channel } from "../models/customer.model";
import { EngineLayer } from "../models/message.model";

export interface IncomingMessage {
  channel: Channel;
  // شناسه‌ی مشتری در همان پلتفرم (guestToken/userId برای وب‌سایت، IGSID
  // برای اینستاگرام و ...)
  externalCustomerId: string;
  displayName?: string;
  // اگر مشتری در وب‌سایت لاگین کرده، شناسه‌ی User سایت اصلی
  storeUserId?: number;
  text: string;
  // شناسه‌ی پیام در پلتفرم مبدا، برای جلوگیری از پردازش دوباره‌ی وبهوک تکراری
  externalMessageId?: string;
  // شناسه‌ی نخِ مکالمه در پلتفرم مبدا (مثلاً برای فوروارد پست/استوری)
  externalThreadId?: string;
  // اگر true باشد، هیچ لایه‌ی خودکاری (۱/۲) اجرا نمی‌شود و مکالمه مستقیم
  // NEEDS_OPERATOR می‌شود — برای رسانه‌هایی (عکس/صوت) که موتور اصلاً
  // نمی‌تواند پردازششان کند
  forceEscalate?: boolean;
  // اطلاعات کمکی رسانه (مثلاً telegramFileId) — روی همان پیام مشتری در
  // Mongo ذخیره می‌شود تا اپراتور بعداً بتواند نمایشش بدهد، بدون این‌که
  // خودِ فایل جایی ذخیره شود
  attachmentMetadata?: Record<string, unknown>;
}

export interface EngineReply {
  layer: EngineLayer;
  text: string;
  // اطمینان پاسخ بین ۰ و ۱ — لایه ۱ همیشه ۱ است (چون قطعی/rule-based است)،
  // لایه ۲ توسط خودِ AI provider تخمین زده می‌شود
  confidence: number;
  // اطلاعات کمکی برای ثبت در ConversationMessage.metadata (دیباگ/آنالیز)
  metadata?: Record<string, unknown>;
  // اگر true باشد، یعنی هیچ لایه‌ای اطمینان کافی نداشت و باید به اپراتور ارجاع شود
  needsOperator: boolean;
}

// ----------------------------------------------------------------------------
// حافظه‌ی مکالمه — همان چیزی که به لایه ۱ اجازه می‌دهد پیام بعدی مشتری را
// در متن گفتگو بفهمد، نه به‌عنوان یک پیام تازه و بی‌ربط:
//
// - pendingAction: دقیقاً همان چیزی که آخرین پیام موتور از مشتری خواسته
//   بود (مثلاً «کد محصول رو بفرست» یا «یکی از گزینه‌ها رو انتخاب کن»).
//   فقط برای همان یک نوبت بعدی معتبر است.
// - lastProductId: آخرین محصولی که در این مکالمه با اطمینان شناسایی شد.
//   وقتی مشتری بدون تکرار کد می‌پرسد «رنگاش چی داره؟»، همین به کار می‌آید.
// ----------------------------------------------------------------------------

export type PendingAction =
  | { type: "AWAITING_PRODUCT_CODE"; intent: string }
  | { type: "AWAITING_OPTION_SELECTION"; intent: string; candidateProductIds: number[] };

export interface ConversationContext {
  pendingAction?: PendingAction;
  lastProductId?: number;
}
