// این فایل قبل از اجرای هر فایل تست، متغیرهای محیطی حداقلی را ست می‌کند تا
// src/config/env.ts خطا ندهد. مقادیر واقعی به دیتابیس واقعی وصل نمی‌شوند —
// تست‌ها فقط منطق خالص (بدون I/O) را بررسی می‌کنند.

process.env.NODE_ENV = "test";
process.env.MONGO_URI = "mongodb://localhost:27017/chat_engine_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_ACCESS_SECRET = "test_access_secret_please_change";
process.env.DEFAULT_TENANT_STORE_DATABASE_URL =
  "postgresql://postgres:baset4591@localhost:5432/shopdb";
