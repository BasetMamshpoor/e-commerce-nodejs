import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { TenantDocument } from "../tenancy/tenant.model";
import { MessageService, DuplicateMessageError } from "../conversation/message.service";
import { CustomerModel } from "../models/customer.model";
import { ConversationModel } from "../models/conversation.model";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { sendMessageSchema, historyQuerySchema, SendMessageInput } from "../validations/chat.validation";

// ----------------------------------------------------------------------------
// این کنترلر همان چیزی است که ویجت چت زنده‌ی سایت صدا می‌زند. برای real-time
// همین منطق از طریق Socket.io هم قابل دسترس است (chat.gateway.ts)؛ نسخه‌ی
// REST برای fallback و برای گرفتن تاریخچه لازم است.
// ----------------------------------------------------------------------------

@Controller("chat")
export class ChatController {
  constructor(private readonly messageService: MessageService) {}

  @Post("messages")
  async sendMessage(@Body(new ZodValidationPipe(sendMessageSchema)) body: SendMessageInput, @CurrentTenant() tenant: TenantDocument) {
    const result = await this.messageService
      .processIncomingMessage(tenant, {
        channel: "WEBSITE",
        externalCustomerId: body.guestToken,
        displayName: body.displayName,
        storeUserId: body.storeUserId,
        text: body.text,
      })
      .catch((err) => {
        if (err instanceof DuplicateMessageError) return null;
        throw err;
      });

    if (!result) {
      throw ApiError.conflict("این پیام قبلاً پردازش شده است");
    }

    return ApiResponse.ok(toSendMessageResponse(result));
  }

  @Get("messages")
  async getHistory(
    @Query(new ZodValidationPipe(historyQuerySchema)) query: { guestToken: string },
    @CurrentTenant() tenant: TenantDocument
  ) {
    const customer = await CustomerModel.findOne({
      tenantId: tenant.key,
      channel: "WEBSITE",
      externalId: query.guestToken,
    });
    if (!customer) {
      return ApiResponse.ok({ conversationId: null, messages: [] });
    }

    const conversation = await ConversationModel.findOne({ tenantId: tenant.key, customerId: customer._id }).sort({
      createdAt: -1,
    });
    if (!conversation) {
      return ApiResponse.ok({ conversationId: null, messages: [] });
    }

    const messages = await this.messageService.listMessages(tenant.key, String(conversation._id));

    return ApiResponse.ok({
      conversationId: String(conversation._id),
      messages: messages.map((m) => ({
        id: String(m._id),
        senderType: m.senderType,
        layer: m.layer ?? null,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  }
}

function toSendMessageResponse(result: {
  conversationId: string;
  conversationStatus: string;
  reply: { text: string; layer: string; needsOperator: boolean };
}) {
  return {
    conversationId: result.conversationId,
    status: result.conversationStatus,
    reply: { text: result.reply.text, layer: result.reply.layer, needsOperator: result.reply.needsOperator },
  };
}
