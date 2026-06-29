import { env, isTest } from "../config/env";
import { runExpireStaleOrdersJob } from "./expire-stale-orders.job";
import { runCleanupOtpJob } from "./cleanup-otp.job";
import { runRefreshDiscountAggregatesJob } from "./refresh-discount-aggregates.job";

// ----------------------------------------------------------------------------
// یک scheduler ساده‌ی مبتنی بر setInterval (بدون پکیج اضافه مثل node-cron،
// چون نیاز فعلی فقط «هر N دقیقه یک‌بار اجرا شو» است، نه cron expression
// پیچیده). اگر بعداً به جدول‌بندی دقیق‌تر (مثلاً «هر روز ساعت ۳ بامداد»)
// نیاز داشتید، می‌توانید node-cron را اضافه و همین لیست jobs را به آن وصل کنید.
//
// ⚠️ این scheduler فقط برای یک اینستنس از سرور طراحی شده. اگر پروژه را
// روی چند instance (horizontal scale) دیپلوی کردید، باید یک قفل توزیع‌شده
// (مثلاً advisory lock پستگرس یا Redis) اضافه کنید تا هر جاب فقط روی یک
// instance اجرا شود، وگرنه همان کار چند بار تکرار می‌شود.
// ----------------------------------------------------------------------------

interface Job {
  name: string;
  run: () => Promise<void>;
}

const jobs: Job[] = [
  { name: "expire-stale-orders", run: runExpireStaleOrdersJob },
  { name: "cleanup-otp", run: runCleanupOtpJob },
  { name: "refresh-discount-aggregates", run: runRefreshDiscountAggregatesJob },
];

async function runAllJobs(): Promise<void> {
  for (const job of jobs) {
    try {
      await job.run();
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
