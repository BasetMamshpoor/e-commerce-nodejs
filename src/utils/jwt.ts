import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

// ----------------------------------------------------------------------------
// توکن دسترسی (access) کوتاه‌عمر و فقط برای احراز هویت درخواست‌هاست.
// توکن تازه‌سازی (refresh) عمر بلندتری دارد و معادل هش‌شده‌اش در جدول
// UserSession ذخیره می‌شود تا قابل ابطال (revoke) باشد.
//
// claim "sid" = شناسه‌ی UserSession، برای این‌که بتوانیم یک نشست خاص را
// در لحظه باطل کنیم (logout / logout-all / بلاک‌شدن کاربر) بدون این‌که منتظر
// انقضای توکن بمانیم.
// ----------------------------------------------------------------------------

export type TokenType = "access" | "refresh";

export interface AccessTokenPayload extends JwtPayload {
  sub: string; // userId
  role: string;
  sid: string; // sessionId
  type: "access";
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string; // userId
  sid: string; // sessionId
  type: "refresh";
}

export function signAccessToken(payload: {
  userId: string;
  role: string;
  sessionId: string;
}): string {
  const body: AccessTokenPayload = {
    sub: payload.userId,
    role: payload.role,
    sid: payload.sessionId,
    type: "access",
  };
  return jwt.sign(body, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
}

export function signRefreshToken(payload: {
  userId: string;
  sessionId: string;
}): string {
  const body: RefreshTokenPayload = {
    sub: payload.userId,
    sid: payload.sessionId,
    type: "refresh",
  };
  return jwt.sign(body, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
