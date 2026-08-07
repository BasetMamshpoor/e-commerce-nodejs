// ----------------------------------------------------------------------------
// وقتی موتور چند گزینه لیست کرده («۱. ... ۲. ... ۳. ...») و مشتری فقط
// می‌گوید «۲» یا «دومی» یا «گزینه 2»، این تابع همان انتخاب را به شماره‌ی
// گزینه (۱-پایه) تبدیل می‌کند. اگر چیزی شبیه انتخاب نبود، null برمی‌گرداند
// تا caller بفهمد این پیام اصلاً پاسخ به لیست نبوده.
// ----------------------------------------------------------------------------

const PERSIAN_DIGITS: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

const ORDINAL_WORDS: Record<string, number> = {
  اول: 1,
  اولی: 1,
  یکم: 1,
  دوم: 2,
  دومی: 2,
  سوم: 3,
  سومی: 3,
  چهارم: 4,
  چهارمی: 4,
  پنجم: 5,
  پنجمی: 5,
};

function normalizeDigits(text: string): string {
  return text.replace(/[۰-۹]/g, (d) => PERSIAN_DIGITS[d] ?? d);
}

export function parseOptionSelection(rawText: string, maxIndex: number): number | null {
  const text = normalizeDigits(rawText).trim();
  if (!text) return null;

  // «۲»، «2»، «گزینه ۲»، «شماره 2» و مشابه — اولین عدد داخل متن را می‌گیریم
  const numberMatch = text.match(/\d+/);
  if (numberMatch) {
    const index = parseInt(numberMatch[0], 10);
    if (index >= 1 && index <= maxIndex) return index;
    return null;
  }

  // کلمات ترتیبی فارسی («دومی رو میخوام»)
  for (const [word, index] of Object.entries(ORDINAL_WORDS)) {
    if (text.includes(word) && index <= maxIndex) return index;
  }

  return null;
}
