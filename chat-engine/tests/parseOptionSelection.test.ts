import { parseOptionSelection } from "../src/engine/layer1-keywords/parseOptionSelection";

describe("parseOptionSelection", () => {
  it("عدد لاتین ساده را می‌فهمد", () => {
    expect(parseOptionSelection("2", 3)).toBe(2);
  });

  it("عدد فارسی را می‌فهمد", () => {
    expect(parseOptionSelection("۲", 3)).toBe(2);
  });

  it("عدد داخل جمله را هم پیدا می‌کند", () => {
    expect(parseOptionSelection("گزینه ۳ رو میخوام", 3)).toBe(3);
  });

  it("کلمات ترتیبی فارسی را می‌فهمد", () => {
    expect(parseOptionSelection("دومی", 3)).toBe(2);
    expect(parseOptionSelection("اولی رو بده", 3)).toBe(1);
  });

  it("اگر عدد از بازه‌ی گزینه‌ها بیشتر بود null برمی‌گرداند", () => {
    expect(parseOptionSelection("5", 3)).toBeNull();
  });

  it("برای متن بی‌ربط null برمی‌گرداند", () => {
    expect(parseOptionSelection("سلام خوبی؟", 3)).toBeNull();
  });

  it("برای متن خالی null برمی‌گرداند", () => {
    expect(parseOptionSelection("", 3)).toBeNull();
  });
});
