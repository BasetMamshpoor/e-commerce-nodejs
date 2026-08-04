import { Module } from "@nestjs/common";
import { TelegramWebhookController } from "./telegram-webhook.controller";
import { TelegramPollingService } from "./telegram-polling.service";
import { TelegramUpdateHandlerService } from "./telegram-update-handler.service";

@Module({
  controllers: [TelegramWebhookController],
  providers: [TelegramPollingService, TelegramUpdateHandlerService],
  exports: [TelegramPollingService],
})
export class TelegramModule {}
