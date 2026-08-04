import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import { CustomerModel, Channel } from "../models/customer.model";
import { ConversationModel, ConversationStatus } from "../models/conversation.model";
import { ApiError } from "../utils/ApiError";

@Injectable()
export class ConversationService {
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

  async listOperatorQueue(tenantId: string, status?: ConversationStatus) {
    return ConversationModel.find({
      tenantId,
      status: status ?? { $in: ["NEEDS_OPERATOR", "WITH_OPERATOR"] },
    })
      .sort({ lastMessageAt: -1 })
      .populate("customerId");
  }

  async assignOperator(tenantId: string, conversationId: string, operatorId: Types.ObjectId) {
    const conversation = await this.findConversationById(tenantId, conversationId);
    conversation.assignedOperatorId = operatorId;
    conversation.status = "WITH_OPERATOR";
    await conversation.save();
    return conversation;
  }

  async closeConversation(tenantId: string, conversationId: string) {
    const conversation = await this.findConversationById(tenantId, conversationId);
    conversation.status = "CLOSED";
    await conversation.save();
    return conversation;
  }
}
