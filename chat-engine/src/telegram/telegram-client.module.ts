import { Global, Module } from "@nestjs/common";
import { TelegramClientService } from "./telegram-client.service";

@Global()
@Module({
  providers: [TelegramClientService],
  exports: [TelegramClientService],
})
export class TelegramClientModule {}
