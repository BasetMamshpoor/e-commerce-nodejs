import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { recalculateProductsForCurrency } from "./exchangeRateFetcher";

export async function listCurrencies() {
  return prisma.currency.findMany({ orderBy: { code: "asc" } });
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

  return prisma.currency.create({
    data: {
      code: data.code,
      name: data.name,
      symbol: data.symbol,
      isActive: data.isActive,
    },
  });
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

  if (data.currentRate !== undefined) {
    await recalculateProductsForCurrency(id, data.currentRate);
  }

  return updated;
}
