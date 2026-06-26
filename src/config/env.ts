import "dotenv/config";
import { z } from "zod";

// ----------------------------------------------------------------------------
// تمام متغیرهای محیطی اینجا تعریف و اعتبارسنجی می‌شوند.
// اگر یکی از مقادیر ضروری ست نشده باشد، اپلیکیشن همان لحظه شروع با خطای
// واضح متوقف می‌شود (به‌جای کرش‌کردن ناگهانی وسط اجرا).
// ----------------------------------------------------------------------------

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_BASE_URL: z.string().url().default("http://localhost:4000"),
  // آدرس عمومی سایت فروشگاه (فرانت‌اند) — برای ساخت لینک‌های sitemap.xml.
  // معمولاً دامنه‌ی فرانت با دامنه‌ی همین API فرق دارد؛ اگر ست نشود همان
  // APP_BASE_URL استفاده می‌شود (فقط برای محیط dev که هر دو یکی‌اند کاربردی است).
  PUBLIC_SITE_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().default("*"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL تنظیم نشده است"),

  JWT_ACCESS_SECRET: z.string().min(10, "JWT_ACCESS_SECRET باید حداقل ۱۰ کاراکتر باشد"),
  JWT_REFRESH_SECRET: z.string().min(10, "JWT_REFRESH_SECRET باید حداقل ۱۰ کاراکتر باشد"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  MAX_ACTIVE_SESSIONS: z.coerce.number().int().positive().default(5),

  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(5),
  OTP_EXPIRES_IN_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_MAX_VERIFY_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(60),

  LOGIN_MAX_FAILED_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_LOCK_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  SMS_PROVIDER: z.string().default("mock"),
  SMS_API_KEY: z.string().optional().default(""),
  SMS_SENDER_LINE: z.string().optional().default(""),

  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().optional().default(587),
  SMTP_SECURE: z.coerce.boolean().optional().default(false),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default("My Shop <no-reply@example.com>"),

  // رسانه (آپلود فایل) — آیتم ۱۷
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ متغیرهای محیطی نامعتبر هستند:");
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;

export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
export const publicSiteUrl = env.PUBLIC_SITE_URL ?? env.APP_BASE_URL;
