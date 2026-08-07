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

  // ----------------------------------------------------------------------------
  // لایه‌ی دوم (AI) — قابل تعویض بین چند سرویس، کاملاً از env کنترل می‌شود.
  // AI_PROVIDER تعیین می‌کند کدام یک «فعال» است؛ فقط همان یکی نیاز به کلید
  // واقعی دارد، بقیه می‌توانند خالی بمانند.
  //
  // anthropic  → Anthropic Messages API (شکل درخواست/پاسخش با بقیه فرق دارد)
  // openai / deepseek / openrouter / kilo / google / custom
  //            → همه‌شان یک API سازگار با OpenAI (/chat/completions) دارند؛
  //              فقط baseUrl، apiKey و model عوض می‌شود. base URL های
  //              پیش‌فرض verify‌شده‌اند (اسناد رسمی هر سرویس)، ولی هرکدام
  //              قابل override هم هستند.
  // "custom"   → برای هر gateway دیگری که این لیست را ندارد؛ baseUrl حتماً
  //              باید خودتان بدهید.
  // ----------------------------------------------------------------------------
  AI_PROVIDER: z.enum(["anthropic", "openai", "deepseek", "openrouter", "kilo", "google", "custom"]).default("anthropic"),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.55),

  ANTHROPIC_API_KEY: z.string().optional().default(""),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),

  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_BASE_URL: z.string().default("https://api.openai.com/v1"),

  // مدل‌های v4 پرچمدار دیپ‌سیک؛ نام‌های قدیمی deepseek-chat/deepseek-reasoner
  // منسوخ شده‌اند
  DEEPSEEK_API_KEY: z.string().optional().default(""),
  DEEPSEEK_MODEL: z.string().default("deepseek-v4-flash"),
  DEEPSEEK_BASE_URL: z.string().default("https://api.deepseek.com"),

  // مدل‌های رایگان با پسوند ":free" در openrouter.ai/models قابل فیلتر کردن‌اند
  OPENROUTER_API_KEY: z.string().optional().default(""),
  OPENROUTER_MODEL: z.string().default("meta-llama/llama-3.3-70b-instruct:free"),
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),

  // فرمت مدل: provider/model-name (مثلاً anthropic/claude-sonnet-4.5)
  KILO_API_KEY: z.string().optional().default(""),
  KILO_MODEL: z.string().default("kilocode/kilo-auto/balanced"),
  KILO_BASE_URL: z.string().default("https://api.kilo.ai/api/gateway"),

  // Google AI Studio (Gemini) — لایه‌ی سازگار با OpenAI؛ سهمیه‌ی رایگان
  // سخاوتمندانه‌ای دارد
  GOOGLE_API_KEY: z.string().optional().default(""),
  GOOGLE_MODEL: z.string().default("gemini-2.5-flash"),
  GOOGLE_BASE_URL: z.string().default("https://generativelanguage.googleapis.com/v1beta/openai/"),

  // برای هر gateway دیگری که در لیست بالا نیست
  CUSTOM_API_KEY: z.string().optional().default(""),
  CUSTOM_MODEL: z.string().optional().default(""),
  CUSTOM_BASE_URL: z.string().optional().default(""),

  // حداکثر تعداد کانکشن هم‌زمان Postgres به‌ازای هر تنانت. کش Redis
  // اکثر ترافیک تکراری را جذب می‌کند، اما یک موج از سوال‌های کاملاً
  // متفاوت (محصولات مختلف) هنوز به همین pool می‌رسد.
  STORE_DB_POOL_MAX: z.coerce.number().int().positive().default(20),

  // --- تلگرام ---
  // polling: خودِ سرور مدام از تلگرام می‌پرسد «پیام جدید داری؟» — نیازی به
  //   دامنه/HTTPS ندارد، برای توسعه مناسب است.
  // webhook: تلگرام خودش پیام را به یک آدرس مشخص از سرور POST می‌کند —
  //   نیاز به دامنه‌ی HTTPS واقعی دارد، برای تولید توصیه می‌شود.
  // فقط همین یک متغیر عوض می‌شود؛ هیچ کد دیگری لازم نیست تغییر کند.
  TELEGRAM_MODE: z.enum(["polling", "webhook"]).default("polling"),
  // فقط برای بوت‌استرپ تنانت پیش‌فرض؛ چند-مستاجری بعدی از روی خودِ
  // Tenant.telegramBotToken در Mongo خوانده می‌شود.
  DEFAULT_TENANT_TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
  // فقط برای حالت webhook لازم است (برای ثبت خودکار وبهوک روی تلگرام)
  TELEGRAM_WEBHOOK_BASE_URL: z.string().optional().default(""),
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
