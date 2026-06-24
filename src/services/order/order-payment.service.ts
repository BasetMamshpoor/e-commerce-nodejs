import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { getGateway } from "../payment/payment.factory";
import { getPaymentGatewayBySlug } from "../payment/payment-gateway-admin.service";
import { Order } from "../../generated/prisma";

async function getOwnedOrder(userId: string, orderId: string): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== userId) throw ApiError.notFound("سفارش پیدا نشد");
  return order;
}

export async function initiateOrderPayment(
  userId: string,
  orderId: string,
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
    orderId: order.id,
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
  userId: string,
  orderId: string,
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

  const gateway = getGateway(gatewayRecord.slug);
  const result = await gateway.verifyPayment({
    orderId: order.id,
    amount: transaction.amount,
    providerParams,
  });

  if (!result.success) {
    await prisma.transaction.update({ where: { id: transaction.id }, data: { status: "FAILED" } });
    throw ApiError.badRequest("پرداخت ناموفق بود؛ می‌توانید دوباره تلاش کنید");
  }

  return prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: "SUCCESS", refId: result.refId },
    });
    const updated = await tx.order.update({
      where: { id: order.id },
      data: { status: "PROCESSING", paidAt: new Date() },
    });
    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: "PROCESSING", note: "پرداخت از درگاه تایید شد" },
    });
    return updated;
  });
}
