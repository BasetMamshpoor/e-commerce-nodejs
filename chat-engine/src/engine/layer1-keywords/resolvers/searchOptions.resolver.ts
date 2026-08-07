import { ProductSearchResult } from "../../productMatcher/types";
import { formatToman } from "../../../utils/pricing";
import { Channel } from "../../../models/customer.model";

// ----------------------------------------------------------------------------
// وقتی مشتری کد محصول را نفرستاده و جست‌وجوی متنی چند گزینه‌ی نزدیک پیدا کرده —
// از او می‌خواهیم خودش انتخاب کند (نه این‌که یک حدس قطعی به او بدهیم).
//
// نکته‌ی مهم: متن پیام بسته به کانال فرق می‌کند. در اینستاگرام/واتساپ/بله
// مفهوم «کد زیر بیوگرافی» یا «فوروارد کردن پست» معنا دارد؛ در ویجت چت
// سایت این مفاهیم اصلاً وجود ندارند (مشتری دارد مستقیم از توی سایت
// می‌پرسد) — پس آنجا فقط از نام محصول/انتخاب از لیست حرف می‌زنیم.
// ----------------------------------------------------------------------------

export function buildSearchOptionsReply(channel: Channel, results: ProductSearchResult[]): string {
  const lines = results.map((r, i) => {
    const price = r.minPrice === r.maxPrice ? formatToman(r.minPrice) : `از ${formatToman(r.minPrice)}`;
    const stock = r.isInStock ? "" : " (ناموجود)";
    const code = channel !== "WEBSITE" && r.shortCode ? ` — کد: ${r.shortCode}` : "";
    return `${i + 1}. ${r.name} — ${price}${stock}${code}`;
  });

  const trailing =
    channel === "WEBSITE"
      ? "فقط شماره‌ی گزینه‌ای که مدنظرتونه رو بگید تا دقیق‌تر راهنماییتون کنم."
      : "می‌تونید کد محصول رو بفرستید یا فقط شماره‌ی گزینه رو بگید.";

  return ["چند محصول نزدیک به سوال شما پیدا کردم، کدومش مدنظرتونه؟", ...lines, trailing].join("\n");
}

export function buildAskForCodeReply(channel: Channel): string {
  if (channel === "WEBSITE") {
    return "متوجه نشدم دقیقاً دنبال کدوم محصول می‌گردید 🙏 میشه اسم محصول رو کامل‌تر بنویسید؟";
  }

  return "متوجه نشدم دقیقاً درباره‌ی کدوم محصول می‌پرسید 🙏 میشه کد محصول (زیر بیوگرافی/کپشن پست) رو برام بفرستید یا پست مربوطه رو فوروارد کنید؟";
}
