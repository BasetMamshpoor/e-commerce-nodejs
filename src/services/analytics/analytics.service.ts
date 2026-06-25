import { prisma } from "../../lib/prisma";
import { bucketKey, defaultDateRange, BucketPeriod } from "../../utils/dateBucket";
import { DateRangeQuery, TopProductsQuery } from "../../validations/analytics.validation";
import { OrderStatus } from "../../generated/prisma";

// ----------------------------------------------------------------------------
// نمودارهای آنالیزی — آیتم ۱۶. همه‌ی این endpoint ها فقط خوانش (read-only)
// هستند و روی داده‌های موجود (سفارش، کاربر، بازدید محصول) محاسبه می‌شوند.
// ----------------------------------------------------------------------------

const ALL_ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
  "FAILED",
];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getOverview() {
  const today = startOfToday();

  const [
    totalRevenueAgg,
    totalOrders,
    totalUsers,
    totalProducts,
    pendingOrders,
    todayRevenueAgg,
    todayOrders,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { paidAt: { not: null } }, _sum: { totalAmount: true } }),
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
    prisma.order.aggregate({
      where: { paidAt: { gte: today } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
  ]);

  return {
    totalRevenue: totalRevenueAgg._sum.totalAmount ?? 0,
    totalOrders,
    totalUsers,
    totalProducts,
    pendingOrders,
    todayRevenue: todayRevenueAgg._sum.totalAmount ?? 0,
    todayOrders,
  };
}

export async function getSalesOverTime(query: DateRangeQuery) {
  const { from, to } = query.from || query.to ? query : defaultDateRange(30);
  const period: BucketPeriod = query.period;

  const orders = await prisma.order.findMany({
    where: { paidAt: { not: null, gte: from, lte: to } },
    select: { paidAt: true, totalAmount: true },
  });

  const buckets = new Map<string, { revenue: number; orderCount: number }>();
  for (const order of orders) {
    const key = bucketKey(order.paidAt as Date, period);
    const bucket = buckets.get(key) ?? { revenue: 0, orderCount: 0 };
    bucket.revenue += order.totalAmount;
    bucket.orderCount += 1;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries())
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

export async function getOrderStatusBreakdown() {
  const counts = await Promise.all(
    ALL_ORDER_STATUSES.map((status) => prisma.order.count({ where: { status } }))
  );
  return ALL_ORDER_STATUSES.map((status, i) => ({ status, count: counts[i] }));
}

export async function getTopProducts(query: TopProductsQuery) {
  const { from, to } = query.from || query.to ? query : defaultDateRange(90);

  const items = (await prisma.orderItem.findMany({
    where: { order: { paidAt: { not: null, gte: from, lte: to } } },
    include: { variant: { select: { productId: true } } },
  })) as unknown as {
    quantity: number;
    price: number;
    variant: { productId: string };
  }[];

  const aggregated = new Map<string, { quantitySold: number; revenue: number }>();
  for (const item of items) {
    const productId = item.variant.productId;
    const entry = aggregated.get(productId) ?? { quantitySold: 0, revenue: 0 };
    entry.quantitySold += item.quantity;
    entry.revenue += item.price * item.quantity;
    aggregated.set(productId, entry);
  }

  const sorted = Array.from(aggregated.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, query.limit);

  const products = await prisma.product.findMany({
    where: { id: { in: sorted.map(([productId]) => productId) } },
    select: { id: true, name: true, slug: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return sorted.map(([productId, stats]) => ({
    product: productMap.get(productId) ?? { id: productId, name: "محصول حذف‌شده", slug: "" },
    ...stats,
  }));
}

export async function getNewUsersOverTime(query: DateRangeQuery) {
  const { from, to } = query.from || query.to ? query : defaultDateRange(30);
  const period: BucketPeriod = query.period;

  const users = await prisma.user.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (const user of users) {
    const key = bucketKey(user.createdAt, period);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}
