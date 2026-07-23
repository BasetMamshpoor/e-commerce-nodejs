import { env } from "./env";

export const pricingConfig = {
  thresholdPercent: env.CURRENCY_UPDATE_THRESHOLD_PERCENT,
  forceSyncIntervalHours: env.FORCE_SYNC_INTERVAL_HOURS,
  rateFetchIntervalHours: env.RATE_FETCH_INTERVAL_HOURS,
  priceChangeThresholdPercent: env.PRICE_CHANGE_THRESHOLD_PERCENT,
};
