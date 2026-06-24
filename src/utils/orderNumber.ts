import crypto from "node:crypto";

// شماره سفارش انسان‌خوان مثل ORD-20260624-A1B2C9 (تاریخ + ۶ کاراکتر تصادفی)
export function generateOrderNumber(): string {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);

  return `ORD-${datePart}-${randomPart}`;
}
