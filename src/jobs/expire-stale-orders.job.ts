import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { expireStaleOrder } from "../services/order/order-cancellation.service";

// ----------------------------------------------------------------------------
// چرا این جاب لازم است: در createOrder، موجودی تنوع‌ها همان لحظه‌ی ثبت
// سفارش کسر می‌شود (حتی برای پرداخت از درگاه که هنوز تکمیل نشده) تا دو
// مشتری هم‌زمان نتوانند روی آخرین واحد موجودی سفارش ثبت کنند. اما اگر
// کاربر هیچ‌وقت پرداخت را تکمیل نکند، آن موجودی برای همیشه قفل می‌ماند
// مگر این جاب آن را آزاد کند.
// ----------------------------------------------------------------------------

export async function runExpireStaleOrdersJob(): Promise<void> {
  const threshold = new Date(Date.now() - env.ORDER_PENDING_EXPIRY_MINUTES * 60 * 1000);

  const staleOrders = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lt: threshold } },
    select: { id: true, orderNumber: true },
  });

  for (const order of staleOrders) {
    try {
      await expireStaleOrder(order.id);
      // eslint-disable-next-line no-console
      console.log(`[jobs] سفارش ${order.orderNumber} به دلیل عدم پرداخت خودکار لغو شد`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[jobs] خطا در لغو خودکار سفارش ${order.orderNumber}:`, err);
    }
  }
}
