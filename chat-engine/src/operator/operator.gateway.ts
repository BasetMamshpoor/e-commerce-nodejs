import { OnGatewayConnection, OnGatewayInit, WebSocketGateway } from "@nestjs/websockets";
import { Namespace, Socket } from "socket.io";
import { verifyOperatorToken } from "../common/verifyOperatorToken";
import { RealtimeService } from "../realtime/realtime.service";
import { TenancyService } from "../tenancy/tenancy.service";
import { operatorsRoom } from "../realtime/rooms";

// ----------------------------------------------------------------------------
// namespace اختصاصی پنل اپراتور — فقط برای دریافت لحظه‌ای رویداد صف
// (queue:new) استفاده می‌شود؛ خودِ پاسخ‌دادن اپراتور از طریق REST
// (POST /api/operator/reply) انجام می‌شود که ساده‌تر و قابل audit تر است.
// ----------------------------------------------------------------------------

@WebSocketGateway({ namespace: "/operator" })
export class OperatorGateway implements OnGatewayConnection, OnGatewayInit {
  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly tenancyService: TenancyService
  ) {}

  afterInit(server: Namespace): void {
    this.realtimeService.registerOperatorNamespace(server);
  }

  handleConnection(socket: Socket): void {
    try {
      const token = String(socket.handshake.auth?.token ?? "");
      verifyOperatorToken(token); // فقط اعتبارسنجی — نقش/شناسه اینجا لازم نیست

      const tenantKey = String(socket.handshake.query.tenantKey ?? this.tenancyService.resolveDefaultTenantKey());
      socket.join(operatorsRoom(tenantKey));
    } catch {
      socket.disconnect(true);
    }
  }
}
