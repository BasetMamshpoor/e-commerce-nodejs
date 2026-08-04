import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { TenantDocument } from "../tenancy/tenant.model";
import { StoreSqlService } from "../store/store-sql.service";
import { ProductLookupFactory } from "../store/product-lookup.factory";
import { EngineService } from "../engine-module/engine.service";
import { RedisCacheService } from "../redis/redis-cache.service";
import { ConversationService } from "./conversation.service";
import { ConversationModel } from "../models/conversation.model";
import { ConversationMessageModel } from "../models/message.model";
import { IncomingMessage, EngineReply } from "../engine/types";
import { AiHistoryTurn } from "../engine/layer2-ai/ai.types";
import { ApiError } from "../utils/ApiError";

const HISTORY_LIMIT = 12;
// هر مشتری حداکثر این تعداد پیام در دقیقه — محافظت از هزینه‌ی لایه‌ی AI
// (لایه ۱ رایگان است و محدود نمی‌شود، این فقط جلوی سیل پیام به AI را می‌گیرد)
const AI_RATE_LIMIT_PER_MINUTE = 20;

export interface ProcessResult {
  conversationId: string;
  customerMessageId: string;
  engineMessageId: string;
  reply: EngineReply;
  conversationStatus: string;
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
// نقطه‌ی ورودی مشترک همه‌ی کانال‌ها (وب‌سایت الان، اینستاگرام/واتساپ/تلگرام/
// بله بعداً): یک پیام مشتری می‌گیرد، مکالمه/مشتری را resolve می‌کند، پیام را
// ذخیره می‌کند، از pipeline موتور رد می‌کند، پاسخ را ذخیره می‌کند و وضعیت
// مکالمه را طبق EngineReply.needsOperator به‌روز می‌کند (لایه ۳).
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

    const customerMessage = await ConversationMessageModel.create({
      tenantId: tenant.key,
      conversationId: conversation._id,
      senderType: "CUSTOMER",
      content: incoming.text,
      externalMessageId: incoming.externalMessageId ?? null,
    });

    const history = await this.loadHistoryForAi(String(conversation._id));

    const pool = this.storeSql.getPool(tenant.storeDatabaseUrl);
    const lookup = this.productLookupFactory.forTenant(tenant.key, pool);
    const reply = await this.engine.run(lookup, incoming, history, tenant.aiProviderOverride);

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
    await conversation.save();

    return {
      conversationId: String(conversation._id),
      customerMessageId: String(customerMessage._id),
      engineMessageId: String(engineMessage._id),
      reply,
      conversationStatus: conversation.status,
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

    return { message, conversation };
  }

  async listMessages(tenantId: string, conversationId: string) {
    return ConversationMessageModel.find({ tenantId, conversationId }).sort({ createdAt: 1 });
  }

  private async loadHistoryForAi(conversationId: string): Promise<AiHistoryTurn[]> {
    const messages = await ConversationMessageModel.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT);

    return messages
      .reverse()
      .filter((m) => m.senderType === "CUSTOMER" || m.senderType === "ENGINE" || m.senderType === "OPERATOR")
      .map((m) => ({
        role: m.senderType === "CUSTOMER" ? ("customer" as const) : ("engine" as const),
        text: m.content,
      }));
  }
}
