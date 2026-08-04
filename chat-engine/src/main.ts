import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { env } from "./config/env";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { RedisIoAdapter } from "./realtime/redis-io.adapter";
import { TenancyService } from "./tenancy/tenancy.service";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  app.setGlobalPrefix("api");
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useWebSocketAdapter(new RedisIoAdapter(app));

  app.getHttpAdapter().get("/health", (_req: unknown, res: { send: (body: unknown) => void }) => {
    res.send({ success: true, message: "chat-engine در حال اجراست" });
  });

  await app.get(TenancyService).ensureDefaultTenant();

  await app.listen(env.PORT, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`🚀 chat-engine روی پورت ${env.PORT} در حالت ${env.NODE_ENV} اجرا شد`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ راه‌اندازی chat-engine با خطا مواجه شد:", err);
  process.exit(1);
});
