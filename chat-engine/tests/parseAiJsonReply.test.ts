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

  it("اگر اصلاً JSON نبود، با اطمینان صفر برمی‌گرداند (برای ارجاع ایمن به اپراتور)", () => {
    const result = parseAiJsonReply("این یک متن ساده بدون JSON است");
    expect(result.confidence).toBe(0);
  });

  it("اگر confidence خارج از بازه‌ی ۰ تا ۱ بود، صفر در نظر می‌گیرد", () => {
    const result = parseAiJsonReply('{"reply": "test", "confidence": 5}');
    expect(result.confidence).toBe(0);
  });

  it("اگر reply خالی بود، پیام پیش‌فرض می‌دهد", () => {
    const result = parseAiJsonReply('{"reply": "", "confidence": 0.8}');
    expect(result.text).toBe("متوجه سوال شما نشدم.");
  });
});
