import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { ReturnOrderInput, AdminUpdateReturnInput } from "../../validations/order.validation";
import { OrderReturn, Order, OrderItem } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// مرجوعی سفارش — آیتم ۱۰. برخلاف لغو (که خودکار است)، مرجوعی نیاز به بررسی
// ادمین دارد (وضعیت اولیه PENDING) چون معمولاً باید کالای فیزیکی برگشتی
// بررسی شود.
// ----------------------------------------------------------------------------

export async function requestReturn(
  userId: string,
  orderId: string,
  input: ReturnOrderInput
): Promise<OrderReturn> {
  const order = (await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })) as (Order & { items: OrderItem[] }) | null;
  if (!order || order.userId !== userId) throw ApiError.notFound("سفارش پیدا نشد");

  if (order.status !== "DELIVERED") {
    throw ApiError.conflict("فقط سفارش‌های تحویل‌شده قابل درخواست مرجوعی هستند");
  }

  if (input.orderItemId && !order.items.some((i) => i.id === input.orderItemId)) {
    throw ApiError.badRequest("آیتم سفارش انتخاب‌شده در این سفارش پیدا نشد");
  }

  const orderReturn = await prisma.$transaction(async (tx) => {
    const created = await tx.orderReturn.create({
      data: {
        orderId,
        orderItemId: input.orderItemId,
        reason: input.reason,
        status: "PENDING",
        images: { create: input.imageMediaIds.map((mediaId) => ({ mediaId })) },
      },
      include: { images: true },
    });

    await tx.order.update({ where: { id: orderId }, data: { status: "RETURN_REQUESTED" } });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "RETURN_REQUESTED", note: input.reason },
    });

    return created;
  });

  return orderReturn;
}

export async function listReturnsAdmin(query: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const where = query.status ? { status: query.status as never } : {};
  return prisma.orderReturn.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { images: true, order: { select: { orderNumber: true, userId: true } } },
  });
}

export async function updateReturnAdmin(
  returnId: string,
  input: AdminUpdateReturnInput
): Promise<OrderReturn> {
  const orderReturn = (await prisma.orderReturn.findUnique({
    where: { id: returnId },
    include: { order: { include: { items: true } }, orderItem: true },
  })) as (OrderReturn & { order: Order & { items: OrderItem[] }; orderItem: OrderItem | null }) | null;
  if (!orderReturn) throw ApiError.notFound("درخواست مرجوعی پیدا نشد");

  return prisma.$transaction(async (tx) => {
    if (input.status === "RECEIVED") {
      const itemsToRestock = orderReturn.orderItemId
        ? orderReturn.order.items.filter((i) => i.id === orderReturn.orderItemId)
        : orderReturn.order.items;

      for (const item of itemsToRestock) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    if (input.status === "REFUNDED") {
      if (!input.refundAmount) {
        throw ApiError.badRequest("مبلغ بازگشتی (refundAmount) برای تایید نهایی الزامی است");
      }

      const wallet = await tx.wallet.upsert({
        where: { userId: orderReturn.order.userId },
        create: { userId: orderReturn.order.userId, balance: 0 },
        update: {},
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: input.refundAmount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount: input.refundAmount,
          description: `بازگشت وجه مرجوعی سفارش ${orderReturn.order.orderNumber}`,
          orderId: orderReturn.orderId,
        },
      });

      if (!orderReturn.orderItemId) {
        await tx.order.update({ where: { id: orderReturn.orderId }, data: { status: "RETURNED" } });
        await tx.orderStatusHistory.create({
          data: { orderId: orderReturn.orderId, status: "RETURNED", note: "مرجوعی تایید و وجه بازگشت داده شد" },
        });
      }
    }

    if (input.status === "REJECTED" && orderReturn.order.status === "RETURN_REQUESTED") {
      await tx.order.update({ where: { id: orderReturn.orderId }, data: { status: "DELIVERED" } });
      await tx.orderStatusHistory.create({
        data: { orderId: orderReturn.orderId, status: "DELIVERED", note: "درخواست مرجوعی رد شد" },
      });
    }

    return tx.orderReturn.update({
      where: { id: returnId },
      data: {
        status: input.status,
        refundAmount: input.refundAmount,
        adminNote: input.adminNote,
        reviewedAt: new Date(),
      },
    });
  });
}
