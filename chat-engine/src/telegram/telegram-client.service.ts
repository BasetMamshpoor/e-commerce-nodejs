import { Injectable, Logger } from "@nestjs/common";

// ----------------------------------------------------------------------------
// یک wrapper نازک روی Bot API تلگرام (https://core.telegram.org/bots/api).
// عمداً بدون هیچ SDK ای — چون نیازمان فقط چند متد ساده است و یک وابستگی
// کمتر یعنی سطح حمله و مشکل نسخه کمتر.
// ----------------------------------------------------------------------------

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: TelegramMessage;
  from: { id: number; first_name?: string; last_name?: string; username?: string };
}

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
}

export interface TelegramMessage {
  message_id: number;
  date: number;
  chat: { id: number; type: string };
  from?: { id: number; first_name?: string; last_name?: string; username?: string };
  text?: string;
  // رسانه — عمداً فقط file_id را نگه می‌داریم، خودِ فایل را دانلود/ذخیره نمی‌کنیم
  photo?: TelegramPhotoSize[];
  voice?: { file_id: string; duration: number };
  audio?: { file_id: string; duration: number };
  video?: { file_id: string };
  document?: { file_id: string; file_name?: string };
  sticker?: { file_id: string; emoji?: string };
}

// دکمه‌ی معمولی (زیر کیبورد) — فقط متن، تپ‌کردنش یعنی «همین متن را به‌عنوان
// پیام بفرست» (منوی سریع اصلی از همین نوع است)
export interface TelegramKeyboardButton {
  text: string;
}

export interface TelegramReplyKeyboard {
  keyboard: TelegramKeyboardButton[][];
  resize_keyboard?: boolean;
  is_persistent?: boolean;
}

// دکمه‌ی «شیشه‌ای» (inline) — چسبیده به خودِ پیام، تپ‌کردنش یک callback_query
// می‌فرستد (نه یک پیام معمولی) — برای انتخاب دقیق از چند گزینه استفاده می‌شود
export interface TelegramInlineButton {
  text: string;
  callback_data: string;
}

export interface TelegramInlineKeyboard {
  inline_keyboard: TelegramInlineButton[][];
}

export interface SendMessageOptions {
  replyMarkup?: TelegramReplyKeyboard | TelegramInlineKeyboard;
  // برای quote-کردن یک پیام مشخص از مشتری — چیزی که ویجت سایت اصلاً مفهومش
  // را ندارد ولی تلگرام به‌صورت بومی پشتیبانی می‌کند
  replyToMessageId?: number;
}

@Injectable()
export class TelegramClientService {
  private readonly logger = new Logger(TelegramClientService.name);

  private baseUrl(botToken: string): string {
    return `https://api.telegram.org/bot${botToken}`;
  }

  // --- Polling ---
  // long-polling: درخواست تا timeout ثانیه باز می‌ماند و به محض رسیدن
  // پیام جدید یا رسیدن به timeout برمی‌گردد؛ offset یعنی «آخرین
  // update_id ای که پردازش کردم + ۱» — تلگرام هر چیزی با id کمتر از این
  // را دیگر دوباره نمی‌فرستد. callback_query هم اینجا اضافه شده تا تپ روی
  // دکمه‌های شیشه‌ای هم از همین حلقه بیاید.
  async getUpdates(botToken: string, offset: number, timeoutSeconds = 30): Promise<TelegramUpdate[]> {
    const allowedUpdates = encodeURIComponent(JSON.stringify(["message", "callback_query"]));
    const url = `${this.baseUrl(botToken)}/getUpdates?offset=${offset}&timeout=${timeoutSeconds}&allowed_updates=${allowedUpdates}`;
    const res = await fetch(url);
    const data = (await res.json()) as { ok: boolean; result?: TelegramUpdate[]; description?: string };
    if (!data.ok) {
      throw new Error(`Telegram getUpdates failed: ${data.description ?? res.status}`);
    }
    return data.result ?? [];
  }

  async sendMessage(
    botToken: string,
    chatId: string | number,
    text: string,
    options: SendMessageOptions = {}
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl(botToken)}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...(options.replyMarkup ? { reply_markup: options.replyMarkup } : {}),
        ...(options.replyToMessageId ? { reply_parameters: { message_id: options.replyToMessageId } } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`sendMessage failed for chat ${chatId}: ${body}`);
    }
  }

  // برای نشان‌دادن یک گزینه‌ی محصول با عکس واقعی‌اش (caption = نام/قیمت/
  // موجودی) + دکمه‌ی شیشه‌ای «این رو میخوام» زیرش
  async sendPhoto(
    botToken: string,
    chatId: string | number,
    photoUrl: string,
    caption: string,
    replyMarkup?: TelegramInlineKeyboard
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl(botToken)}/sendPhoto`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`sendPhoto failed for chat ${chatId}: ${body}`);
    }
  }

  // بعد از تپ روی یک دکمه‌ی شیشه‌ای باید این را صدا زد، وگرنه دکمه در
  // حالت "در حال بارگذاری" (⏳) روی گوشی کاربر گیر می‌کند
  async answerCallbackQuery(botToken: string, callbackQueryId: string, text?: string): Promise<void> {
    await fetch(`${this.baseUrl(botToken)}/answerCallbackQuery`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
    });
  }

  // ----------------------------------------------------------------------------
  // «بدون ذخیره کردن» یعنی ما هیچ‌وقت خودِ فایل را دانلود/روی دیسک‌مان
  // نمی‌ریزیم — فقط لینک موقتِ دانلود مستقیم از سرورهای تلگرام را می‌سازیم
  // (هر بار که لازم شد، تازه). این لینک چند ساعت اعتبار دارد.
  // ----------------------------------------------------------------------------
  async getFileUrl(botToken: string, fileId: string): Promise<string> {
    const res = await fetch(`${this.baseUrl(botToken)}/getFile?file_id=${encodeURIComponent(fileId)}`);
    const data = (await res.json()) as { ok: boolean; result?: { file_path: string }; description?: string };
    if (!data.ok || !data.result) {
      throw new Error(`Telegram getFile failed: ${data.description ?? res.status}`);
    }
    return `https://api.telegram.org/file/bot${botToken}/${data.result.file_path}`;
  }

  // --- Webhook (برای وقتی تصمیم به تغییر از polling گرفته شد) ---
  async setWebhook(botToken: string, url: string, secretToken?: string): Promise<void> {
    const res = await fetch(`${this.baseUrl(botToken)}/setWebhook`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, secret_token: secretToken, allowed_updates: ["message", "callback_query"] }),
    });
    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!data.ok) {
      throw new Error(`Telegram setWebhook failed: ${data.description}`);
    }
    this.logger.log(`Webhook set to ${url}`);
  }

  async deleteWebhook(botToken: string): Promise<void> {
    await fetch(`${this.baseUrl(botToken)}/deleteWebhook`, { method: "POST" });
  }
}
