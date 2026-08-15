import { AiAnswerResult } from "../ai.types";

// ----------------------------------------------------------------------------
// به مدل دستور می‌دهیم فقط یک JSON با شکل {"reply": "...", "confidence": 0..1}
// برگرداند. مدل‌های ضعیف‌تر/رایگان اغلب دقیقاً همین قالب را رعایت نمی‌کنند:
// داخل ```json ... ``` می‌پیچند، قبل/بعدش توضیح اضافه می‌کنند، یا confidence
// را به‌جای عدد، رشته («0.9») برمی‌گردانند. نسخه‌ی قبلی این تابع با
// `typeof === "number"` این حالت رشته‌ای را رد می‌کرد و همیشه confidence
// را صفر می‌گذاشت — یعنی مدل داشت درست جواب می‌داد ولی موتور فکر می‌کرد
// مطمئن نیست و مدام به اپراتور ارجاع می‌داد. این نسخه هرچه ممکن است را
// قبول می‌کند و فقط در نبود کامل هر اطلاعاتی، محتاطانه (نه صفر مطلق) عمل
// می‌کند.
// ----------------------------------------------------------------------------

const FALLBACK_TEXT = "متوجه سوال شما نشدم.";
// وقتی واقعاً هیچ عدد قابل استخراجی نیست — عمداً «صفر مطلق» نیست تا یک
// جواب درستِ بدون فرمت درست، بی‌دلیل و همیشه escalate نشود
const UNPARSEABLE_CONFIDENCE_FALLBACK = 0.4;

export function parseAiJsonReply(rawText: string): AiAnswerResult {
  const jsonText = extractJsonObject(rawText);
  if (!jsonText) {
    return { text: rawText.trim() || FALLBACK_TEXT, confidence: UNPARSEABLE_CONFIDENCE_FALLBACK };
  }

  try {
    const parsed = JSON.parse(jsonText) as { reply?: unknown; confidence?: unknown };
    const text = typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : FALLBACK_TEXT;
    const confidence = coerceConfidence(parsed.confidence);
    return { text, confidence };
  } catch {
    return { text: rawText.trim() || FALLBACK_TEXT, confidence: UNPARSEABLE_CONFIDENCE_FALLBACK };
  }
}

// عدد، رشته‌ی عددی («0.9»)، یا حتی درصد («90%» / «90») را قبول می‌کند —
// فقط اگر واقعاً هیچ‌کدام نبود fallback محتاطانه برمی‌گرداند
function coerceConfidence(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp01(value > 1 ? value / 100 : value);
  }
  if (typeof value === "string") {
    const cleaned = value.trim().replace("%", "");
    const num = Number(cleaned);
    if (Number.isFinite(num)) {
      return clamp01(num > 1 ? num / 100 : num);
    }
  }
  return UNPARSEABLE_CONFIDENCE_FALLBACK;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

// به‌جای یک regex حریص (که با هر } دیگری داخل خودِ متن پاسخ اشتباه می‌گیرد)،
// اولین { را پیدا می‌کند و با شمارش عمق (و نادیده‌گرفتن } های داخل رشته)
// دقیقاً همان بلوک JSON متعادل را استخراج می‌کند — همچنین ```json ... ```
// را هم قبلش پاک می‌کند.
function extractJsonObject(rawText: string): string | null {
  const withoutFences = rawText.replace(/```json|```/gi, "");

  const start = withoutFences.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < withoutFences.length; i++) {
    const ch = withoutFences[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return withoutFences.slice(start, i + 1);
      }
    }
  }

  return null;
}
