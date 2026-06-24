// این فایل قبل از اجرای هر فایل تست، متغیرهای محیطی حداقلی را ست می‌کند
// تا src/config/env.ts (که envSchema.safeParse انجام می‌دهد) خطا ندهد.
// مقادیر واقعی .env در تست‌ها استفاده/لازم نیست.

import { prisma } from "../src/lib/prisma";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:baset4591@localhost:5432/shopdb";
process.env.JWT_ACCESS_SECRET = "test_access_secret_please_change";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_please_change";
process.env.SMS_PROVIDER = "mock";