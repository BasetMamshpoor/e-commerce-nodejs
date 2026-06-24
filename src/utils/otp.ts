import crypto from "node:crypto";
import { env } from "../config/env";

// تولید کد عددی تصادفی امن (نه Math.random) با طول قابل‌تنظیم از env
export function generateNumericOtp(length: number = env.OTP_LENGTH): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, digits.length);
    code += digits[idx];
  }
  return code;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// شماره موبایل ایران، با یا بدون 98+ یا 0 ابتدایی
const IRAN_PHONE_REGEX = /^(?:\+98|0098|0)?9\d{9}$/;

export type IdentifierChannel = "EMAIL" | "SMS";

export function detectIdentifierChannel(identifier: string): IdentifierChannel {
  const trimmed = identifier.trim();
  if (EMAIL_REGEX.test(trimmed)) return "EMAIL";
  if (IRAN_PHONE_REGEX.test(trimmed)) return "SMS";
  throw new Error("شناسه واردشده نه ایمیل معتبر است نه شماره موبایل معتبر");
}

// نرمال‌سازی شماره موبایل به فرمت یکدست 09xxxxxxxxx برای جستجو/ذخیره یکنواخت
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0098")) return "0" + digits.slice(4);
  if (digits.startsWith("98")) return "0" + digits.slice(2);
  if (digits.startsWith("9") && digits.length === 10) return "0" + digits;
  return digits;
}

export function normalizeIdentifier(identifier: string): string {
  const channel = detectIdentifierChannel(identifier);
  if (channel === "SMS") return normalizePhone(identifier);
  return identifier.trim().toLowerCase();
}
