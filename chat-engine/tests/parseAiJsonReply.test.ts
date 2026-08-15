import { parseAiJsonReply } from "../src/engine/layer2-ai/providers/parseAiJsonReply";

describe("layer2: parseAiJsonReply", () => {
  it("JSON معتبر را درست parse می‌کند", () => {
    const result = parseAiJsonReply('{"reply": "سلام، بله موجوده", "confidence": 0.9}');
    expect(result).toEqual({ text: "سلام، بله موجوده", confidence: 0.9 });
  });

  it("اگر متن قبل/بعد از JSON اضافه داشت هم JSON را پیدا می‌کند", () => {
    const result = parseAiJsonReply('توضیح: {"reply": "باشه", "confidence": 0.5} تمام');
    expect(result.text).toBe("باشه");
    expect(result.confidence).toBe(0.5);
  });

  it("داخل ```json ... ``` را هم درست پیدا می‌کند", () => {
    const result = parseAiJsonReply('```json\n{"reply": "بله موجوده", "confidence": 0.85}\n```');
    expect(result.text).toBe("بله موجوده");
    expect(result.confidence).toBe(0.85);
  });

  it("رشته‌ای بودن حروف اضافه‌ی داخل reply مانع پیداکردن JSON نمی‌شود (رفع باگ regex حریص)", () => {
    // خودِ متن reply یک { و } دیگر هم دارد — نباید باعث بریدن اشتباه JSON شود
    const result = parseAiJsonReply('{"reply": "قیمت آن {تومان} است", "confidence": 0.7}');
    expect(result.text).toBe("قیمت آن {تومان} است");
    expect(result.confidence).toBe(0.7);
  });

  // رفع باگ اصلی: مدل‌های ضعیف‌تر/رایگان اغلب confidence را به‌جای عدد،
  // رشته برمی‌گردانند. قبلاً این باعث می‌شد confidence همیشه صفر شود و
  // مکالمه مدام به اپراتور ارجاع داده شود، حتی وقتی مدل درست جواب داده بود.
  it("confidence به‌صورت رشته‌ی عددی («0.9») را هم قبول می‌کند", () => {
    const result = parseAiJsonReply('{"reply": "بله موجوده", "confidence": "0.9"}');
    expect(result.confidence).toBe(0.9);
  });

  it("confidence به‌صورت درصد («90») را به ۰.۹ تبدیل می‌کند", () => {
    const result = parseAiJsonReply('{"reply": "بله موجوده", "confidence": 90}');
    expect(result.confidence).toBe(0.9);
  });

  it("اگر اصلاً JSON نبود، اطمینان محتاطانه (نه صفر مطلق) برمی‌گرداند", () => {
    const result = parseAiJsonReply("این یک متن ساده بدون JSON است");
    expect(result.confidence).toBeLessThan(0.55); // زیر آستانه‌ی پیش‌فرض، یعنی همچنان احتیاط می‌کند
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("اگر reply خالی بود، پیام پیش‌فرض می‌دهد", () => {
    const result = parseAiJsonReply('{"reply": "", "confidence": 0.8}');
    expect(result.text).toBe("متوجه سوال شما نشدم.");
  });

  it("مقدار خارج از بازه را clamp می‌کند، نه رد", () => {
    const result = parseAiJsonReply('{"reply": "test", "confidence": -1}');
    expect(result.confidence).toBe(0);
  });
});
