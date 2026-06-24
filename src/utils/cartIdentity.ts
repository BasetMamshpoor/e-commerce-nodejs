import { Request } from "express";
import { getOrAssignGuestToken } from "./guestToken";

// ----------------------------------------------------------------------------
// سبد خرید مهمان (بدون احراز هویت) + سبد خرید کاربر عضو — آیتم ۷
//
// نحوه‌ی کار سبد خرید مهمان:
// فرانت‌اند یک هدر "X-Guest-Token" می‌فرستد (یک UUID که خودش نگه می‌دارد،
// مثلاً در localStorage). اگر این هدر را نفرستد، ما یک توکن جدید می‌سازیم و
// آن را در پاسخ (data.guestToken) برمی‌گردانیم؛ فرانت باید آن را ذخیره کند و
// در درخواست‌های بعدی همان هدر را بفرستد.
//
// وقتی کاربر بعداً وارد حساب می‌شود، با POST /cart/merge و فرستادن همان
// guestToken، سبد مهمان با سبد کاربر ادغام می‌شود.
// ----------------------------------------------------------------------------

export type CartIdentity = { userId: string } | { guestToken: string };

export function resolveCartIdentity(req: Request): {
  identity: CartIdentity;
  guestToken?: string; // اگر مهمان است و این مقدار ست شده، یعنی توکن تازه ساخته شده
} {
  if (req.user) {
    return { identity: { userId: req.user.id } };
  }

  const { token, isNew } = getOrAssignGuestToken(req);
  return { identity: { guestToken: token }, guestToken: isNew ? token : undefined };
}
