import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { notifyUser } from "../notification/notification.service";
import { ReturnOrderInput, AdminUpdateReturnInput } from "../../validations/order.validation";
import { OrderReturn, Prisma } from "../../generated/prisma";

export async function requestReturn(
  userId: number,
  orderId: number,
  input: ReturnOrderInput
): Promise<OrderReturn> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
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
  orderId?: number;
  userId?: number;
}) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where: Prisma.OrderReturnWhereInput = {};
  if (query.status) where.status = query.status as never;
  if (query.orderId) where.orderId = query.orderId;
  if (query.userId) where.order = { userId: query.userId };

  const [items, total] = await Promise.all([
    prisma.orderReturn.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: {
        images: true,
        order: {
          select: {
            orderNumber: true,
            userId: true,
            totalAmount: true,
            user: { select: { id: true, fullName: true, phone: true, email: true } },
          },
        },
      },
    }),
    prisma.orderReturn.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}

export async function getReturnDetailAdmin(returnId: number) {
  const orderReturn = await prisma.orderReturn.findUnique({
    where: { id: returnId },
    include: {
      images: true,
      order: {
        include: {
          items: true,
          user: { select: { id: true, fullName: true, phone: true, email: true } },
          address: true,
          shippingCompany: true,
        },
      },
      orderItem: true,
    },
  });
  if (!orderReturn) throw ApiError.notFound("درخواست مرجوعی پیدا نشد");
  return orderReturn;
}

export async function updateReturnAdmin(
  returnId: number,
  input: AdminUpdateReturnInput
): Promise<OrderReturn> {
  const orderReturn = await prisma.orderReturn.findUnique({
    where: { id: returnId },
    include: { order: { include: { items: true } }, orderItem: true },
  });
  if (!orderReturn) throw ApiError.notFound("درخواست مرجوعی پیدا نشد");

  const updated = await prisma.$transaction(async (tx) => {
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

  if (input.status === "REFUNDED") {
    notifyUser({
      userId: orderReturn.order.userId,
      type: "ORDER",
      title: `سفارش ${orderReturn.order.orderNumber}`,
      message: `مرجوعی شما تایید و ${input.refundAmount?.toLocaleString("fa-IR")} تومان به کیف‌پول شما بازگشت داده شد`,
      link: `/orders/${orderReturn.orderId}`,
    }).catch(() => undefined);
  } else if (input.status === "REJECTED") {
    notifyUser({
      userId: orderReturn.order.userId,
      type: "ORDER",
      title: `سفارش ${orderReturn.order.orderNumber}`,
      message: "درخواست مرجوعی شما رد شد",
      link: `/orders/${orderReturn.orderId}`,
    }).catch(() => undefined);
  }

  return updated;
}
