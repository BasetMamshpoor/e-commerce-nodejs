import { Request } from "express";
import crypto from "node:crypto";

// ----------------------------------------------------------------------------
// یک توکن مهمان مشترک (هدر X-Guest-Token) هم برای سبد خرید و هم برای لیست
// مقایسه‌ی محصولات استفاده می‌شود تا فرانت‌اند فقط یک شناسه برای کل نشست
// مهمان مدیریت کند. اگر هدر نباشد، یک UUID تازه می‌سازیم.
// ----------------------------------------------------------------------------

export function getOrAssignGuestToken(req: Request): { token: string; isNew: boolean } {
  const header = req.headers["x-guest-token"];
  if (typeof header === "string" && header.length > 0) {
    return { token: header, isNew: false };
  }
  return { token: crypto.randomUUID(), isNew: true };
}
