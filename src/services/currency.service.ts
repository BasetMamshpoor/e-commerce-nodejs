import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { recalculateProductsForCurrency } from "./exchangeRateFetcher";
import { getOrSetCache, invalidateCache } from "../lib/cache";

// نکته درباره‌ی کش این سرویس: نرخ ارز (currentRate) از دو مسیر نوشته
// می‌شود — این سرویس (ویرایش دستی توسط ادمین) و کرون‌جاب دوره‌ای
// (exchangeRateFetcher.ts که مستقیم prisma.currency.update می‌زند، بدون
// عبور از این فایل). چون invalidation دقیق برای مسیر دوم پرریسک است
// (فراموش‌کردنش یعنی نرخ قدیمی مدتی نمایش داده شود)، از یک TTL کوتاه
// (۶۰ ثانیه) به‌عنوان شبکه‌ی ایمنی استفاده می‌کنیم — حتی اگر جایی
// invalidate را فراموش کنیم، بیش از ۶۰ ثانیه قیمت قدیمی نمایش داده
// نمی‌شود؛ در کنارش هرجا از همین سرویس می‌نویسیم، صریحاً هم cache را پاک
// می‌کنیم تا در حالت رایج (ویرایش دستی) بلافاصله به‌روز باشد.
export async function listCurrencies() {
  return getOrSetCache("currencies", 60, () => prisma.currency.findMany({ orderBy: { code: "asc" } }));
}

export async function createCurrency(data: {
  code: string;
  name: string;
  symbol?: string;
  isActive?: boolean;
}) {
  const existing = await prisma.currency.findUnique({
    where: { code: data.code },
  });
  if (existing) throw ApiError.conflict("این ارز قبلاً ثبت شده است");

  const created = await prisma.currency.create({
    data: {
      code: data.code,
      name: data.name,
      symbol: data.symbol,
      isActive: data.isActive,
    },
  });
  await invalidateCache("currencies");
  return created;
}

export async function updateCurrency(
  id: number,
  data: { name?: string; isActive?: boolean; currentRate?: number },
) {
  const currency = await prisma.currency.findUnique({ where: { id } });
  if (!currency) throw ApiError.notFound("ارز پیدا نشد");

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.currentRate !== undefined) {
    updateData.currentRate = data.currentRate;
    updateData.lastAppliedRate = data.currentRate;
    updateData.lastAppliedAt = new Date();
  }

  const updated = await prisma.currency.update({
    where: { id },
    data: updateData,
  });
  await invalidateCache("currencies");

  if (data.currentRate !== undefined) {
    await recalculateProductsForCurrency(id, data.currentRate);
  }

  return updated;
}
