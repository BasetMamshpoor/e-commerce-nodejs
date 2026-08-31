import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { getGateway } from "../payment/payment.factory";
import { getPaymentGatewayBySlug } from "../payment/payment-gateway-admin.service";
import { notifyUser } from "../notification/notification.service";
import { Order } from "../../generated/prisma";

async function getOwnedOrder(userId: number, orderId: number): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) throw ApiError.notFound("سفارش پیدا نشد");
  return order;
}

export async function initiateOrderPayment(
  userId: number,
  orderId: number,
  gatewaySlug?: string
) {
  const order = await getOwnedOrder(userId, orderId);
  if (order.status !== "PENDING_PAYMENT") {
    throw ApiError.conflict("این سفارش نیازی به پرداخت ندارد یا قبلاً پرداخت شده است");
  }

  const transaction = await prisma.transaction.findFirst({
    where: { orderId, type: "ORDER_PAYMENT", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (!transaction) throw ApiError.badRequest("تراکنش در انتظار پرداختی برای این سفارش پیدا نشد");

  let gatewayId = transaction.gatewayId;
  let gatewaySlugToUse = gatewaySlug;

  if (gatewaySlug) {
    const gatewayRecord = await getPaymentGatewayBySlug(gatewaySlug);
    gatewayId = gatewayRecord.id;
  } else if (gatewayId) {
    const gatewayRecord = await prisma.paymentGateway.findUnique({ where: { id: gatewayId } });
    if (!gatewayRecord) throw ApiError.badRequest("درگاه پرداخت این تراکنش دیگر معتبر نیست");
    gatewaySlugToUse = gatewayRecord.slug;
  } else {
    throw ApiError.badRequest("انتخاب درگاه پرداخت الزامی است");
  }

  if (!gatewayId || !gatewaySlugToUse) {
    throw ApiError.badRequest("انتخاب درگاه پرداخت الزامی است");
  }

  const gateway = getGateway(gatewaySlugToUse);

  const result = await gateway.initiatePayment({
    orderId: String(order.id),
    amount: transaction.amount,
    description: `پرداخت سفارش ${order.orderNumber}`,
    callbackUrl: `${env.APP_BASE_URL}/api/v1/orders/${order.id}/payment/verify`,
  });

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { gatewayId, refId: result.gatewayRefId },
  });

  return { redirectUrl: result.redirectUrl };
}

export async function verifyOrderPayment(
  userId: number,
  orderId: number,
  providerParams: Record<string, string>
): Promise<Order> {
  const order = await getOwnedOrder(userId, orderId);

  const transaction = await prisma.transaction.findFirst({
    where: { orderId, type: "ORDER_PAYMENT", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (!transaction) throw ApiError.badRequest("تراکنش در انتظار پرداختی برای این سفارش پیدا نشد");
  if (!transaction.gatewayId) throw ApiError.badRequest("این تراکنش به درگاهی متصل نیست");

  const gatewayRecord = await prisma.paymentGateway.findUnique({
    where: { id: transaction.gatewayId },
  });
  if (!gatewayRecord) throw ApiError.notFound("درگاه پرداخت پیدا نشد");

  // Atomically claim this transaction BEFORE calling out to the gateway —
  // updateMany's WHERE clause (status: "PENDING") makes this a
  // compare-and-swap: if two verify requests arrive concurrently (double-
  // click, a retried request, or the effect on the frontend page firing
  // twice), only one can actually flip PENDING -> FAILED here; the other
  // gets claim.count === 0 and bails out immediately instead of both
  // proceeding to call gateway.verifyPayment (a network round-trip to the
  // actual payment gateway, which widens the race window a lot) and racing
  // to update the order's status. Provisionally marks FAILED; flipped to
  // SUCCESS below once the gateway actually confirms. If the gateway call
  // throws or the process dies before that, the transaction correctly
  // stays FAILED — same end state as the existing failure path — rather
  // than being left claimed-but-never-finished.
  const claim = await prisma.transaction.updateMany({
    where: { id: transaction.id, status: "PENDING" },
    data: { status: "FAILED" },
  });
  if (claim.count === 0) {
    throw ApiError.conflict("این تراکنش هم‌اکنون در حال بررسی یا قبلاً بررسی شده است");
  }

  const gateway = getGateway(gatewayRecord.slug);
  const result = await gateway.verifyPayment({
    orderId: String(order.id),
    amount: transaction.amount,
    providerParams,
  });

  if (!result.success) {
    // Already marked FAILED by the claim above — nothing further to do.
    throw ApiError.badRequest("پرداخت ناموفق بود؛ می‌توانید دوباره تلاش کنید");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: "SUCCESS", refId: result.refId },
    });
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "PROCESSING", paidAt: new Date() },
    });
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: "PROCESSING", note: "پرداخت از درگاه تایید شد" },
    });
    return updatedOrder;
  });

  notifyUser({
    userId: order.userId,
    type: "ORDER",
    title: `سفارش ${order.orderNumber}`,
    message: "پرداخت سفارش شما با موفقیت تایید شد",
    link: `/orders/${order.id}`,
  }).catch(() => undefined);

  return updated;
}
