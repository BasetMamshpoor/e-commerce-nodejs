import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { TenantDocument } from "../tenancy/tenant.model";
import { StoreSqlService } from "../store/store-sql.service";
import { ProductLookupFactory } from "../store/product-lookup.factory";
import { EngineService } from "../engine-module/engine.service";
import { RedisCacheService } from "../redis/redis-cache.service";
import { ConversationService } from "./conversation.service";
import { ConversationModel } from "../models/conversation.model";
import { ConversationMessageModel, ConversationMessageDocument } from "../models/message.model";
import { IncomingMessage, EngineReply, ConversationContext, PendingAction } from "../engine/types";
import { AiHistoryTurn } from "../engine/layer2-ai/ai.types";
import { ApiError } from "../utils/ApiError";

const HISTORY_LIMIT = 12;
// هر مشتری حداکثر این تعداد پیام در دقیقه — محافظت از هزینه‌ی لایه‌ی AI
// (لایه ۱ رایگان است و محدود نمی‌شود، این فقط جلوی سیل پیام به AI را می‌گیرد)
const AI_RATE_LIMIT_PER_MINUTE = 20;

// وضعیت‌هایی که یعنی «الان دست انسان است» — در این حالت هیچ لایه‌ی خودکاری
// دیگر روی پیام‌های تازه‌ی همین مکالمه اجرا نمی‌شود
const HUMAN_HANDLING_STATUSES = new Set(["NEEDS_OPERATOR", "WITH_OPERATOR"]);

export interface ProcessResult {
  conversationId: string;
  customerMessageId: string;
  // اگر مکالمه دست اپراتور بود، هیچ پاسخ خودکاری تولید نمی‌شود — این دو
  // فیلد undefined می‌مانند و caller باید همین را به معنی «فقط پیام ذخیره
  // شد، منتظر جواب انسانی باش» بفهمد.
  engineMessageId?: string;
  reply?: EngineReply;
  conversationStatus: string;
  handledByHuman: boolean;
}

export class DuplicateMessageError extends Error {
  constructor(
    public readonly conversationId: string,
    public readonly existingMessageId: string
  ) {
    super("این پیام قبلاً پردازش شده است");
  }
}

// ----------------------------------------------------------------------------
// نقطه‌ی ورودی مشترک همه‌ی کانال‌ها (وب‌سایت، اینستاگرام/واتساپ/تلگرام/بله):
// یک پیام مشتری می‌گیرد، مکالمه/مشتری را resolve می‌کند، پیام را ذخیره
// می‌کند، و —‌ مگر این‌که مکالمه از قبل دست اپراتور باشد — از pipeline
// موتور رد می‌کند، پاسخ را ذخیره می‌کند و وضعیت مکالمه را طبق
// EngineReply.needsOperator به‌روز می‌کند (لایه ۳).
//
// نکته‌ی مهم (رفع یک باگ واقعی): وقتی یک مکالمه به اپراتور ارجاع شده
// (NEEDS_OPERATOR) یا در دست اوست (WITH_OPERATOR)، لایه‌های خودکار دیگر
// اصلاً روی پیام‌های بعدی همین مکالمه اجرا نمی‌شوند — حتی اگر پیام
// مشتری دوباره یک کلمه‌ی رزرو شده داشته باشد. تنها راه برگشت به حالت
// خودکار، آزادکردن صریح مکالمه توسط اپراتور است
// (conversationService.releaseConversation).
// ----------------------------------------------------------------------------

@Injectable()
export class MessageService {
  constructor(
    private readonly storeSql: StoreSqlService,
    private readonly productLookupFactory: ProductLookupFactory,
    private readonly engine: EngineService,
    private readonly redisCache: RedisCacheService,
    private readonly conversationService: ConversationService
  ) {}

  async processIncomingMessage(tenant: TenantDocument, incoming: IncomingMessage): Promise<ProcessResult> {
    const allowed = await this.redisCache.allowRate(
      `ai-rate:${tenant.key}:${incoming.channel}:${incoming.externalCustomerId}`,
      AI_RATE_LIMIT_PER_MINUTE,
      60
    );
    if (!allowed) {
      throw ApiError.conflict("تعداد پیام‌های شما در این دقیقه زیاد بوده، کمی صبر کنید و دوباره امتحان کنید.");
    }

    const customer = await this.conversationService.getOrCreateCustomer({
      tenantId: tenant.key,
      channel: incoming.channel,
      externalId: incoming.externalCustomerId,
      displayName: incoming.displayName,
      storeUserId: incoming.storeUserId,
    });

    const conversation = await this.conversationService.getOrCreateOpenConversation({
      tenantId: tenant.key,
      channel: incoming.channel,
      customerId: customer._id,
      externalThreadId: incoming.externalThreadId,
    });

    // جلوگیری از پردازش دوباره‌ی همان پیام (وبهوک تکراری پلتفرم‌های بیرونی)
    if (incoming.externalMessageId) {
      const duplicate = await ConversationMessageModel.findOne({
        tenantId: tenant.key,
        externalMessageId: incoming.externalMessageId,
      });
      if (duplicate) {
        throw new DuplicateMessageError(String(conversation._id), String(duplicate._id));
      }
    }

    // *** رفع باگ: اگر مکالمه از قبل دست اپراتور است، یا این پیام (مثلاً
    // یک عکس/صوت تلگرام) اصلاً قابل پردازش خودکار نیست، هیچ لایه‌ی خودکاری
    // اجرا نمی‌شود — فقط پیام ذخیره و اپراتور مطلع می‌شود ***
    const wasAlreadyHumanHandled = HUMAN_HANDLING_STATUSES.has(conversation.status);

    if (wasAlreadyHumanHandled || incoming.forceEscalate) {
      const customerMessage = await ConversationMessageModel.create({
        tenantId: tenant.key,
        conversationId: conversation._id,
        senderType: "CUSTOMER",
        content: incoming.text,
        externalMessageId: incoming.externalMessageId ?? null,
        metadata: incoming.attachmentMetadata ?? null,
      });

      if (!wasAlreadyHumanHandled) {
        conversation.status = "NEEDS_OPERATOR";
      }
      conversation.lastMessageAt = new Date();
      await conversation.save();

      if (wasAlreadyHumanHandled) {
        await this.conversationService.emitQueueUpdate(conversation);
      } else {
        await this.conversationService.emitQueueNew(conversation);
      }

      return {
        conversationId: String(conversation._id),
        customerMessageId: String(customerMessage._id),
        conversationStatus: conversation.status,
        handledByHuman: true,
      };
    }

    // تاریخچه و حافظه‌ی مکالمه را از روی پیام‌های قبلی می‌سازیم — قبل از
    // این‌که پیام تازه‌ی مشتری ذخیره شود؛ وگرنه «آخرین پیام موتور» همیشه
    // خودِ همین پیام تازه‌ی مشتری می‌شد و pendingAction درست تشخیص داده نمی‌شد.
    const recentMessages = await this.loadRecentMessages(String(conversation._id));
    const history = toAiHistory(recentMessages);
    const context: ConversationContext = {
      pendingAction: extractPendingAction(recentMessages),
      lastProductId: conversation.lastProductId ?? undefined,
    };

    const customerMessage = await ConversationMessageModel.create({
      tenantId: tenant.key,
      conversationId: conversation._id,
      senderType: "CUSTOMER",
      content: incoming.text,
      externalMessageId: incoming.externalMessageId ?? null,
    });

    const pool = this.storeSql.getPool(tenant.storeDatabaseUrl);
    const lookup = this.productLookupFactory.forTenant(tenant.key, pool);
    const reply = await this.engine.run(lookup, incoming, history, context, tenant.aiProviderOverride);

    const engineMessage = await ConversationMessageModel.create({
      tenantId: tenant.key,
      conversationId: conversation._id,
      senderType: "ENGINE",
      layer: reply.layer,
      content: reply.text,
      metadata: reply.metadata ?? null,
    });

    conversation.status = reply.needsOperator ? "NEEDS_OPERATOR" : "AI_HANDLING";
    conversation.lastMessageAt = new Date();
    // اگر این پاسخ روی یک محصول مشخص resolve شد، آن را برای پیام‌های بعدی
    // مکالمه به‌عنوان «محصول در کانون توجه» به خاطر می‌سپاریم
    const resolvedProductId = reply.metadata?.productId;
    if (typeof resolvedProductId === "number") {
      conversation.lastProductId = resolvedProductId;
    }
    await conversation.save();

    if (reply.needsOperator) {
      await this.conversationService.emitQueueNew(conversation);
    }

    return {
      conversationId: String(conversation._id),
      customerMessageId: String(customerMessage._id),
      engineMessageId: String(engineMessage._id),
      reply,
      conversationStatus: conversation.status,
      handledByHuman: false,
    };
  }

  async appendOperatorMessage(params: {
    tenantId: string;
    conversationId: string;
    operatorId: Types.ObjectId;
    text: string;
  }) {
    const conversation = await ConversationModel.findOne({ _id: params.conversationId, tenantId: params.tenantId });
    if (!conversation) return null;

    const message = await ConversationMessageModel.create({
      tenantId: params.tenantId,
      conversationId: conversation._id,
      senderType: "OPERATOR",
      operatorId: params.operatorId,
      content: params.text,
    });

    conversation.status = "WITH_OPERATOR";
    conversation.assignedOperatorId = params.operatorId;
    conversation.lastMessageAt = new Date();
    await conversation.save();
    await this.conversationService.emitQueueUpdate(conversation);

    return { message, conversation };
  }

  async listMessages(tenantId: string, conversationId: string) {
    return ConversationMessageModel.find({ tenantId, conversationId }).sort({ createdAt: 1 });
  }

  private async loadRecentMessages(conversationId: string): Promise<ConversationMessageDocument[]> {
    const messages = await ConversationMessageModel.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT);
    return messages.reverse();
  }
}

function toAiHistory(messages: ConversationMessageDocument[]): AiHistoryTurn[] {
  return messages
    .filter((m) => m.senderType === "CUSTOMER" || m.senderType === "ENGINE" || m.senderType === "OPERATOR")
    .map((m) => ({
      role: m.senderType === "CUSTOMER" ? ("customer" as const) : ("engine" as const),
      text: m.content,
    }));
}

// ----------------------------------------------------------------------------
// آخرین پیام موتور (ENGINE) در تاریخچه را پیدا می‌کند و اگر روی آن یک
// pendingAction ثبت شده بود (لایه ۱ منتظر کد محصول یا انتخاب گزینه بود)،
// آن را برمی‌گرداند — اما فقط اگر همان آخرین پیامِ کل مکالمه هم باشد؛
// یعنی اگر مشتری خودش قبلاً یک پیام دیگر فرستاده و رد شده، این pendingAction
// دیگر معتبر نیست (فقط برای «نوبت بعدی» معتبر است).
// ----------------------------------------------------------------------------
function extractPendingAction(recentMessages: ConversationMessageDocument[]): PendingAction | undefined {
  const lastMessage = recentMessages[recentMessages.length - 1];
  if (!lastMessage || lastMessage.senderType !== "ENGINE") return undefined;

  const metadata = lastMessage.metadata as { pendingAction?: unknown } | null | undefined;
  const candidate = metadata?.pendingAction;
  if (!isPendingAction(candidate)) return undefined;

  return candidate;
}

function isPendingAction(value: unknown): value is PendingAction {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.type === "AWAITING_PRODUCT_CODE") return typeof v.intent === "string";
  if (v.type === "AWAITING_OPTION_SELECTION") {
    return typeof v.intent === "string" && Array.isArray(v.candidateProductIds);
  }
  return false;
}
