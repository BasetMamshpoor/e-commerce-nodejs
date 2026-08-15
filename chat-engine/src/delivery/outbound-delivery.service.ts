import { Injectable, Logger } from "@nestjs/common";
import { TenantDocument } from "../tenancy/tenant.model";
import { ConversationDocument } from "../models/conversation.model";
import { CustomerDocument } from "../models/customer.model";
import { ConversationMessageModel } from "../models/message.model";
import { RealtimeService } from "../realtime/realtime.service";
import { TelegramClientService } from "../telegram/telegram-client.service";

// ----------------------------------------------------------------------------
// وقتی یک اپراتور به یک مکالمه پاسخ می‌دهد، operator.controller نمی‌داند
// (و نباید بداند) که این مکالمه از وب‌سایت آمده یا تلگرام یا بعداً
// اینستاگرام/واتساپ. همین‌جا تصمیم می‌گیریم پیام از کدام کانال واقعاً به
// مشتری برسد — یک‌بار نوشته می‌شود، برای همه‌ی کانال‌های آینده هم همین
// الگو تکرار می‌شود (یک case جدید در switch).
//
// نکته: ویجت چت سایت اصلاً مفهوم «ریپلای به یک پیام مشخص» را ندارد (فقط
// یک لیست خطی از پیام‌هاست)، ولی تلگرام به‌صورت بومی از quote-کردن یک
// پیام مشخص پشتیبانی می‌کند — برای همین این قابلیت فقط برای TELEGRAM
// فعال می‌شود.
// ----------------------------------------------------------------------------

@Injectable()
export class OutboundDeliveryService {
  private readonly logger = new Logger(OutboundDeliveryService.name);

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly telegramClient: TelegramClientService
  ) {}

  async deliverToCustomer(params: {
    tenant: TenantDocument;
    conversation: ConversationDocument;
    customer: CustomerDocument;
    text: string;
    // اگر اپراتور صریحاً به یک پیام مشخص ریپلای زده (نه فقط آخرین پیام)
    replyToMessageId?: string;
  }): Promise<void> {
    const { tenant, conversation, customer, text, replyToMessageId } = params;

    switch (conversation.channel) {
      case "WEBSITE":
        this.realtimeService.emitToCustomer(customer.externalId, "operator:reply", {
          conversationId: String(conversation._id),
          text,
          replyToMessageId: replyToMessageId ?? null,
        });
        return;

      case "TELEGRAM":
        if (!tenant.telegramBotToken) {
          this.logger.warn(`تنانت «${tenant.key}» توکن تلگرام ندارد؛ پیام اپراتور تحویل داده نشد`);
          return;
        }
        await this.telegramClient.sendMessage(tenant.telegramBotToken, customer.externalId, text, {
          replyToMessageId: await this.resolveTelegramReplyTarget(conversation, replyToMessageId),
        });
        return;

      default:
        this.logger.warn(`کانال «${conversation.channel}» هنوز به سیستم تحویل پیام وصل نشده`);
    }
  }

  // اگر اپراتور صریحاً یک پیام مشخص (replyToMessageId، شناسه‌ی خودمان در
  // Mongo) را هدف گرفته، همان را به message_id تلگرام تبدیل می‌کنیم؛ وگرنه
  // مثل قبل، آخرین پیام مشتری را quote می‌کنیم.
  private async resolveTelegramReplyTarget(
    conversation: ConversationDocument,
    replyToMessageId?: string
  ): Promise<number | undefined> {
    if (replyToMessageId) {
      const target = await ConversationMessageModel.findOne({
        _id: replyToMessageId,
        conversationId: conversation._id,
      });
      const explicit = extractTelegramMessageId(target?.externalMessageId);
      if (explicit !== undefined) return explicit;
    }

    const lastCustomerMessage = await ConversationMessageModel.findOne({
      conversationId: conversation._id,
      senderType: "CUSTOMER",
    }).sort({ createdAt: -1 });

    return extractTelegramMessageId(lastCustomerMessage?.externalMessageId);
  }
}

// externalMessageId برای تلگرام همیشه به شکل "chatId:messageId" است (پیام‌های
// عادی) — callback_query ها ("chatId:cb:...") قابل quote-کردن نیستند چون
// خودشان یک پیام واقعی جدید نبودند، پس در آن حالت undefined برمی‌گردد
function extractTelegramMessageId(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined;
  const parts = raw.split(":");
  if (parts.length !== 2) return undefined;
  const messageId = Number(parts[1]);
  return Number.isFinite(messageId) ? messageId : undefined;
}
