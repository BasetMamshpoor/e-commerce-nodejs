import { AiAnswerResult } from "../ai.types";

// ----------------------------------------------------------------------------
// به مدل دستور می‌دهیم فقط یک JSON با شکل {"reply": "...", "confidence": 0..1}
// برگرداند. اگر به هر دلیلی parse نشد (مدل قالب را رعایت نکرد)، برای ایمنی
// آن را با اطمینان خیلی پایین در نظر می‌گیریم تا مکالمه به اپراتور ارجاع شود
// نه این‌که یک متن خام و بدون بررسی به مشتری نشان داده شود.
// ----------------------------------------------------------------------------

export function parseAiJsonReply(rawText: string): AiAnswerResult {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { text: rawText.trim() || "متوجه سوال شما نشدم.", confidence: 0 };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as { reply?: unknown; confidence?: unknown };
    const text = typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : "متوجه سوال شما نشدم.";
    const confidence =
      typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
        ? parsed.confidence
        : 0;
    return { text, confidence };
  } catch {
    return { text: rawText.trim() || "متوجه سوال شما نشدم.", confidence: 0 };
  }
}
