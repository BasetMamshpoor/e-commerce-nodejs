import { Global, Module } from "@nestjs/common";
import { OutboundDeliveryService } from "./outbound-delivery.service";

@Global()
@Module({
  providers: [OutboundDeliveryService],
  exports: [OutboundDeliveryService],
})
export class DeliveryModule {}
