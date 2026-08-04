import { matchIntents } from "../src/engine/layer1-keywords/matcher";

describe("layer1: matchIntents", () => {
  it("وقتی هیچ کلمه‌ی رزرو شده‌ای نیست، آرایه‌ی خالی برمی‌گرداند", () => {
    expect(matchIntents("سلام خوبی؟")).toEqual([]);
  });

  it("intent قیمت را تشخیص می‌دهد", () => {
    expect(matchIntents("این چند تومان قیمتش هست؟")).toContain("PRICE");
  });

  it("intent رنگ را از روی نام رنگ هم تشخیص می‌دهد", () => {
    expect(matchIntents("مشکی داره؟")).toContain("COLOR");
  });

  it("intent موجودی را تشخیص می‌دهد", () => {
    expect(matchIntents("این محصول رو دارید؟")).toContain("STOCK");
  });

  it("وقتی چند intent هم‌زمان مچ شود، به ترتیب اولویت برمی‌گرداند (قیمت قبل از رنگ)", () => {
    const intents = matchIntents("قیمت رنگ آبی چنده؟");
    expect(intents[0]).toBe("PRICE");
    expect(intents).toContain("COLOR");
  });

  it("intent نحوه‌ی سفارش را تشخیص می‌دهد", () => {
    expect(matchIntents("چطور سفارش بدم؟")).toContain("HOW_TO_ORDER");
  });

  it("intent ارسال را تشخیص می‌دهد", () => {
    expect(matchIntents("هزینه ارسال چقدره؟")).toEqual(
      expect.arrayContaining(["PRICE", "SHIPPING"])
    );
  });
});
