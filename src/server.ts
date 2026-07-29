import { createApp } from "./app";
import { env } from "./config/env";
import { prisma, disconnectPrisma } from "./lib/prisma";
import { redis, disconnectRedis } from "./lib/redis";
import { startBackgroundJobs, stopBackgroundJobs } from "./jobs/scheduler";
import "./types/express";

async function main() {
  await prisma.$connect();
  // eslint-disable-next-line no-console
  console.log("✅ اتصال به دیتابیس برقرار شد");

  if (redis) {
    redis.once("ready", () => {
      // eslint-disable-next-line no-console
      console.log("✅ اتصال به Redis برقرار شد");
    });
  } else {
    // eslint-disable-next-line no-console
    console.log("ℹ️  Redis غیرفعال است (REDIS_ENABLED=false) — rate limiter و قفل جاب‌ها به‌صورت in-memory کار می‌کنند");
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 سرور روی پورت ${env.PORT} در حالت ${env.NODE_ENV} اجرا شد`);
  });

  startBackgroundJobs();

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} گرفته شد، در حال خاموش‌کردن امن سرور...`);
    stopBackgroundJobs();
    server.close(async () => {
      await disconnectPrisma();
      await disconnectRedis();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled Rejection:", reason);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ راه‌اندازی سرور با خطا مواجه شد:", err);
  process.exit(1);
});
