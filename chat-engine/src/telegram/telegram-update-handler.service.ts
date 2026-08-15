import { Injectable, Logger } from "@nestjs/common";
import { TenantDocument } from "../tenancy/tenant.model";
import { MessageService, DuplicateMessageError, ProcessResult } from "../conversation/message.service";
import {
  TelegramClientService,
  TelegramUpdate,
  TelegramMessage,
  TelegramCallbackQuery,
  TelegramInlineKeyboard,
} from "./telegram-client.service";
import { TELEGRAM_REPLY_KEYBOARD, WELCOME_MESSAGE, resolveMenuButtonTriggerText } from "./telegram-menu";
import { ProductSearchResult } from "../engine/productMatcher/types";
import { formatToman } from "../utils/pricing";

// ----------------------------------------------------------------------------
// این سرویس تنها جایی است که یک TelegramUpdate را به IncomingMessage
// (فرمت مشترک همه‌ی کانال‌ها) تبدیل می‌کند و از pipeline موتور رد می‌کند.
// چه از طریق polling صدا زده شود چه از طریق webhook، رفتار دقیقاً یکسان
// است — سوییچ‌کردن روش دریافت پیام هیچ اثری روی این منطق ندارد.
//
// نکته‌ی مهم درباره‌ی دکمه‌های شیشه‌ای (inline): تپ‌زدن روی آن‌ها یک
// callback_query می‌فرستد، نه یک پیام معمولی. به‌جای نوشتن یک مسیر پردازش
// جداگانه، همان تپ را به یک متن معادل («۲» برای گزینه‌ی دوم) تبدیل می‌کنیم
// و از همان processIncomingMessage رد می‌کنیم — یعنی منطق pendingAction
// (که در engine/* نوشته شده) عیناً و بدون تکرار همین‌جا هم کار می‌کند.
// ----------------------------------------------------------------------------

@Injectable()
export class TelegramUpdateHandlerService {
  private readonly logger = new Logger(TelegramUpdateHandlerService.name);

  constructor(
    private readonly messageService: MessageService,
    private readonly telegramClient: TelegramClientService
  ) {}

  async handle(tenant: TenantDocument, update: TelegramUpdate): Promise<void> {
    const botToken = tenant.telegramBotToken;
    if (!botToken) return;

    if (update.callback_query) {
      await this.handleCallbackQuery(tenant, botToken, update.callback_query);
      return;
    }

    const message = update.message;
    if (!message) return;

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

      await this.deliverReply(botToken, message.chat.id, result);
    } catch (err) {
      if (err instanceof DuplicateMessageError) return; // وبهوک/آپدیت تکراری، بی‌خطر
      this.logger.error(`خطا در پردازش پیام تلگرام تنانت «${tenant.key}»: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }

  private async handleCallbackQuery(
    tenant: TenantDocument,
    botToken: string,
    callbackQuery: TelegramCallbackQuery
  ): Promise<void> {
    const chatId = callbackQuery.message?.chat.id;
    if (!chatId) return;

    // بدون این، دکمه روی گوشی کاربر در حالت "در حال بارگذاری" گیر می‌کند
    await this.telegramClient.answerCallbackQuery(botToken, callbackQuery.id);

    const match = (callbackQuery.data ?? "").match(/^opt:(\d+)$/);
    if (!match) return; // فرمت callback_data ناشناخته — نادیده بگیر

    const optionText = match[1]; // دقیقاً همان چیزی که اگر مشتری تایپ می‌کرد («۲») به pipeline می‌رسید

    try {
      const result = await this.messageService.processIncomingMessage(tenant, {
        channel: "TELEGRAM",
        externalCustomerId: String(chatId),
        text: optionText,
        externalMessageId: `${chatId}:cb:${callbackQuery.id}`,
        externalThreadId: String(chatId),
      });

      await this.deliverReply(botToken, chatId, result);
    } catch (err) {
      if (err instanceof DuplicateMessageError) return;
      this.logger.error(
        `خطا در پردازش callback_query تنانت «${tenant.key}»: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  // ----------------------------------------------------------------------------
  // اگر پاسخ لایه ۱ چند گزینه‌ی محصول داشت (metadata.searchResults)، هرکدام
  // را با عکس واقعی‌اش + یک دکمه‌ی شیشه‌ی «این رو میخوام» جدا می‌فرستیم —
  // نه یک متن ساده. برای بقیه‌ی پاسخ‌ها (قیمت/موجودی/راهنما و ...) همان متن
  // ساده کافی است.
  // ----------------------------------------------------------------------------
  private async deliverReply(botToken: string, chatId: number, result: ProcessResult): Promise<void> {
    if (!result.reply) return; // مکالمه دست اپراتور بود، پاسخ خودکاری نیست

    const searchResults = result.reply.metadata?.searchResults as ProductSearchResult[] | undefined;

    if (Array.isArray(searchResults) && searchResults.length > 0) {
      const introLine = result.reply.text.split("\n")[0];
      await this.telegramClient.sendMessage(botToken, chatId, introLine || "چند مدل نزدیک به سوال شما پیدا کردم:");

      for (let i = 0; i < searchResults.length; i++) {
        const candidate = searchResults[i];
        const caption = buildCandidateCaption(candidate);
        const keyboard: TelegramInlineKeyboard = {
          inline_keyboard: [[{ text: "✅ این رو میخوام", callback_data: `opt:${i + 1}` }]],
        };

        if (candidate.mainImageUrl) {
          await this.telegramClient.sendPhoto(botToken, chatId, candidate.mainImageUrl, caption, keyboard);
        } else {
          await this.telegramClient.sendMessage(botToken, chatId, caption, { replyMarkup: keyboard });
        }
      }
      return;
    }

    await this.telegramClient.sendMessage(botToken, chatId, result.reply.text);
  }
}

function buildCandidateCaption(item: ProductSearchResult): string {
  const price = item.minPrice === item.maxPrice ? formatToman(item.minPrice) : `از ${formatToman(item.minPrice)}`;
  const stock = item.isInStock ? "موجود ✅" : "ناموجود 🙁";
  return `${item.name}\n${price} — ${stock}`;
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
