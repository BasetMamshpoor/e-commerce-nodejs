import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";
import { env } from "../config/env";
import { RedisCacheService } from "./redis-cache.service";
import { REDIS_CLIENT } from "./redis.constants";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => new Redis(env.REDIS_URL),
    },
    RedisCacheService,
  ],
  exports: [REDIS_CLIENT, RedisCacheService],
})
export class RedisModule {}
