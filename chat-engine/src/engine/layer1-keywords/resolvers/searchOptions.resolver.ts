import { ProductSearchResult } from "../../productMatcher/types";
import { formatToman } from "../../../utils/pricing";

// وقتی مشتری کد محصول را نفرستاده و جست‌وجوی متنی چند گزینه‌ی نزدیک پیدا کرده —
// از او می‌خواهیم خودش انتخاب کند (نه این‌که یک حدس قطعی به او بدهیم).
export function buildSearchOptionsReply(results: ProductSearchResult[]): string {
  const lines = results.map((r, i) => {
    const price = r.minPrice === r.maxPrice ? formatToman(r.minPrice) : `از ${formatToman(r.minPrice)}`;
    const stock = r.isInStock ? "" : " (ناموجود)";
    const code = r.shortCode ? ` — کد: ${r.shortCode}` : "";
    return `${i + 1}. ${r.name} — ${price}${stock}${code}`;
  });

  return [
    "چند محصول نزدیک به سوال شما پیدا کردم، کدومش مدنظرتونه؟",
    ...lines,
    "می‌تونید کد محصول رو بفرستید یا فقط شماره‌ی گزینه رو بگید.",
  ].join("\n");
}

export function buildAskForCodeReply(): string {
  return "متوجه نشدم دقیقاً درباره‌ی کدوم محصول می‌پرسید 🙏 میشه کد محصول (زیر بیوگرافی/کپشن پست) رو برام بفرستید یا پست مربوطه رو فوروارد کنید؟";
}
