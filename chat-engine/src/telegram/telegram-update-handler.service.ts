import { Injectable, Logger } from "@nestjs/common";
import { TenantDocument } from "../tenancy/tenant.model";
import { MessageService, DuplicateMessageError } from "../conversation/message.service";
import { TelegramClientService, TelegramUpdate, TelegramMessage } from "./telegram-client.service";
import { TELEGRAM_REPLY_KEYBOARD, WELCOME_MESSAGE, resolveMenuButtonTriggerText } from "./telegram-menu";

// ----------------------------------------------------------------------------
// این سرویس تنها جایی است که یک TelegramUpdate را به IncomingMessage
// (فرمت مشترک همه‌ی کانال‌ها) تبدیل می‌کند و از pipeline موتور رد می‌کند.
// چه از طریق polling صدا زده شود چه از طریق webhook، رفتار دقیقاً یکسان
// است — سوییچ‌کردن روش دریافت پیام هیچ اثری روی این منطق ندارد.
// ----------------------------------------------------------------------------

@Injectable()
export class TelegramUpdateHandlerService {
  private readonly logger = new Logger(TelegramUpdateHandlerService.name);

  constructor(
    private readonly messageService: MessageService,
    private readonly telegramClient: TelegramClientService
  ) {}

  async handle(tenant: TenantDocument, update: TelegramUpdate): Promise<void> {
    const message = update.message;
    if (!message) return;

    const botToken = tenant.telegramBotToken;
    if (!botToken) return;

    // /start — خوش‌آمد + نصب منوی دکمه‌های سریع (کیبورد persistent)؛ این
    // خودش پیامی نیست که باید از موتور رد شود
    if (message.text?.trim().startsWith("/start")) {
      await this.telegramClient.sendMessage(botToken, message.chat.id, WELCOME_MESSAGE, {
        replyMarkup: TELEGRAM_REPLY_KEYBOARD,
      });
      return;
    }

    const displayName =
      [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") || message.from?.username;

    const mediaInfo = describeMediaMessage(message);

    try {
      if (mediaInfo) {
        // بدون دانلود/ذخیره‌ی خودِ فایل — فقط file_id را نگه می‌داریم تا
        // اپراتور هروقت خواست، لحظه‌ای از تلگرام بخواندش
        // (رجوع کنید به OperatorController.getMedia)
        await this.messageService.processIncomingMessage(tenant, {
          channel: "TELEGRAM",
          externalCustomerId: String(message.chat.id),
          displayName,
          text: mediaInfo.placeholderText,
          externalMessageId: `${message.chat.id}:${message.message_id}`,
          externalThreadId: String(message.chat.id),
          forceEscalate: true,
          attachmentMetadata: { telegramFileId: mediaInfo.fileId, kind: mediaInfo.kind },
        });

        await this.telegramClient.sendMessage(
          botToken,
          message.chat.id,
          "دریافت شد ✅ این مورد رو برای پشتیبانی ارسال کردم، چند لحظه صبر کنید."
        );
        return;
      }

      if (!message.text) return; // نوع پیام پشتیبانی‌نشده (مثلاً لوکیشن، contact و ...)

      // اگر متن دقیقاً یکی از دکمه‌های منوی سریع بود، با عبارت محرک معادلش
      // جایگزین می‌کنیم — از همین‌جا به بعد دقیقاً مثل یک پیام معمولی
      // پردازش می‌شود (همان لایه ۱، همان حافظه‌ی مکالمه)
      const text = resolveMenuButtonTriggerText(message.text) ?? message.text;

      const result = await this.messageService.processIncomingMessage(tenant, {
        channel: "TELEGRAM",
        externalCustomerId: String(message.chat.id),
        displayName,
        text,
        externalMessageId: `${message.chat.id}:${message.message_id}`,
        externalThreadId: String(message.chat.id),
      });

      if (result.reply) {
        await this.telegramClient.sendMessage(botToken, message.chat.id, result.reply.text);
      }
      // اگر result.handledByHuman بود، یعنی از قبل دست اپراتور است — همان
      // سکوت طبیعی درست است، دوباره پیام تکراری نمی‌فرستیم
    } catch (err) {
      if (err instanceof DuplicateMessageError) return; // وبهوک/آپدیت تکراری، بی‌خطر
      this.logger.error(`خطا در پردازش پیام تلگرام تنانت «${tenant.key}»: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

interface MediaInfo {
  fileId: string;
  kind: "photo" | "voice" | "audio" | "video" | "document" | "sticker";
  placeholderText: string;
}

// ----------------------------------------------------------------------------
// چون هوش مصنوعی و لایه‌ی کلمات رزرو شده اصلاً نمی‌توانند عکس/صوت را
// «بفهمند»، این‌جور پیام‌ها اصلاً از pipeline موتور رد نمی‌شوند — مستقیم
// با forceEscalate به اپراتور می‌روند (منطقش در message.service.ts است).
// ----------------------------------------------------------------------------
function describeMediaMessage(message: TelegramMessage): MediaInfo | null {
  if (message.photo && message.photo.length > 0) {
    // بزرگ‌ترین سایز آخرین آیتم آرایه است
    const largest = message.photo[message.photo.length - 1];
    return { fileId: largest.file_id, kind: "photo", placeholderText: "📷 مشتری یک عکس فرستاد" };
  }
  if (message.voice) {
    return { fileId: message.voice.file_id, kind: "voice", placeholderText: "🎤 مشتری یک پیام صوتی فرستاد" };
  }
  if (message.audio) {
    return { fileId: message.audio.file_id, kind: "audio", placeholderText: "🎵 مشتری یک فایل صوتی فرستاد" };
  }
  if (message.video) {
    return { fileId: message.video.file_id, kind: "video", placeholderText: "🎬 مشتری یک ویدیو فرستاد" };
  }
  if (message.document) {
    return {
      fileId: message.document.file_id,
      kind: "document",
      placeholderText: `📎 مشتری یک فایل فرستاد${message.document.file_name ? ` (${message.document.file_name})` : ""}`,
    };
  }
  if (message.sticker) {
    return { fileId: message.sticker.file_id, kind: "sticker", placeholderText: `${message.sticker.emoji ?? "🙂"} مشتری یک استیکر فرستاد` };
  }
  return null;
}
