import "dotenv/config";
import { z } from "zod";

// ----------------------------------------------------------------------------
// موتور به‌طور کامل مستقل از پروژه‌ی بک‌اند اصلی است:
// - دیتابیس خودش (مکالمات/پیام‌ها/اپراتورها/تنانت‌ها) روی MongoDB است.
// - Redis برای دو کار: آداپتور Socket.io (تا وقتی چند نمونه از سرور بالا
//   می‌آید، پیام‌ها بین همه‌ی نمونه‌ها sync بمانند) و کش کوتاه‌مدت کوئری‌های
//   پرتکرار دیتابیس فروشگاه.
// - تنها ارتباطش با بک‌اند اصلی، خواندنِ مستقیم از دیتابیس Postgres آن است
//   (بدون هیچ صدازدن API‌ای)؛ این کانکشن به‌ازای هر «تنانت» در خودِ Mongo
//   نگه داشته می‌شود، نه در env (DEFAULT_TENANT_* فقط برای بوت‌استرپ اولین
//   اجراست — نصب تک‌کسب‌وکاری).
// ----------------------------------------------------------------------------

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4100),
  CORS_ORIGIN: z.string().default("*"),

  MONGO_URI: z.string().min(1, "MONGO_URI تنظیم نشده است"),
  REDIS_URL: z.string().min(1, "REDIS_URL تنظیم نشده است"),

  // همان مقدار JWT_ACCESS_SECRET پروژه‌ی اصلی — تا اپراتورهایی که در پنل
  // ادمین سایت اصلی لاگین کرده‌اند، بدون لاگین دوباره وارد بخش اپراتور
  // این موتور هم بشوند.
  JWT_ACCESS_SECRET: z.string().min(10, "JWT_ACCESS_SECRET تنظیم نشده است"),

  // --- بوت‌استرپ تنانت پیش‌فرض (فقط اگر کالکشن tenants خالی باشد) ---
  DEFAULT_TENANT_KEY: z.string().default("default"),
  DEFAULT_TENANT_NAME: z.string().default("فروشگاه پیش‌فرض"),
  DEFAULT_TENANT_STORE_DATABASE_URL: z.string().min(1, "DEFAULT_TENANT_STORE_DATABASE_URL تنظیم نشده است"),

  AI_PROVIDER: z.enum(["anthropic", "openai"]).default("anthropic"),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.55),

  // حداکثر تعداد کانکشن هم‌زمان Postgres به‌ازای هر تنانت. کش Redis
  // اکثر ترافیک تکراری را جذب می‌کند، اما یک موج از سوال‌های کاملاً
  // متفاوت (محصولات مختلف) هنوز به همین pool می‌رسد.
  STORE_DB_POOL_MAX: z.coerce.number().int().positive().default(20),
});

export type Env = z.infer<typeof envSchema>;

// برای @nestjs/config → ConfigModule.forRoot({ validate })
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("❌ متغیرهای محیطی chat-engine نامعتبر هستند:");
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    process.exit(1);
  }
  return parsed.data;
}

// یک singleton ساده و eager هم نگه می‌داریم — خیلی از سرویس‌ها (خصوصاً
// engine/* که عمداً framework-agnostic نوشته شده‌اند) به ConfigService
// تزریق‌شده نیاز ندارند و همین کافی است.
export const env: Env = validateEnv(process.env);

export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
