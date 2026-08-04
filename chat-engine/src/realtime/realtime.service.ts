import { Injectable } from "@nestjs/common";
import { Namespace } from "socket.io";
import { customerRoom, operatorsRoom } from "./rooms";

// ----------------------------------------------------------------------------
// هر gateway (namespace) خودش را در afterInit اینجا ثبت می‌کند. این سرویس
// تنها راهی است که یک gateway به namespace گیت‌وی دیگر پیام می‌فرستد — بدون
// این‌که مستقیماً به هم وابسته باشند (هردو فقط به RealtimeService تزریق
// می‌شوند).
// ----------------------------------------------------------------------------

@Injectable()
export class RealtimeService {
  private chatNamespace?: Namespace;
  private operatorNamespace?: Namespace;

  registerChatNamespace(nsp: Namespace): void {
    this.chatNamespace = nsp;
  }

  registerOperatorNamespace(nsp: Namespace): void {
    this.operatorNamespace = nsp;
  }

  emitToCustomer(guestToken: string, event: string, payload: unknown): void {
    this.chatNamespace?.to(customerRoom(guestToken)).emit(event, payload);
  }

  emitToOperators(tenantKey: string, event: string, payload: unknown): void {
    this.operatorNamespace?.to(operatorsRoom(tenantKey)).emit(event, payload);
  }
}
