import { KeywordIntent } from "../keywords.config";

// پاسخ‌های ثابت برای intent هایی که به یک محصول خاص وابسته نیستند.
// (بعداً می‌توان این متن‌ها را به مدل Setting دیتابیس اصلی وصل کرد تا از
// پنل ادمین قابل ویرایش باشند)
const GENERIC_REPLIES: Partial<Record<KeywordIntent, string>> = {
  HOW_TO_ORDER:
    "برای ثبت سفارش کافیه محصول مدنظرتون رو به سبد خرید اضافه کنید و در مراحل بعدی آدرس و روش پرداخت رو انتخاب کنید. اگه بخواید همینجا هم می‌تونم راهنماییتون کنم — کد محصول یا نام محصول رو بفرستید.",
  SHIPPING:
    "هزینه و زمان ارسال بسته به شهر شما و شرکت پستی انتخابی متفاوته و موقع نهایی‌کردن سفارش دقیق نمایش داده می‌شه. اگه شهرتون رو بگید می‌تونم دقیق‌تر راهنمایی کنم.",
};

export function resolveGenericIntent(intent: KeywordIntent): string | null {
  return GENERIC_REPLIES[intent] ?? null;
}
