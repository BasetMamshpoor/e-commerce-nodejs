import { Body, Controller, Delete, Get, Param, Post, Query, Res, UseGuards } from "@nestjs/common";
import { ApiResponse } from "../utils/ApiResponse";
import { CurrentTenant } from "../tenancy/current-tenant.decorator";
import { TenantDocument } from "../tenancy/tenant.model";
import { CurrentOperator } from "../common/decorators/current-operator.decorator";
import { OperatorAuthGuard } from "../common/guards/operator-auth.guard";
import { OperatorPrincipal } from "../common/verifyOperatorToken";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ConversationMessageModel } from "../models/message.model";
import { ConversationService } from "../conversation/conversation.service";
import { MessageService } from "../conversation/message.service";
import { OperatorActionsService } from "./operator-actions.service";
import { TelegramClientService } from "../telegram/telegram-client.service";
import { operatorReplySchema, queueQuerySchema, OperatorReplyInput } from "../validations/operator.validation";
import { ConversationStatus } from "../models/conversation.model";
import { Channel } from "../models/customer.model";

interface FastifyLikeReply {
  status(code: number): FastifyLikeReply;
  header(name: string, value: string): FastifyLikeReply;
  send(body: unknown): unknown;
}

@Controller("operator")
@UseGuards(OperatorAuthGuard)
export class OperatorController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly operatorActions: OperatorActionsService,
    private readonly telegramClient: TelegramClientService
  ) {}

  // بدون status یعنی صف کلاسیک (NEEDS_OPERATOR/WITH_OPERATOR)؛ با status
  // می‌شود هر وضعیتی دید — قدرت کامل فیلتر برای پنل ادمین
  @Get("queue")
  async listQueue(
    @Query(new ZodValidationPipe(queueQuerySchema)) query: { status?: ConversationStatus[]; channel?: Channel },
    @CurrentTenant() tenant: TenantDocument
  ) {
    const conversations = await this.conversationService.listConversations({
      tenantId: tenant.key,
      status: query.status,
      channel: query.channel,
    });

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
        replyToMessageId: m.replyToMessageId ? String(m.replyToMessageId) : null,
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
    const result = await this.operatorActions.reply(tenant, operator, body.conversationId, body.text, body.replyToMessageId);
    return ApiResponse.created({ id: result ? String(result.message._id) : null });
  }

  @Post("conversations/:conversationId/close")
  async close(@Param("conversationId") conversationId: string, @CurrentTenant() tenant: TenantDocument) {
    const conversation = await this.conversationService.closeConversation(tenant.key, conversationId);
    return ApiResponse.ok({ id: String(conversation._id), status: conversation.status });
  }

  // مکالمه را از دست اپراتور خارج و به لایه‌های خودکار برمی‌گرداند — تنها
  // راه برگشت از NEEDS_OPERATOR/WITH_OPERATOR به حالت خودکار
  @Post("conversations/:conversationId/release")
  async release(@Param("conversationId") conversationId: string, @CurrentTenant() tenant: TenantDocument) {
    const conversation = await this.conversationService.releaseConversation(tenant.key, conversationId);
    return ApiResponse.ok({ id: String(conversation._id), status: conversation.status });
  }

  @Delete("conversations/:conversationId")
  async remove(@Param("conversationId") conversationId: string, @CurrentTenant() tenant: TenantDocument) {
    const conversation = await this.conversationService.deleteConversation(tenant.key, conversationId);
    return ApiResponse.ok({ id: String(conversation._id) });
  }

  // ----------------------------------------------------------------------------
  // پروکسیِ رسانه‌ی تلگرام — بدون ذخیره‌کردن خودِ فایل روی سرور ما. هر بار
  // که اپراتور این را باز می‌کند، لحظه‌ای از سرورهای تلگرام خوانده و
  // مستقیم پاس داده می‌شود (نه دانلود و نه کش دائمی).
  // ----------------------------------------------------------------------------
  @Get("conversations/:conversationId/messages/:messageId/media")
  async getMedia(
    @Param("conversationId") conversationId: string,
    @Param("messageId") messageId: string,
    @CurrentTenant() tenant: TenantDocument,
    @Res() res: FastifyLikeReply
  ) {
    const message = await ConversationMessageModel.findOne({
      _id: messageId,
      tenantId: tenant.key,
      conversationId,
    });

    const fileId = (message?.metadata as { telegramFileId?: string } | null)?.telegramFileId;

    if (!message || !fileId || !tenant.telegramBotToken) {
      res.status(404).send({ success: false, message: "رسانه پیدا نشد" });
      return;
    }

    try {
      const fileUrl = await this.telegramClient.getFileUrl(tenant.telegramBotToken, fileId);
      const upstream = await fetch(fileUrl);
      if (!upstream.ok) {
        res.status(502).send({ success: false, message: "خطا در دریافت فایل از تلگرام" });
        return;
      }
      const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
      const bytes = Buffer.from(await upstream.arrayBuffer());
      res.header("content-type", contentType).send(bytes);
    } catch {
      res.status(502).send({ success: false, message: "خطا در دریافت فایل از تلگرام" });
    }
  }
}
