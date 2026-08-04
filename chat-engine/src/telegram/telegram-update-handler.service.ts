import { Injectable, Logger } from "@nestjs/common";
import { TenantDocument } from "../tenancy/tenant.model";
import { MessageService, DuplicateMessageError } from "../conversation/message.service";
import { TelegramClientService, TelegramUpdate } from "./telegram-client.service";

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
    // فعلاً فقط پیام‌های متنی پشتیبانی می‌شوند (عکس/استیکر/صوت بعداً)
    if (!message?.text) return;

    const displayName =
      [message.from?.first_name, message.from?.last_name].filter(Boolean).join(" ") || message.from?.username;

    try {
      const result = await this.messageService.processIncomingMessage(tenant, {
        channel: "TELEGRAM",
        externalCustomerId: String(message.chat.id),
        displayName,
        text: message.text,
        externalMessageId: `${message.chat.id}:${message.message_id}`,
        externalThreadId: String(message.chat.id),
      });

      if (tenant.telegramBotToken) {
        await this.telegramClient.sendMessage(tenant.telegramBotToken, message.chat.id, result.reply.text);
      }
    } catch (err) {
      if (err instanceof DuplicateMessageError) return; // وبهوک/آپدیت تکراری، بی‌خطر
      this.logger.error(`خطا در پردازش پیام تلگرام تنانت «${tenant.key}»: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}
