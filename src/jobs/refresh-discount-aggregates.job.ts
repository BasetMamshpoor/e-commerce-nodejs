import { prisma } from "../lib/prisma";
import { recomputeProductAggregates } from "../services/catalog/product.service";

// ----------------------------------------------------------------------------
// چرا این جاب لازم است: hasActiveDiscount/minPrice/maxPrice روی Product
// denormalize شده‌اند و فقط هنگام create/update/delete یک variant بازمحاسبه
// می‌شوند. اگر یک تخفیف زمان‌دار (discountStartAt/discountEndAt) باشد، با
// رسیدن/گذشتن آن لحظه خودش را به‌روز نمی‌کند مگر کسی variant را دوباره
// ذخیره کند — این جاب همان بازمحاسبه را دوره‌ای انجام می‌دهد.
// ----------------------------------------------------------------------------

export async function runRefreshDiscountAggregatesJob(): Promise<void> {
  const products = await prisma.product.findMany({
    where: {
      OR: [{ discountType: { not: null } }, { discountValue: { not: null } }],
    },
    select: { id: true },
  });

  await Promise.all(products.map((p) => recomputeProductAggregates(p.id)));

  if (products.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`[jobs] فیلدهای محاسبه‌شده‌ی ${products.length} محصول با تخفیف بازمحاسبه شد`);
  }
}
