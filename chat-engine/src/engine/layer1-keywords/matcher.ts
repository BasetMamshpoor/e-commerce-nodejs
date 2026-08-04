import { INTENT_PRIORITY, KEYWORD_MAP, KeywordIntent } from "./keywords.config";

// متنی که مشتری فرستاده را با کلمات رزرو شده مقایسه می‌کند و لیست intent
// های مچ‌شده را برمی‌گرداند (به ترتیب اولویت، پرکاربردترین اول).
export function matchIntents(text: string): KeywordIntent[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const matched = new Set<KeywordIntent>();
  for (const [intent, keywords] of Object.entries(KEYWORD_MAP) as [KeywordIntent, string[]][]) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      matched.add(intent);
    }
  }

  return INTENT_PRIORITY.filter((intent) => matched.has(intent));
}
