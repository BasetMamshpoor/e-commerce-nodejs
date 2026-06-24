import { Request } from "express";
import { getOrAssignGuestToken } from "./guestToken";

// مقایسه‌ی چند محصول با هم — آیتم ۶ (هم برای مهمان هم کاربر عضو)
export type ComparisonIdentity = { userId: string } | { sessionToken: string };

export function resolveComparisonIdentity(req: Request): {
  identity: ComparisonIdentity;
  guestToken?: string;
} {
  if (req.user) {
    return { identity: { userId: req.user.id } };
  }

  const { token, isNew } = getOrAssignGuestToken(req);
  return { identity: { sessionToken: token }, guestToken: isNew ? token : undefined };
}
