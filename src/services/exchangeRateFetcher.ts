import { prisma } from "../lib/prisma";
import { pricingConfig } from "../config/pricing.config";
import { calculateFinalPrice } from "./pricingEngine";
import * as brsapiProvider from "./providers/brsapiProvider";
import * as navasanProvider from "./providers/navasanProvider";

const REQUIRED_CODES = new Set(["USD", "EUR", "AED", "CNY", "TRY", "IQD"]);

async function fetchFromPrimary(): Promise<Map<string, number>> {
  const results = await brsapiProvider.fetchAll();
  const map = new Map<string, number>();
  for (const r of results) {
    if (REQUIRED_CODES.has(r.code)) {
      map.set(r.code, r.rate);
    }
  }
  return map;
}

async function fetchFromFallback(missingCodes: string[]): Promise<Map<string, number>> {
  const results = await navasanProvider.fetchAll();
  const map = new Map<string, number>();
  for (const r of results) {
    if (missingCodes.includes(r.code)) {
      map.set(r.code, r.rate);
    }
  }
  return map;
}

export async function shouldRecalculateCurrency(
  currency: { lastAppliedRate: number | null; lastAppliedAt: Date | null },
  newRate: number,
  now: Date
): Promise<boolean> {
  if (currency.lastAppliedRate === null || currency.lastAppliedAt === null) return true;

  const changePercent = Math.abs((newRate - currency.lastAppliedRate) / currency.lastAppliedRate) * 100;

  if (changePercent >= pricingConfig.thresholdPercent) return true;

  const hoursSinceLastApply =
    (now.getTime() - currency.lastAppliedAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastApply >= pricingConfig.forceSyncIntervalHours) return true;

  return false;
}

export async function recalculateProductsForCurrency(
  currencyId: string,
  newRate: number
): Promise<void> {
  const CHUNK_SIZE = 500;
  let skip = 0;

  while (true) {
    const products = await prisma.product.findMany({
      where: {
        currencyId,
        pricingMode: "CURRENCY_BASED",
      },
      include: {
        variants: {
          where: { isActive: true, isDefault: true },
          include: {
            attributeValues: {
              select: { modifierType: true, modifierValue: true },
            },
          },
        },
      },
      take: CHUNK_SIZE,
      skip,
    });

    if (products.length === 0) break;

    for (const product of products) {
      const defaultVariant = product.variants[0];
      const modifiers = defaultVariant
        ? defaultVariant.attributeValues.map((av) => ({
            modifierType: av.modifierType,
            modifierValue: av.modifierValue,
          }))
        : [];

      const result = calculateFinalPrice(
        {
          pricingMode: "CURRENCY_BASED",
          basePrice: product.basePrice,
          sourcePrice: product.sourcePrice,
          priceBufferPercent: product.priceBufferPercent,
        },
        { currentRate: newRate },
        modifiers
      );

      await prisma.product.update({
        where: { id: product.id },
        data: {
          currentPriceIRT: result.finalPriceIRT,
          priceUpdatedAt: new Date(),
          minPrice: result.finalPriceIRT,
          maxPrice: result.finalPriceIRT,
        },
      });
    }

    skip += CHUNK_SIZE;
  }

  await prisma.currency.update({
    where: { id: currencyId },
    data: {
      lastAppliedRate: newRate,
      lastAppliedAt: new Date(),
    },
  });

  await prisma.exchangeRateHistory.updateMany({
    where: {
      currencyId,
      wasApplied: false,
    },
    data: {
      wasApplied: true,
    },
  });
}

export async function fetchAllRates(): Promise<void> {
  const now = new Date();

  let primaryMap: Map<string, number>;
  let source = "brsapi";

  try {
    primaryMap = await fetchFromPrimary();
  } catch (err) {
    console.error("[exchangeRateFetcher] Primary provider failed:", err);

    try {
      const fallbackMap = await fetchFromFallback([...REQUIRED_CODES]);
      primaryMap = fallbackMap;
      source = "navasan";
    } catch (err2) {
      console.error("[exchangeRateFetcher] Fallback provider also failed:", err2);
      return;
    }
  }

  const currencies = await prisma.currency.findMany({
    where: { isActive: true, code: { in: [...REQUIRED_CODES] } },
  });

  for (const currency of currencies) {
    const rate = primaryMap.get(currency.code);

    if (rate === undefined) {
      if (source === "brsapi") {
        try {
          const fallbackForOne = await fetchFromFallback([currency.code]);
          const fallbackRate = fallbackForOne.get(currency.code);
          if (fallbackRate !== undefined) {
            await recordRate(currency, fallbackRate, "navasan", now);
          } else {
            console.warn(`[exchangeRateFetcher] Currency ${currency.code} not found in either provider`);
          }
        } catch {
          console.warn(`[exchangeRateFetcher] Currency ${currency.code} not found in fallback either`);
        }
      } else {
        console.warn(`[exchangeRateFetcher] Currency ${currency.code} not found in provider response`);
      }
      continue;
    }

    await recordRate(currency, rate, source, now);
  }
}

async function recordRate(
  currency: { id: string; lastAppliedRate: number | null; lastAppliedAt: Date | null },
  rate: number,
  source: string,
  now: Date
): Promise<void> {
  let changePercent: number | null = null;

  if (currency.lastAppliedRate !== null && currency.lastAppliedRate !== 0) {
    changePercent =
      Math.round(
        (Math.abs((rate - currency.lastAppliedRate) / currency.lastAppliedRate) * 100) * 100
      ) / 100;
  }

  await prisma.exchangeRateHistory.create({
    data: {
      currencyId: currency.id,
      rate,
      source,
      wasApplied: false,
      changePercent,
      fetchedAt: now,
    },
  });

  await prisma.currency.update({
    where: { id: currency.id },
    data: {
      currentRate: rate,
      lastFetchedAt: now,
    },
  });

  const shouldRecalc = await shouldRecalculateCurrency(currency, rate, now);
  if (shouldRecalc) {
    await recalculateProductsForCurrency(currency.id, rate);
  } else {
    console.log(`[exchangeRateFetcher] Currency ${currency.id} rate changed ${changePercent}% — below threshold, skipping recalculation`);
  }
}
