import { Injectable } from "@nestjs/common";
import { TenantModel, TenantDocument } from "./tenant.model";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

// ----------------------------------------------------------------------------
// نقطه‌ی مرکزی چند-مستاجری‌بودن موتور. هر جای دیگر کد که نیاز به دیتابیس
// فروشگاه دارد، از این‌جا تنانت را resolve می‌کند — هیچ‌جای دیگری مستقیماً
// به env متصل نمی‌شود (به همین خاطر فردا اضافه‌کردن تنانت دوم صفر خط کد در
// بقیه‌ی موتور تغییر می‌دهد؛ فقط یک سند جدید در کالکشن tenants).
// ----------------------------------------------------------------------------

@Injectable()
export class TenancyService {
  async ensureDefaultTenant(): Promise<void> {
    const count = await TenantModel.countDocuments();

    if (count === 0) {
      await TenantModel.create({
        key: env.DEFAULT_TENANT_KEY,
        name: env.DEFAULT_TENANT_NAME,
        storeDatabaseUrl: env.DEFAULT_TENANT_STORE_DATABASE_URL,
        isActive: true,
        telegramBotToken: env.DEFAULT_TENANT_TELEGRAM_BOT_TOKEN || null,
      });

      // eslint-disable-next-line no-console
      console.log(`✅ تنانت پیش‌فرض «${env.DEFAULT_TENANT_KEY}» ساخته شد`);
      return;
    }

    // اگر تنانت پیش‌فرض قبلاً ساخته شده ولی توکن تلگرام بعداً به .env اضافه
    // شده، همین‌جا sync می‌شود — بدون نیاز به دستکاری دستی Mongo.
    if (env.DEFAULT_TENANT_TELEGRAM_BOT_TOKEN) {
      await TenantModel.updateOne(
        { key: env.DEFAULT_TENANT_KEY, telegramBotToken: null },
        { $set: { telegramBotToken: env.DEFAULT_TENANT_TELEGRAM_BOT_TOKEN } }
      );
    }
  }

  async resolveTenant(tenantKey: string): Promise<TenantDocument> {
    const tenant = await TenantModel.findOne({ key: tenantKey.toLowerCase(), isActive: true });
    if (!tenant) {
      throw ApiError.notFound(`تنانت «${tenantKey}» پیدا نشد یا غیرفعال است`);
    }
    return tenant;
  }

  // در حالت تک‌کسب‌وکاری فعلی، اگر کانالی (وب‌سایت/اینستاگرام/...) صراحتاً
  // تنانت مشخص نکند، همین یکی پیش‌فرض در نظر گرفته می‌شود.
  resolveDefaultTenantKey(): string {
    return env.DEFAULT_TENANT_KEY;
  }
}
