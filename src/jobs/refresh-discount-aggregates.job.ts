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
  const variants = await prisma.productVariant.findMany({
    where: {
      isActive: true,
      OR: [{ discountStartAt: { not: null } }, { discountEndAt: { not: null } }],
    },
    select: { productId: true },
  });

  const productIds = Array.from(new Set(variants.map((v) => v.productId)));
  await Promise.all(productIds.map((id) => recomputeProductAggregates(id)));

  if (productIds.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`[jobs] فیلدهای محاسبه‌شده‌ی ${productIds.length} محصول با تخفیف زمان‌دار بازمحاسبه شد`);
  }
}
