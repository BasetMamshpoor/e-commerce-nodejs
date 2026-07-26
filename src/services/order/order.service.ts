import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { parsePagination, buildPaginationMeta } from "../../utils/pagination";
import { generateOrderNumber } from "../../utils/orderNumber";
import { allocateProportionally } from "../../utils/allocation";
import { pricingConfig } from "../../config/pricing.config";
import * as cartService from "../shopping/cart.service";
import * as discountApplyService from "../discount/discount-apply.service";
import * as walletService from "../wallet/wallet.service";
import * as gatewayAdminService from "../payment/payment-gateway-admin.service";
import { calculateShippingCost } from "../shipping/shipping-company.service";
import { recomputeProductAggregates } from "../catalog/product.service";
import { notifyUser } from "../notification/notification.service";
import { createAdminNotification } from "../notification/admin-notification.service";
import {
  CreateOrderInput,
  ListOrdersQuery,
  AdminListOrdersQuery,
  AdminUpdateOrderStatusInput,
} from "../../validations/order.validation";
import { Order, OrderStatus, PricingMode } from "../../generated/prisma";
import { calculateVariantPrice } from "../pricingEngine";
import { computeProductEffectivePrice } from "../../utils/pricing";

// ----------------------------------------------------------------------------
// سفارش‌ها — آیتم ۸، ۹، ۱۰. این فایل مسئول «ساخت سفارش از سبد خرید» و
// خوانش/لیست سفارش‌هاست. لغو و مرجوعی در فایل‌های جدا
// (order-cancellation.service.ts / order-return.service.ts) هستند.
//
// نکته‌ی مهم درباره‌ی کسر موجودی هم‌زمان (concurrency):
// به‌جای خواندن stock و بعد update جدا (که زیر بار هم‌زمان race condition
// دارد)، از یک updateMany شرطی استفاده می‌شود:
//   updateMany({ where: { id, stock: { gte: quantity } }, data: { decrement } })
// اگر result.count !== 1 یعنی بین خواندن سبد و لحظه‌ی ثبت سفارش، موجودی
// توسط سفارش دیگری مصرف شده — کل تراکنش rollback می‌شود.
// ----------------------------------------------------------------------------

const ORDER_DETAIL_INCLUDE = {
  items: true,
  statusHistory: { orderBy: { createdAt: "asc" as const } },
  cancellation: true,
  returns: { include: { images: true } },
  shippingCompany: true,
  address: true,
  discountCode: { select: { id: true, code: true } },
  transactions: true,
};

export async function createOrder(userId: number, input: CreateOrderInput): Promise<Order> {
  const cart = await cartService.getCart({ userId });
  if (cart.items.length === 0) throw ApiError.badRequest("سبد خرید شما خالی است");

  const unavailable = cart.items.filter((i) => !i.isAvailable);
  if (unavailable.length > 0) {
    throw ApiError.badRequest(
      `برخی کالاهای سبد خرید دیگر موجود نیستند: ${unavailable.map((i) => i.productName).join("، ")}`
    );
  }

  // بررسی مجدد قیمت‌ها در لحظه ثبت سفارش (برای محصولات ارزی)
  const cartItemIds = cart.items.map((i) => i.variantId);
  const freshVariants = await prisma.productVariant.findMany({
    where: { id: { in: cartItemIds } },
    include: {
      product: {
        include: {
          currency: { select: { code: true, currentRate: true } },
        },
      },
      attributeValues: {
        select: { modifierType: true, modifierValue: true },
      },
    },
  });

  const variantMap = new Map(freshVariants.map((v) => [v.id, v]));

  for (const item of cart.items) {
    const freshVariant = variantMap.get(item.variantId);
    if (!freshVariant) {
      throw ApiError.conflict(`تنوع کالای «${item.productName}» دیگر وجود ندارد`);
    }

    const product = freshVariant.product;

    // قیمت واقعی «همین لحظه» را دقیقاً با همان مسیر محاسباتی سبد خرید
    // می‌سازیم (priceAdjustment + modifierValue های ویژگی‌ها + تخفیف
    // محصول)، وگرنه چون item.unitPrice (قیمت سبد) شامل تخفیف است ولی
    // freshPriceIRT قبلاً بدون تخفیف محاسبه می‌شد، همیشه به‌اشتباه به نظر
    // می‌رسید قیمت «تغییر کرده».
    const freshOriginalPrice = calculateVariantPrice(
      {
        pricingMode: product.pricingMode,
        basePrice: product.basePrice,
        sourcePrice: product.sourcePrice,
        priceBufferPercent: product.priceBufferPercent,
      },
      product.currency ? { currentRate: product.currency.currentRate } : null,
      { priceAdjustment: freshVariant.priceAdjustment, attributeValues: freshVariant.attributeValues }
    ).finalPriceIRT;

    const freshPriceIRT = computeProductEffectivePrice(
      freshOriginalPrice,
      0,
      product.discountType,
      product.discountValue,
      null,
      null
    ).unitPrice;

    const cartPrice = item.unitPrice;
    if (cartPrice > 0) {
      const changePercent = Math.abs(freshPriceIRT - cartPrice) / cartPrice * 100;
      if (changePercent > pricingConfig.priceChangeThresholdPercent) {
        throw ApiError.conflict(
          `قیمت کالای «${item.productName}» تغییر کرده است (${changePercent.toFixed(1)}%). لطفاً سبد خرید را مجدداً بررسی کنید`
        );
      }
    }
  }

  const address = await prisma.address.findUnique({ where: { id: input.addressId } });
  if (!address || address.userId !== userId) throw ApiError.notFound("آدرس ارسال پیدا نشد");

  const shippingCompany = await prisma.shippingCompany.findUnique({
    where: { id: input.shippingCompanyId },
  });
  if (!shippingCompany || !shippingCompany.isActive) {
    throw ApiError.badRequest("شرکت ارسال انتخاب‌شده معتبر نیست");
  }

  // اعتبارسنجی سازگاری روش پرداخت با شرکت ارسال
  if (input.paymentMethod === "FREIGHT_COLLECT" && !shippingCompany.acceptsFreightCollect) {
    throw ApiError.badRequest("این شرکت ارسال روش پرداخت در محل (Freight Collect) را پشتیبانی نمی‌کند");
  }
  if (input.paymentMethod !== "FREIGHT_COLLECT" && !shippingCompany.acceptsPrepay) {
    throw ApiError.badRequest("این شرکت ارسال روش پرداخت پیش از ارسال را پشتیبانی نمی‌کند");
  }

  const subtotal = cart.total;
  const shippingCost = calculateShippingCost(shippingCompany, input.shippingWeight, input.shippingDistance);

  let discountAmount = 0;
  let discountCodeId: number | undefined;
  let eligibleVariantIds: number[] = [];

  if (input.discountCode) {
    const evaluation = await discountApplyService.evaluateDiscountCode(input.discountCode, {
      userId,
    });
    discountAmount = evaluation.discountAmount;
    discountCodeId = evaluation.discountCodeId;
    eligibleVariantIds = evaluation.eligibleVariantIds;
  }

  const totalAmount = Math.max(0, subtotal + shippingCost - discountAmount);

  let wallet: { id: number; balance: number } | null = null;
  let walletPortion = 0;
  let gatewayPortion = 0;
  let gatewayRecord: { id: number; slug: string } | null = null;

  if (input.paymentMethod === "FREIGHT_COLLECT") {
    // پرداخت در محل — هیچ مبلغی آنلاین دریافت نمی‌شود
  } else {
    if (input.paymentMethod !== "GATEWAY") {
      wallet = await walletService.getOrCreateWallet(userId);
    }

    if (input.paymentMethod === "WALLET") {
      if (!wallet || wallet.balance < totalAmount) {
        throw ApiError.badRequest("موجودی کیف پول کافی نیست");
      }
      walletPortion = totalAmount;
    } else if (input.paymentMethod === "MIXED" && wallet) {
      walletPortion = Math.min(wallet.balance, totalAmount);
    }

    gatewayPortion = totalAmount - walletPortion;
    if (gatewayPortion > 0) {
      if (!input.gatewaySlug) throw ApiError.badRequest("انتخاب درگاه پرداخت الزامی است");
      gatewayRecord = await gatewayAdminService.getPaymentGatewayBySlug(input.gatewaySlug);
    }
  }

  // تخصیص متناسب تخفیف بین آیتم‌های واجدشرایط — فقط برای ثبت تاریخچه‌ی دقیق هر آیتم،
  // جمع‌کل discountAmount از قبل محاسبه و قطعی شده است.
  const discountPerVariant = new Map<number, number>();
  if (discountAmount > 0 && eligibleVariantIds.length > 0) {
    const eligibleItems = cart.items.filter((i) => eligibleVariantIds.includes(i.variantId));
    const shares = allocateProportionally(discountAmount, eligibleItems.map((i) => i.lineTotal));
    eligibleItems.forEach((item, idx) => discountPerVariant.set(item.variantId, shares[idx]));
  }

  const orderNumber = generateOrderNumber();
  const isFreightCollect = input.paymentMethod === "FREIGHT_COLLECT";
  const isFullyPaidNow = !isFreightCollect && gatewayPortion === 0;

  const order = await prisma.$transaction(async (tx) => {
    for (const item of cart.items) {
      const result = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count !== 1) {
        throw ApiError.conflict(`موجودی «${item.productName}» کافی نیست، سبد خود را به‌روزرسانی کنید`);
      }
    }

    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        addressId: address.id,
        shippingAddress: {
          title: address.title,
          receiverName: address.receiverName,
          receiverPhone: address.receiverPhone,
          province: address.province,
          city: address.city,
          postalCode: address.postalCode,
          fullAddress: address.fullAddress,
          lat: address.lat,
          lng: address.lng,
        },
        shippingCompanyId: shippingCompany.id,
        shippingCost,
        shippingWeight: input.shippingWeight ?? null,
        shippingDistance: input.shippingDistance ?? null,
        subtotal,
        discountAmount,
        taxAmount: 0,
        totalAmount,
        discountCodeId,
        paymentMethod: input.paymentMethod,
        status: isFreightCollect || isFullyPaidNow ? "PROCESSING" : "PENDING_PAYMENT",
        paidAt: isFullyPaidNow ? new Date() : null,
        items: {
          create: cart.items.map((item) => {
            const freshVariant = variantMap.get(item.variantId);
            const product = freshVariant?.product;
            const isCurrencyBased = product?.pricingMode === "CURRENCY_BASED";
            return {
              variantId: item.variantId,
              productName: item.productName,
              variantAttributes: item.attributesLabel || null,
              price: item.unitPrice,
              quantity: item.quantity,
              discountAmount: discountPerVariant.get(item.variantId) ?? 0,
              finalPriceIRT: item.unitPrice,
              pricingModeSnapshot: (product?.pricingMode as PricingMode) ?? "FIXED_IRT",
              sourceCurrencyCode: isCurrencyBased ? (product?.currency as { code?: string })?.code ?? null : null,
              appliedRate: isCurrencyBased ? ((product?.currency as { currentRate?: number })?.currentRate ?? null) : null,
            };
          }),
        },
        statusHistory: {
          create: { status: isFreightCollect || isFullyPaidNow ? "PROCESSING" : "PENDING_PAYMENT" },
        },
      },
    });

    if (walletPortion > 0 && wallet) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: walletPortion } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "PURCHASE",
          amount: walletPortion,
          description: `پرداخت سفارش ${orderNumber}`,
          orderId: createdOrder.id,
        },
      });
    }

    if (gatewayPortion > 0 && gatewayRecord) {
      await tx.transaction.create({
        data: {
          orderId: createdOrder.id,
          userId,
          gatewayId: gatewayRecord.id,
          type: "ORDER_PAYMENT",
          amount: gatewayPortion,
          status: "PENDING",
        },
      });
    }

    if (discountCodeId) {
      await discountApplyService.recordDiscountCodeUsage(
        { discountCodeId, userId, orderId: createdOrder.id, discountAmount },
        tx
      );
    }

    await tx.cartItem.deleteMany({ where: { cart: { userId } } });

    return createdOrder;
  });

  const affectedProductIds = await prisma.productVariant
    .findMany({
      where: { id: { in: cart.items.map((i) => i.variantId) } },
      select: { productId: true },
    })
    .then((rows) => Array.from(new Set(rows.map((r) => r.productId))));
  await Promise.all(affectedProductIds.map((id) => recomputeProductAggregates(id)));

  notifyUser({
    userId,
    type: "ORDER",
    title: `سفارش ${order.orderNumber}`,
    message: "سفارش شما با موفقیت ثبت شد",
    link: `/orders/${order.id}`,
  }).catch(() => undefined);

  createAdminNotification({
    type: "ORDER",
    title: "سفارش جدید",
    message: `سفارش ${order.orderNumber} ثبت شد`,
    link: `/admin/orders/${order.id}`,
  }).catch(() => undefined);

  return order;
}

export async function getOrderDetail(orderId: number, userId?: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_DETAIL_INCLUDE,
  });
  if (!order) throw ApiError.notFound("سفارش پیدا نشد");
  if (userId && order.userId !== userId) throw ApiError.notFound("سفارش پیدا نشد");
  return order;
}

export async function listOrders(userId: number, query: ListOrdersQuery) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where = { userId, ...(query.status ? { status: query.status } : {}) };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: { items: true, shippingCompany: true },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}

export async function listOrdersAdmin(query: AdminListOrdersQuery) {
  const pagination = parsePagination({ page: query.page, limit: query.limit });
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.search ? { orderNumber: { contains: query.search, mode: "insensitive" as const } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      include: { items: true, shippingCompany: true, user: { select: { id: true, fullName: true, phone: true, email: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(total, pagination) };
}



const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال شد",
  DELIVERED: "تحویل داده شد",
  CANCELLED: "لغو شد",
  RETURN_REQUESTED: "درخواست مرجوعی ثبت شد",
  RETURNED: "مرجوع شد",
  REFUNDED: "وجه بازگشت داده شد",
  FAILED: "ناموفق",
};

export async function updateOrderStatusAdmin(
  orderId: number,
  input: AdminUpdateOrderStatusInput
): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound("سفارش پیدا نشد");

  const wasDelivered = order.status !== "DELIVERED" && input.status === "DELIVERED";

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: input.status as OrderStatus,
        ...(input.trackingCode !== undefined ? { trackingCode: input.trackingCode } : {}),
        ...(input.packageNumber !== undefined ? { packageNumber: input.packageNumber } : {}),
      },
    });

    if (wasDelivered) {
      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
        select: { quantity: true, variant: { select: { productId: true } } },
      });
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.variant.productId },
          data: { totalSold: { increment: item.quantity } },
        });
      }
    }

    await tx.orderStatusHistory.create({
      data: { orderId, status: input.status as OrderStatus, note: input.note },
    });
    return updatedOrder;
  });

  notifyUser({
    userId: order.userId,
    type: "ORDER",
    title: `سفارش ${order.orderNumber}`,
    message: `وضعیت سفارش شما به «${ORDER_STATUS_LABELS[input.status as OrderStatus]}» تغییر کرد`,
    link: `/orders/${order.id}`,
  }).catch(() => undefined);

  return updated;
}
