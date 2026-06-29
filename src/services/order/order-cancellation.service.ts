import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { recomputeProductAggregates } from "../catalog/product.service";
import { notifyUser } from "../notification/notification.service";
import { Order, OrderItem } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// لغو سفارش — آیتم ۱۰. فقط تا قبل از ارسال (PENDING_PAYMENT/PROCESSING)
// خودکار و بدون نیاز به تایید ادمین انجام می‌شود. بعد از ارسال، کاربر باید
// از مسیر مرجوعی (order-return.service.ts) استفاده کند.
//
// performCancellation هسته‌ی مشترک لغو است که هم با درخواست خودِ کاربر
// (cancelOrder) و هم به‌صورت خودکار توسط cron job سفارش‌های رهاشده
// (src/jobs/expire-stale-orders.job.ts) صدا زده می‌شود.
// ----------------------------------------------------------------------------

const CANCELLABLE_STATUSES = ["PENDING_PAYMENT", "PROCESSING"];

type OrderWithItems = Order & { items: OrderItem[] };

async function performCancellation(order: OrderWithItems, reason: string): Promise<Order> {
  const updated = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }

    if (order.paidAt) {
      const walletPayment = await tx.walletTransaction.findFirst({
        where: { orderId: order.id, type: "PURCHASE" },
      });
      if (walletPayment) {
        const wallet = await tx.wallet.findUnique({ where: { id: walletPayment.walletId } });
        if (wallet) {
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: walletPayment.amount } },
          });
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: "REFUND",
              amount: walletPayment.amount,
              description: `بازگشت وجه لغو سفارش ${order.orderNumber}`,
              orderId: order.id,
            },
          });
        }
      }

      const gatewayPayment = await tx.transaction.findFirst({
        where: { orderId: order.id, type: "ORDER_PAYMENT", status: "SUCCESS" },
      });
      if (gatewayPayment) {
        // بازگشت وجه واقعی از درگاه نیاز به فراخوانی API بازگشت وجه همان درگاه دارد
        // (در IPaymentGateway فعلاً تعریف نشده). اینجا فقط تعهد بازگشت ثبت می‌شود
        // تا تیم مالی/ادمین آن را پیگیری کند.
        await tx.transaction.create({
          data: {
            orderId: order.id,
            userId: order.userId,
            gatewayId: gatewayPayment.gatewayId,
            type: "REFUND",
            amount: gatewayPayment.amount,
            status: "PENDING",
          },
        });
      }
    }

    await tx.orderCancellation.create({
      data: { orderId: order.id, reason, status: "APPROVED", reviewedAt: new Date() },
    });

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: "CANCELLED", note: reason },
    });

    return updatedOrder;
  });

  const productIds = await prisma.productVariant
    .findMany({
      where: { id: { in: order.items.map((i) => i.variantId) } },
      select: { productId: true },
    })
    .then((rows) => Array.from(new Set(rows.map((r) => r.productId))));
  await Promise.all(productIds.map((id) => recomputeProductAggregates(id)));

  return updated;
}

export async function cancelOrder(
  userId: string,
  orderId: string,
  reason: string
): Promise<Order> {
  const order = (await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })) as OrderWithItems | null;
  if (!order || order.userId !== userId) throw ApiError.notFound("سفارش پیدا نشد");

  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    if (order.status === "CANCELLED" || order.status === "RETURNED") {
      throw ApiError.conflict("این سفارش قبلاً لغو یا مرجوع شده است");
    }
    throw ApiError.conflict(
      "این سفارش ارسال شده و دیگر قابل لغو نیست؛ می‌توانید از گزینه‌ی مرجوعی استفاده کنید"
    );
  }

  const updated = await performCancellation(order, reason);

  notifyUser({
    userId,
    type: "ORDER",
    title: `سفارش ${order.orderNumber}`,
    message: "سفارش شما با موفقیت لغو شد",
    link: `/orders/${order.id}`,
  }).catch(() => undefined);

  return updated;
}

/**
 * لغو خودکار سفارش‌هایی که مدت زیادی در PENDING_PAYMENT مانده‌اند (کاربر
 * هیچ‌وقت پرداخت را تکمیل نکرده) — توسط cron job صدا زده می‌شود، نه از
 * کنترلر. مالکیت چک نمی‌شود چون caller سیستم است نه کاربر.
 */
export async function expireStaleOrder(orderId: string): Promise<Order> {
  const order = (await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })) as OrderWithItems | null;
  if (!order) throw ApiError.notFound("سفارش پیدا نشد");
  if (order.status !== "PENDING_PAYMENT") {
    throw ApiError.conflict("این سفارش دیگر در وضعیت در‌انتظار‌پرداخت نیست");
  }

  const updated = await performCancellation(
    order,
    "لغو خودکار به دلیل عدم پرداخت در مهلت مجاز"
  );

  notifyUser({
    userId: order.userId,
    type: "ORDER",
    title: `سفارش ${order.orderNumber}`,
    message: "چون در مهلت مقرر پرداخت نشد، سفارش شما به‌صورت خودکار لغو شد",
    link: `/orders/${order.id}`,
  }).catch(() => undefined);

  return updated;
}
