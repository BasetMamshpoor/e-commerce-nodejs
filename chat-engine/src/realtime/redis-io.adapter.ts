import { INestApplicationContext } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { env } from "../config/env";

// ----------------------------------------------------------------------------
// دلیل واقعی وجود این فایل: به محض این‌که بیش از یک نمونه (instance) از
// chat-engine بالا بیاید (که برای real-time در مقیاس واقعی لازم می‌شود)،
// Socket.io به‌تنهایی نمی‌داند سوکت یک مشتری روی کدام نمونه است. آداپتور
// Redis این را حل می‌کند: هر emit به یک room، از طریق Redis pub/sub به همه‌ی
// نمونه‌ها می‌رسد.
// ----------------------------------------------------------------------------

export class RedisIoAdapter extends IoAdapter {
  private pubClient?: Redis;
  private subClient?: Redis;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    this.pubClient = new Redis(env.REDIS_URL);
    this.subClient = this.pubClient.duplicate();

    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: env.CORS_ORIGIN, credentials: true },
    });

    server.adapter(createAdapter(this.pubClient, this.subClient));
    return server;
  }

  async close(): Promise<void> {
    await this.pubClient?.quit();
    await this.subClient?.quit();
  }
}
