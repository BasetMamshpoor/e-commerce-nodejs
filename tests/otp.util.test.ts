import {
  generateNumericOtp,
  detectIdentifierChannel,
  normalizePhone,
  normalizeIdentifier,
} from "../src/utils/otp";

describe("utils/otp", () => {
  it("generateNumericOtp یک کد عددی با طول مشخص می‌سازد", () => {
    const code = generateNumericOtp(5);
    expect(code).toHaveLength(5);
    expect(/^\d+$/.test(code)).toBe(true);
  });

  it("detectIdentifierChannel ایمیل را به‌درستی تشخیص می‌دهد", () => {
    expect(detectIdentifierChannel("test@example.com")).toBe("EMAIL");
  });

  it("detectIdentifierChannel شماره موبایل ایران را به‌درستی تشخیص می‌دهد", () => {
    expect(detectIdentifierChannel("09123456789")).toBe("SMS");
    expect(detectIdentifierChannel("+989123456789")).toBe("SMS");
  });

  it("detectIdentifierChannel برای ورودی نامعتبر خطا می‌دهد", () => {
    expect(() => detectIdentifierChannel("not-valid")).toThrow();
  });

  it("normalizePhone همه‌ی فرمت‌های مختلف را یکدست می‌کند", () => {
    expect(normalizePhone("+989123456789")).toBe("09123456789");
    expect(normalizePhone("00989123456789")).toBe("09123456789");
    expect(normalizePhone("9123456789")).toBe("09123456789");
    expect(normalizePhone("09123456789")).toBe("09123456789");
  });

  it("normalizeIdentifier ایمیل را lowercase و trim می‌کند", () => {
    expect(normalizeIdentifier("  Test@Example.com ")).toBe("test@example.com");
  });
});
