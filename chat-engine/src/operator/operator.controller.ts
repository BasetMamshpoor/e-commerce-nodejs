import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiResponse } from "../utils/ApiResponse";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { TenantDocument } from "../tenancy/tenant.model";
import { CurrentOperator } from "../common/decorators/current-operator.decorator";
import { OperatorAuthGuard } from "../common/guards/operator-auth.guard";
import { OperatorPrincipal } from "../common/verifyOperatorToken";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { OperatorModel } from "../models/operator.model";
import { CustomerModel } from "../models/customer.model";
import { ConversationService } from "../conversation/conversation.service";
import { MessageService } from "../conversation/message.service";
import { RealtimeService } from "../realtime/realtime.service";
import { operatorReplySchema, queueQuerySchema, OperatorReplyInput } from "../validations/operator.validation";

@Controller("operator")
@UseGuards(OperatorAuthGuard)
export class OperatorController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly realtimeService: RealtimeService
  ) {}

  @Get("queue")
  async listQueue(
    @Query(new ZodValidationPipe(queueQuerySchema)) query: { status?: "NEEDS_OPERATOR" | "WITH_OPERATOR" },
    @CurrentTenant() tenant: TenantDocument
  ) {
    const conversations = await this.conversationService.listOperatorQueue(tenant.key, query.status);
    return ApiResponse.ok(
      conversations.map((c) => ({
        id: String(c._id),
        channel: c.channel,
        status: c.status,
        customer: c.customerId,
        lastMessageAt: c.lastMessageAt,
      }))
    );
  }

  @Get("conversations/:conversationId")
  async getConversation(@Param("conversationId") conversationId: string, @CurrentTenant() tenant: TenantDocument) {
    const messages = await this.messageService.listMessages(tenant.key, conversationId);
    return ApiResponse.ok(
      messages.map((m) => ({
        id: String(m._id),
        senderType: m.senderType,
        layer: m.layer ?? null,
        content: m.content,
        metadata: m.metadata ?? null,
        createdAt: m.createdAt,
      }))
    );
  }

  @Post("reply")
  async reply(
    @Body(new ZodValidationPipe(operatorReplySchema)) body: OperatorReplyInput,
    @CurrentTenant() tenant: TenantDocument,
    @CurrentOperator() operator: OperatorPrincipal
  ) {
    const operatorDoc = await OperatorModel.findOneAndUpdate(
      { tenantId: tenant.key, storeUserId: operator.userId },
      {
        $setOnInsert: {
          tenantId: tenant.key,
          storeUserId: operator.userId,
          displayName: `اپراتور #${operator.userId}`,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );

    await this.conversationService.assignOperator(tenant.key, body.conversationId, operatorDoc._id);
    const result = await this.messageService.appendOperatorMessage({
      tenantId: tenant.key,
      conversationId: body.conversationId,
      operatorId: operatorDoc._id,
      text: body.text,
    });

    // اگر مکالمه از کانال وب‌سایت است، پاسخ اپراتور را همان لحظه از طریق
    // Socket.io به مشتری برسانیم (بدون این‌که مشتری صفحه را رفرش کند)
    if (result?.conversation.channel === "WEBSITE") {
      const customer = await CustomerModel.findById(result.conversation.customerId);
      if (customer) {
        this.realtimeService.emitToCustomer(customer.externalId, "operator:reply", {
          conversationId: body.conversationId,
          text: body.text,
        });
      }
    }

    return ApiResponse.created({ id: result ? String(result.message._id) : null });
  }

  @Post("conversations/:conversationId/close")
  async close(@Param("conversationId") conversationId: string, @CurrentTenant() tenant: TenantDocument) {
    const conversation = await this.conversationService.closeConversation(tenant.key, conversationId);
    return ApiResponse.ok({ id: String(conversation._id), status: conversation.status });
  }
}
