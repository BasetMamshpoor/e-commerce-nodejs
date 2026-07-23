import { env } from "../../config/env";

interface BrsApiItem {
  symbol: string;
  name_en: string;
  price: number | string;
  unit: string;
}

interface BrsApiResponse {
  currency: BrsApiItem[];
}

export interface RateItem {
  code: string;
  rate: number;
  raw: BrsApiItem;
}

const CURRENCY_SYMBOLS = new Set(["USD", "EUR", "AED", "CNY", "TRY", "IQD"]);

const FALLBACK_NAMES: Record<string, string[]> = {
  AED: ["united arab emirates dirham", "uae dirham", "emirates dirham", "درهم امارات"],
  CNY: ["chinese yuan", "yuan", "cny", "یوان چین"],
  TRY: ["turkish lira", "lira", "tl", "لیر ترکیه"],
  IQD: ["iraqi dinar", "dinar", "دینار عراق"],
};

function matchByName(nameEn: string): string | null {
  const lower = nameEn.toLowerCase();
  for (const [code, names] of Object.entries(FALLBACK_NAMES)) {
    if (names.some((n) => lower.includes(n))) return code;
  }
  return null;
}

export async function fetchAll(): Promise<RateItem[]> {
  if (!env.BRSAPI_KEY) {
    throw new Error("BRSAPI_KEY is not configured");
  }

  const url = `https://api.brsapi.ir/Market/Gold_Currency.php?key=${env.BRSAPI_KEY}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`BRS API returned ${response.status}`);
  }

  const data = (await response.json()) as BrsApiResponse;

  if (!data?.currency || !Array.isArray(data.currency)) {
    throw new Error("BRS API response missing currency array");
  }

  const results: RateItem[] = [];

  for (const item of data.currency) {
    let code: string | null = null;

    if (CURRENCY_SYMBOLS.has(item.symbol)) {
      code = item.symbol;
    } else {
      code = matchByName(item.name_en);
    }

    if (!code) continue;

    const rate = Number(item.price);
    if (isNaN(rate)) {
      continue;
    }

    if (item.unit !== "تومان") {
      continue;
    }

    results.push({ code, rate, raw: item });
  }

  return results;
}
