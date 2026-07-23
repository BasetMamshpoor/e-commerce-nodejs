import { prisma } from "../lib/prisma";
import { pricingConfig } from "../config/pricing.config";
import { fetchAllRates } from "../services/exchangeRateFetcher";

let lastRunAt = 0;

export async function runCurrencyRateFetchJob(): Promise<void> {
  const now = Date.now();
  const intervalMs = pricingConfig.rateFetchIntervalHours * 60 * 60 * 1000;

  if (now - lastRunAt < intervalMs) return;

  const activeCurrencies = await prisma.currency.count({ where: { isActive: true } });
  if (activeCurrencies === 0) return;

  lastRunAt = now;
  await fetchAllRates();
}
