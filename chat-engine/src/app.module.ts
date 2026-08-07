import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./redis/redis.module";
import { StoreModule } from "./store/store.module";
import { TenancyModule } from "./tenancy/tenancy.module";
import { TenantResolverMiddleware } from "./tenancy/tenant-resolver.middleware";
import { TenantResolverGuard } from "./tenancy/tenant-resolver.guard";
import { EngineModule } from "./engine-module/engine.module";
import { ConversationModule } from "./conversation/conversation.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { ChatModule } from "./chat/chat.module";
import { OperatorModule } from "./operator/operator.module";
import { TelegramClientModule } from "./telegram/telegram-client.module";
import { TelegramModule } from "./telegram/telegram.module";
import { DeliveryModule } from "./delivery/delivery.module";
import { RequestMethod } from "@nestjs/common";

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    StoreModule,
    TenancyModule,
    EngineModule,
    ConversationModule,
    RealtimeModule,
    TelegramClientModule,
    DeliveryModule,
    ChatModule,
    OperatorModule,
    TelegramModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: TenantResolverGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // تنانت هر درخواست HTTP یک‌بار در همین‌جا resolve می‌شود (نه در هر
    // کنترلر جداگانه) — گیت‌وی‌های WebSocket چون از این pipeline رد
    // نمی‌شوند، خودشان مستقیماً TenancyService را صدا می‌زنند.
    consumer.apply(TenantResolverMiddleware).forRoutes({
      path: "*",
      method: RequestMethod.ALL,
    });
  }
}
