import { Global, Module } from "@nestjs/common";
import { ConversationService } from "./conversation.service";
import { MessageService } from "./message.service";

@Global()
@Module({
  providers: [ConversationService, MessageService],
  exports: [ConversationService, MessageService],
})
export class ConversationModule {}
