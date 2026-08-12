import { Injectable } from "@nestjs/common";
import { TenantDocument } from "../tenancy/tenant.model";
import { OperatorPrincipal } from "../common/verifyOperatorToken";
import { OperatorModel } from "../models/operator.model";
import { CustomerModel } from "../models/customer.model";
import { ConversationService } from "../conversation/conversation.service";
import { MessageService } from "../conversation/message.service";
import { OutboundDeliveryService } from "../delivery/outbound-delivery.service";

// ----------------------------------------------------------------------------
// «ریپلای اپراتور» دقیقاً یک پیاده‌سازی دارد؛ چه از REST بیاید (پنل ادمین
// کلاسیک) چه از Socket.io (برای یک UI بلادرنگ‌تر) — هر دو همین را صدا
// می‌زنند تا رفتار (assign، ذخیره پیام، تحویل به مشتری، رویداد صف) هیچ‌وقت
// از هم جدا نیفتد.
// ----------------------------------------------------------------------------

@Injectable()
export class OperatorActionsService {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly deliveryService: OutboundDeliveryService
  ) {}

  async getOrCreateOperatorDoc(tenantKey: string, storeUserId: number) {
    return OperatorModel.findOneAndUpdate(
      { tenantId: tenantKey, storeUserId },
      {
        $setOnInsert: {
          tenantId: tenantKey,
          storeUserId,
          displayName: `اپراتور #${storeUserId}`,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  async reply(tenant: TenantDocument, operator: OperatorPrincipal, conversationId: string, text: string) {
    const operatorDoc = await this.getOrCreateOperatorDoc(tenant.key, operator.userId);

    await this.conversationService.assignOperator(tenant.key, conversationId, operatorDoc._id);
    const result = await this.messageService.appendOperatorMessage({
      tenantId: tenant.key,
      conversationId,
      operatorId: operatorDoc._id,
      text,
    });

    // پاسخ اپراتور را همان لحظه به مشتری برسانیم — روی هر کانالی که پیام
    // آمده باشد (وب‌سایت با Socket.io، تلگرام با پیام ربات، ...)
    if (result?.conversation) {
      const customer = await CustomerModel.findById(result.conversation.customerId);
      if (customer) {
        await this.deliveryService.deliverToCustomer({
          tenant,
          conversation: result.conversation,
          customer,
          text,
        });
      }
    }

    return result;
  }
}
