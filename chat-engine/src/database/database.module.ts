import { Global, Module, OnApplicationShutdown, OnModuleInit } from "@nestjs/common";
import mongoose from "mongoose";
import { env, isProd } from "../config/env";

// ----------------------------------------------------------------------------
// موتور از مدل‌های mongoose «خام» استفاده می‌کند (نه @nestjs/mongoose)، چون
// این مدل‌ها framework-agnostic نوشته شده‌اند و مستقیماً تست‌پذیرند. این
// ماژول فقط مسئول باز/بستن اتصال mongoose (singleton پیش‌فرض) در چرخه‌ی
// عمر اپلیکیشن نست است.
// ----------------------------------------------------------------------------

@Global()
@Module({})
export class DatabaseModule implements OnModuleInit, OnApplicationShutdown {
  async onModuleInit() {
    mongoose.set("strictQuery", true);
    await mongoose.connect(env.MONGO_URI);
    if (!isProd) {
      // eslint-disable-next-line no-console
      console.log("✅ به MongoDB (دیتابیس موتور پاسخگو) وصل شد");
    }
  }

  async onApplicationShutdown() {
    await mongoose.disconnect();
  }
}
