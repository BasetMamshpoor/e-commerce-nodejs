import { COLOR_WORDS, LETTER_SIZE_WORDS } from "../shared/vocabulary";
import { extractSearchTerms } from "./productSearch";

// ----------------------------------------------------------------------------
// «کفش مجلسی قهوه‌ای سایز ۴۲» باید به این تبدیل شود:
//   nameTerms: ["کفش", "مجلسی"]
//   color: "قهوه‌ای"
//   size: "42"
// این خروجی مستقیم به یک کوئری SQL می‌رود که هم روی نام محصول جست‌وجو
// می‌کند و هم بین تنوع‌ها (variants) دنبال رنگ/سایز دقیق می‌گردد — نه فقط
// یک جست‌وجوی متنی ساده روی نام محصول.
// ----------------------------------------------------------------------------

export interface ParsedProductQuery {
  nameTerms: string[];
  color?: string;
  size?: string;
}

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

function normalizeDigits(text: string): string {
  return text.replace(/[۰-۹]/g, (d) => PERSIAN_DIGITS[d] ?? d);
}

export function parseProductQuery(rawText: string): ParsedProductQuery {
  let working = normalizeDigits(rawText);

  // ۱) رنگ — اولین کلمه‌ی رنگ شناخته‌شده‌ای که در جمله پیدا شود
  let color: string | undefined;
  for (const c of COLOR_WORDS) {
    if (working.includes(c)) {
      color = c;
      working = working.split(c).join(" ");
      break;
    }
  }

  // ۲) سایز حرفی (XL, L, M, ...) — قبل از عددی چک می‌شود
  let size: string | undefined;
  for (const s of LETTER_SIZE_WORDS) {
    const pattern = new RegExp(`(?<![a-zA-Z])${s}(?![a-zA-Z])`, "i");
    if (pattern.test(working)) {
      size = s;
      working = working.replace(pattern, " ");
      break;
    }
  }

  // ۳) سایز عددی — یا صریح («سایز ۴۲»/«سایز 42») یا یک عدد ۲ رقمی تنها در
  // جمله (بیشتر سایزهای کفش/لباس بین ۳۰ تا ۵۰ هستند)
  if (!size) {
    const explicit = working.match(/سایز\s*(\d{1,3})/);
    if (explicit) {
      size = explicit[1];
      working = working.replace(explicit[0], " ");
    } else {
      const bareNumber = working.match(/\b(\d{2})\b/);
      if (bareNumber && Number(bareNumber[1]) >= 30 && Number(bareNumber[1]) <= 50) {
        size = bareNumber[1];
        working = working.replace(bareNumber[0], " ");
      }
    }
  }

  const nameTerms = extractSearchTerms(working);

  return { nameTerms, color, size };
}
