import { env } from "../../config/env";

interface NavasanItem {
  value: string;
  change: number;
  timestamp: number;
  date: string;
}

interface NavasanResponse {
  [key: string]: NavasanItem;
}

export interface RateItem {
  code: string;
  rate: number;
  raw: NavasanItem;
}

const KEY_MAP: Record<string, string> = {
  USD: "usd_sell",
  EUR: "eur",
  AED: "aed",
  CNY: "cny",
  TRY: "try",
  IQD: "iqd",
};

export async function fetchAll(): Promise<RateItem[]> {
  if (!env.NAVASAN_API_KEY) {
    throw new Error("NAVASAN_API_KEY is not configured");
  }

  const url = `https://api.navasan.tech/latest?api_key=${env.NAVASAN_API_KEY}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Navasan API returned ${response.status}`);
  }

  const data = (await response.json()) as NavasanResponse;

  const results: RateItem[] = [];

  for (const [code, key] of Object.entries(KEY_MAP)) {
    const item = data[key];
    if (!item) continue;

    const rate = Number(item.value);
    if (isNaN(rate)) continue;

    results.push({ code, rate, raw: item });
  }

  return results;
}
