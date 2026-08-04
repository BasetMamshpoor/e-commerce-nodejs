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
