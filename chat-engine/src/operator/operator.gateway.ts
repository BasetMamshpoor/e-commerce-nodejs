import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";
import { verifyOperatorToken, OperatorPrincipal } from "../common/verifyOperatorToken";
import { RealtimeService } from "../realtime/realtime.service";
import { TenancyService } from "../tenancy/tenancy.service";
import { operatorsRoom } from "../realtime/rooms";
import { OperatorActionsService } from "./operator-actions.service";

interface OperatorReplyPayload {
  conversationId: string;
  text: string;
  tenantKey?: string;
  replyToMessageId?: string;
}

// ----------------------------------------------------------------------------
// namespace اختصاصی پنل اپراتور: هم رویدادهای لحظه‌ای صف (queue:new/update/
// removed) را دریافت می‌کند، هم می‌تواند مستقیم از همین‌جا پاسخ بدهد
// (بدون رفت‌وبرگشت REST جداگانه) — هردو مسیر (REST و سوکت) از همان
// OperatorActionsService مشترک رد می‌شوند.
// ----------------------------------------------------------------------------

@WebSocketGateway({ namespace: "/operator" })
export class OperatorGateway implements OnGatewayConnection, OnGatewayInit {
  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly tenancyService: TenancyService,
    private readonly operatorActions: OperatorActionsService
  ) {}

  afterInit(server: Namespace): void {
    this.realtimeService.registerOperatorNamespace(server);
  }

  handleConnection(socket: Socket): void {
    try {
      const token = String(socket.handshake.auth?.token ?? "");
      const principal = verifyOperatorToken(token);
      socket.data.operator = principal;

      const tenantKey = String(socket.handshake.query.tenantKey ?? this.tenancyService.resolveDefaultTenantKey());
      socket.data.tenantKey = tenantKey;
      socket.join(operatorsRoom(tenantKey));
    } catch {
      socket.disconnect(true);
    }
  }

  @SubscribeMessage("operator:reply")
  async handleReply(@ConnectedSocket() socket: Socket, @MessageBody() payload: OperatorReplyPayload) {
    const conversationId = payload?.conversationId?.trim();
    const text = payload?.text?.trim();
    if (!conversationId || !text) return;

    const operator = socket.data.operator as OperatorPrincipal | undefined;
    if (!operator) {
      socket.disconnect(true);
      return;
    }

    try {
      const tenantKey = payload.tenantKey ?? (socket.data.tenantKey as string) ?? this.tenancyService.resolveDefaultTenantKey();
      const tenant = await this.tenancyService.resolveTenant(tenantKey);
      await this.operatorActions.reply(tenant, operator, conversationId, text, payload.replyToMessageId);
    } catch (err) {
      socket.emit("error", { message: err instanceof Error ? err.message : "خطا در ارسال پاسخ" });
    }
  }
}
