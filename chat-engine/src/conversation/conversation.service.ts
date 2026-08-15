import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { CustomerModel, Channel } from "../models/customer.model";
import { ConversationModel, ConversationDocument, ConversationStatus } from "../models/conversation.model";
import { ConversationMessageModel } from "../models/message.model";
import { ApiError } from "../utils/ApiError";
import { RealtimeService } from "../realtime/realtime.service";

@Injectable()
export class ConversationService {
  constructor(private readonly realtimeService: RealtimeService) {}

  async getOrCreateCustomer(params: {
    tenantId: string;
    channel: Channel;
    externalId: string;
    displayName?: string;
    storeUserId?: number;
  }) {
    return CustomerModel.findOneAndUpdate(
      { tenantId: params.tenantId, channel: params.channel, externalId: params.externalId },
      {
        $setOnInsert: { tenantId: params.tenantId, channel: params.channel, externalId: params.externalId },
        ...(params.displayName ? { $set: { displayName: params.displayName } } : {}),
        ...(params.storeUserId ? { $set: { storeUserId: params.storeUserId } } : {}),
      },
      { upsert: true, new: true }
    );
  }

  // هر مشتری در هر کانال حداکثر یک مکالمه‌ی «باز» دارد (وضعیت غیر از CLOSED)؛
  // اگر نبود یکی ساخته می‌شود.
  async getOrCreateOpenConversation(params: {
    tenantId: string;
    channel: Channel;
    customerId: Types.ObjectId;
    externalThreadId?: string;
  }) {
    const existing = await ConversationModel.findOne({
      tenantId: params.tenantId,
      customerId: params.customerId,
      status: { $ne: "CLOSED" },
    }).sort({ createdAt: -1 });

    if (existing) return existing;

    return ConversationModel.create({
      tenantId: params.tenantId,
      channel: params.channel,
      customerId: params.customerId,
      status: "OPEN",
      externalThreadId: params.externalThreadId ?? null,
    });
  }

  async findConversationById(tenantId: string, conversationId: string) {
    const conversation = await ConversationModel.findOne({ _id: conversationId, tenantId });
    if (!conversation) throw ApiError.notFound("مکالمه پیدا نشد");
    return conversation;
  }

  // لیست عمومی مکالمات برای پنل ادمین — پیش‌فرض «همه‌چیز» (چت‌های مشتری با
  // بات را هم شامل می‌شود، نه فقط صف اپراتور)، با فیلتر آزاد روی
  // status/channel برای وقتی ادمین می‌خواهد فقط چت‌های نیازمند پشتیبانی را
  // ببیند (`status=NEEDS_OPERATOR,WITH_OPERATOR`).
  async listConversations(params: {
    tenantId: string;
    status?: ConversationStatus | ConversationStatus[];
    channel?: string;
  }) {
    const filter: Record<string, unknown> = { tenantId: params.tenantId };

    if (params.status) {
      filter.status = Array.isArray(params.status) ? { $in: params.status } : params.status;
    }
    if (params.channel) {
      filter.channel = params.channel;
    }

    return ConversationModel.find(filter).sort({ lastMessageAt: -1 }).populate("customerId");
  }

  // میان‌بر برای همان فیلتر قدیمی (فقط چت‌های نیازمند/دست اپراتور) — استفاده
  // در جایی که صریحاً فقط صف پشتیبانی لازم است
  async listConversationsNeedingOperator(tenantId: string) {
    return this.listConversations({ tenantId, status: ["NEEDS_OPERATOR", "WITH_OPERATOR"] });
  }

  async assignOperator(tenantId: string, conversationId: string, operatorId: Types.ObjectId) {
    const conversation = await this.findConversationById(tenantId, conversationId);
    conversation.assignedOperatorId = operatorId;
    conversation.status = "WITH_OPERATOR";
    await conversation.save();
    await this.emitQueueUpdate(conversation);
    return conversation;
  }

  async closeConversation(tenantId: string, conversationId: string) {
    const conversation = await this.findConversationById(tenantId, conversationId);
    conversation.status = "CLOSED";
    await conversation.save();
    this.realtimeService.emitToOperators(tenantId, "queue:removed", { id: String(conversation._id) });
    return conversation;
  }

  // اپراتور مکالمه را «آزاد» می‌کند — یعنی از این به بعد دوباره لایه‌های
  // خودکار (۱ و ۲) اجازه دارند به پیام‌های بعدی این مکالمه جواب بدهند.
  // این تنها راهی است که یک مکالمه‌ی NEEDS_OPERATOR/WITH_OPERATOR به حالت
  // خودکار برمی‌گردد — خودِ AI هیچ‌وقت این کار را خودسرانه انجام نمی‌دهد.
  async releaseConversation(tenantId: string, conversationId: string) {
    const conversation = await this.findConversationById(tenantId, conversationId);
    conversation.status = "OPEN";
    conversation.assignedOperatorId = null;
    await conversation.save();
    this.realtimeService.emitToOperators(tenantId, "queue:removed", { id: String(conversation._id) });
    return conversation;
  }

  async deleteConversation(tenantId: string, conversationId: string) {
    const conversation = await this.findConversationById(tenantId, conversationId);
    await ConversationMessageModel.deleteMany({ tenantId, conversationId: conversation._id });
    await conversation.deleteOne();
    this.realtimeService.emitToOperators(tenantId, "queue:removed", { id: String(conversation._id) });
    return conversation;
  }

  // ----------------------------------------------------------------------------
  // شکل یکسان یک آیتم صف برای پنل اپراتور — هم REST (listConversations) و
  // هم رویدادهای Socket.io (queue:new/queue:update) از همین شکل استفاده
  // می‌کنند تا فرانت مجبور به تفسیر دو فرمت مختلف نباشد.
  // ----------------------------------------------------------------------------
  async emitQueueNew(conversation: ConversationDocument): Promise<void> {
    const payload = await this.toQueuePayload(conversation);
    this.realtimeService.emitToOperators(conversation.tenantId, "queue:new", payload);
  }

  async emitQueueUpdate(conversation: ConversationDocument): Promise<void> {
    const payload = await this.toQueuePayload(conversation);
    this.realtimeService.emitToOperators(conversation.tenantId, "queue:update", payload);
  }

  async toQueuePayload(conversation: ConversationDocument) {
    if (!conversation.populated("customerId")) {
      await conversation.populate("customerId");
    }
    return {
      id: String(conversation._id),
      channel: conversation.channel,
      status: conversation.status,
      customer: conversation.customerId,
      lastMessageAt: conversation.lastMessageAt,
    };
  }
}
