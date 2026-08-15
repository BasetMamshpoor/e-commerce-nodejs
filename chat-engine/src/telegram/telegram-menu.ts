import { TelegramReplyKeyboard } from "./telegram-client.service";

// ----------------------------------------------------------------------------
// منوی دکمه‌های سریع تلگرام. وقتی کاربر روی یکی از این دکمه‌ها می‌زند،
// تلگرام دقیقاً همان متن دکمه را به‌عنوان یک پیام معمولی برای ما می‌فرستد؛
// ما آن متن را با یک عبارت محرک معادل جایگزین می‌کنیم و از همان pipeline
// معمولی (لایه ۱) رد می‌کنیم — یعنی هیچ مسیر جداگانه‌ای لازم نیست، رفتار
// (ازجمله حافظه‌ی مکالمه/pendingAction) دقیقاً همان چیزی می‌شود که برای یک
// پیام تایپ‌شده‌ی معمولی اتفاق می‌افتاد.
// ----------------------------------------------------------------------------

export const TELEGRAM_MENU_LABELS = {
  SEARCH_PRODUCT: "🔍 جستجوی محصول",
  CHECK_STOCK: "📦 بررسی موجودی",
  PRICE_INQUIRY: "💰 استعلام قیمت",
  CONTACT_SUPPORT: "☎️ تماس با پشتیبانی",
} as const;

export const TELEGRAM_REPLY_KEYBOARD: TelegramReplyKeyboard = {
  keyboard: [
    [{ text: TELEGRAM_MENU_LABELS.SEARCH_PRODUCT }, { text: TELEGRAM_MENU_LABELS.CHECK_STOCK }],
    [{ text: TELEGRAM_MENU_LABELS.PRICE_INQUIRY }, { text: TELEGRAM_MENU_LABELS.CONTACT_SUPPORT }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

const BUTTON_TO_TRIGGER_TEXT: Record<string, string> = {
  // باید هم intent INFO را trigger کند (کلمه‌ی کلیدی «جستجوی محصول» را در
  // خودش دارد) و هم بعد از فیلتر stopword به nameTerms خالی برسد — همین دو
  // کلمه‌ی تنها هر دو شرط را برآورده می‌کند
  [TELEGRAM_MENU_LABELS.SEARCH_PRODUCT]: "جستجوی محصول",
  [TELEGRAM_MENU_LABELS.CHECK_STOCK]: "این موجوده؟",
  [TELEGRAM_MENU_LABELS.PRICE_INQUIRY]: "قیمتش چنده؟",
  [TELEGRAM_MENU_LABELS.CONTACT_SUPPORT]: "میخوام با پشتیبانی صحبت کنم",
};

// اگر متن پیام دقیقاً یکی از دکمه‌های منو بود، عبارت محرک معادلش را
// برمی‌گرداند؛ وگرنه null (یعنی یک پیام معمولی است)
export function resolveMenuButtonTriggerText(rawText: string): string | null {
  return BUTTON_TO_TRIGGER_TEXT[rawText.trim()] ?? null;
}

export const WELCOME_MESSAGE =
  "سلام 👋 به ربات پشتیبانی خوش اومدید!\nمی‌تونید هر سوالی درباره‌ی محصولات دارید بپرسید، یا از منوی زیر یکی از گزینه‌های سریع رو انتخاب کنید.";
