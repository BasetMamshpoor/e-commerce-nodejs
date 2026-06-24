import { generateOrderNumber } from "../src/utils/orderNumber";

describe("utils/orderNumber generateOrderNumber", () => {
  it("فرمت ORD-YYYYMMDD-XXXXXX را رعایت می‌کند", () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber).toMatch(/^ORD-\d{8}-[A-F0-9]{6}$/);
  });

  it("هر بار یک مقدار متفاوت می‌سازد", () => {
    const a = generateOrderNumber();
    const b = generateOrderNumber();
    expect(a).not.toBe(b);
  });
});
