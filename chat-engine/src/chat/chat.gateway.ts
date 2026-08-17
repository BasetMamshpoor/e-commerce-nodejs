import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";
import { TenancyService } from "../tenancy/tenancy.service";
import { MessageService, DuplicateMessageError } from "../conversation/message.service";
import { RealtimeService } from "../realtime/realtime.service";
import { customerRoom } from "../realtime/rooms";

interface SendMessagePayload {
  text?: string;
  displayName?: string;
  tenantKey?: string;
  /** Site User.id when the widget is used by a logged-in customer — mirrors
   *  ChatController's REST POST /chat/messages (storeUserId), which links
   *  the conversation to the account. This socket handler used to drop it
   *  silently, so any customer using the (default, socket-first) widget
   *  path never got their conversation linked to their account at all. */
  storeUserId?: number;
}

// ----------------------------------------------------------------------------
// namespace اختصاصی ویجت چت زنده‌ی سایت. مشتری با guestToken در query
// اتصال وصل می‌شود و در room مخصوص خودش عضو می‌شود؛ پاسخ موتور (و بعداً
// پاسخ اپراتور) به همین room ارسال می‌شود.
// ----------------------------------------------------------------------------

@WebSocketGateway({ namespace: "/chat" })
export class ChatGateway implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer() private readonly server!: Namespace;

  constructor(
    private readonly messageService: MessageService,
    private readonly tenancyService: TenancyService,
    private readonly realtimeService: RealtimeService
  ) {}

  afterInit(server: Namespace): void {
    this.realtimeService.registerChatNamespace(server);
  }

  handleConnection(socket: Socket): void {
    const guestToken = String(socket.handshake.query.guestToken ?? "");
    if (!guestToken) {
      socket.disconnect(true);
      return;
    }
    socket.join(customerRoom(guestToken));
  }

  @SubscribeMessage("message:send")
  async handleMessage(@ConnectedSocket() socket: Socket, @MessageBody() payload: SendMessagePayload) {
    const guestToken = String(socket.handshake.query.guestToken ?? "");
    const text = (payload?.text ?? "").trim();
    if (!guestToken || !text) return;

    try {
      const tenantKey = payload.tenantKey ?? this.tenancyService.resolveDefaultTenantKey();
      const tenant = await this.tenancyService.resolveTenant(tenantKey);

      const result = await this.messageService.processIncomingMessage(tenant, {
        channel: "WEBSITE",
        externalCustomerId: guestToken,
        displayName: payload.displayName,
        storeUserId: payload.storeUserId,
        text,
      });

      // اگر مکالمه دست اپراتور است، هیچ پاسخ خودکاری نیست — فقط یک ack کوچک
      // که پیام رسید (queue:update/queue:new را خودِ MessageService
      // مرکزی مدیریت می‌کند، این‌جا دوباره تکرارش نمی‌کنیم)
      if (result.handledByHuman || !result.reply) {
        this.realtimeService.emitToCustomer(guestToken, "message:received", {
          conversationId: result.conversationId,
        });
        return;
      }

      this.realtimeService.emitToCustomer(guestToken, "engine:reply", {
        conversationId: result.conversationId,
        text: result.reply.text,
        layer: result.reply.layer,
        needsOperator: result.reply.needsOperator,
      });
    } catch (err) {
      if (err instanceof DuplicateMessageError) return;
      socket.emit("error", { message: err instanceof Error ? err.message : "خطا در پردازش پیام" });
    }
  }
}
