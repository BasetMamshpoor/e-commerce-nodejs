import { env, isTest } from "../config/env";
import { runExpireStaleOrdersJob } from "./expire-stale-orders.job";
import { runCleanupOtpJob } from "./cleanup-otp.job";
import { runRefreshDiscountAggregatesJob } from "./refresh-discount-aggregates.job";
import { runAutoCloseTicketsJob } from "./auto-close-tickets.job";
import { runCurrencyRateFetchJob } from "./currency-rate-fetch.job";
import { withLock } from "../lib/distributedLock";

// ----------------------------------------------------------------------------
// یک scheduler ساده‌ی مبتنی بر setInterval (بدون پکیج اضافه مثل node-cron،
// چون نیاز فعلی فقط «هر N دقیقه یک‌بار اجرا شو» است، نه cron expression
// پیچیده). اگر بعداً به جدول‌بندی دقیق‌تر (مثلاً «هر روز ساعت ۳ بامداد»)
// نیاز داشتید، می‌توانید node-cron را اضافه و همین لیست jobs را به آن وصل کنید.
//
// هر جاب قبل از اجرا یک قفل توزیع‌شده‌ی Redis می‌گیرد (withLock) تا اگر
// پروژه روی چند instance اجرا شود، هر جاب فقط روی یکی از آن‌ها در هر بازه
// اجرا شود؛ TTL قفل کمی کمتر از فاصله‌ی بین اجراهاست تا اگر جابی طولانی
// یا معلق شد، قفل خودش منقضی شود و اجرای بعدی مسدود نماند. اگر Redis در
// دسترس نباشد، withLock مستقیم اجرا می‌کند (رفتار قبلیِ تک‌اینستنس).
// ----------------------------------------------------------------------------

interface Job {
  name: string;
  run: () => Promise<void>;
}

const jobs: Job[] = [
  { name: "expire-stale-orders", run: runExpireStaleOrdersJob },
  { name: "cleanup-otp", run: runCleanupOtpJob },
  { name: "refresh-discount-aggregates", run: runRefreshDiscountAggregatesJob },
  { name: "auto-close-tickets", run: runAutoCloseTicketsJob },
  { name: "currency-rate-fetch", run: runCurrencyRateFetchJob },
];

async function runAllJobs(): Promise<void> {
  // ۹۰٪ فاصله‌ی بین اجراها، تا قفل قبل از دور بعدی خودش آزاد شود
  const lockTtlMs = Math.floor(env.JOB_CHECK_INTERVAL_MINUTES * 60 * 1000 * 0.9);

  for (const job of jobs) {
    try {
      await withLock(`job:${job.name}`, lockTtlMs, job.run);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[jobs] خطا در اجرای job «${job.name}»:`, err);
    }
  }
}

let intervalHandle: NodeJS.Timeout | undefined;

export function startBackgroundJobs(): void {
  if (!env.ENABLE_BACKGROUND_JOBS || isTest) return;

  // eslint-disable-next-line no-console
  console.log(`🕐 کرون‌جاب‌های پس‌زمینه هر ${env.JOB_CHECK_INTERVAL_MINUTES} دقیقه اجرا می‌شوند`);

  // یک اجرای فوری در لحظه‌ی بالا‌آمدن سرور (مثلاً برای پاک‌سازی سفارش‌های رهاشده‌ی قبلی)
  runAllJobs().catch(() => undefined);

  intervalHandle = setInterval(() => {
    runAllJobs().catch(() => undefined);
  }, env.JOB_CHECK_INTERVAL_MINUTES * 60 * 1000);

  // نگذار این تایمر جلوی خروج طبیعی پروسه (مثلاً در تست‌ها) را بگیرد
  intervalHandle.unref();
}

export function stopBackgroundJobs(): void {
  if (intervalHandle) clearInterval(intervalHandle);
}
