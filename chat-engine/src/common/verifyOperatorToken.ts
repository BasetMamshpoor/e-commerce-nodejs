import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

// ----------------------------------------------------------------------------
// اپراتورهای پشتیبانی همان کاربرهای ADMIN/EDITOR/SUPPORT سایت اصلی هستند.
// چون این سرویس دیتابیس مجزا دارد، لاگین جداگانه نمی‌سازیم؛ همان access
// token ای که پنل ادمین سایت اصلی صادر می‌کند (با JWT_ACCESS_SECRET مشترک)
// اینجا هم verify می‌شود — هم برای درخواست‌های HTTP (guard) و هم برای
// اتصال Socket.io پنل اپراتور (gateway).
//
// محدودیت فعلی: بر خلاف بک‌اند اصلی، نشست (UserSession) را چک نمی‌کنیم؛
// یعنی logout سایت اصلی بلافاصله این توکن را باطل نمی‌کند.
// ----------------------------------------------------------------------------

const OPERATOR_ROLES = new Set(["ADMIN", "EDITOR", "SUPPORT"]);

export interface OperatorPrincipal {
  userId: number;
  role: string;
}

export function verifyOperatorToken(token: string | undefined | null): OperatorPrincipal {
  if (!token) {
    throw ApiError.unauthorized();
  }

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  } catch {
    throw ApiError.unauthorized("توکن نامعتبر یا منقضی شده است");
  }

  const role = String(payload.role ?? "");
  if (!OPERATOR_ROLES.has(role)) {
    throw ApiError.forbidden("فقط اپراتورهای پشتیبانی به این بخش دسترسی دارند");
  }

  return { userId: Number(payload.sub), role };
}
