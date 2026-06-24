import { createApp } from "./app";
import { env } from "./config/env";
import { prisma, disconnectPrisma } from "./lib/prisma";
import "./types/express";

async function main() {
  await prisma.$connect();
  // eslint-disable-next-line no-console
  console.log("✅ اتصال به دیتابیس برقرار شد");

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 سرور روی پورت ${env.PORT} در حالت ${env.NODE_ENV} اجرا شد`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} گرفته شد، در حال خاموش‌کردن امن سرور...`);
    server.close(async () => {
      await disconnectPrisma();
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
