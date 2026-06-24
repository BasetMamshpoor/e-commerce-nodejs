import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as authService from "../services/auth/auth.service";
import { DeviceMeta } from "../services/auth/session.service";

// ----------------------------------------------------------------------------
// نکته: همه‌ی هندلرها async هستند و هیچ try/catch ندارند — در Express 5 اگر
// Promise برگشتی reject شود، خودِ روتر خطا را به errorHandler می‌فرستد.
// ----------------------------------------------------------------------------

function getDevice(req: Request): DeviceMeta {
  return {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    deviceName: typeof req.body?.deviceName === "string" ? req.body.deviceName : undefined,
  };
}

export async function register(req: Request, res: Response) {
  const result = await authService.register(req.body);
  return ApiResponse.created(
    res,
    result,
    "ثبت‌نام انجام شد. کد تایید برای شما ارسال شد"
  );
}

export async function verifyRegisterOtp(req: Request, res: Response) {
  const { identifier, code } = req.body;
  const { user, tokens } = await authService.verifyRegisterOtp(
    identifier,
    code,
    getDevice(req)
  );
  return ApiResponse.ok(res, { user, ...tokens }, "ثبت‌نام با موفقیت تکمیل شد");
}

export async function login(req: Request, res: Response) {
  const { identifier, password } = req.body;
  const { user, tokens } = await authService.login({
    identifier,
    password,
    device: getDevice(req),
  });
  return ApiResponse.ok(res, { user, ...tokens }, "ورود موفقیت‌آمیز بود");
}

export async function requestLoginOtp(req: Request, res: Response) {
  const result = await authService.requestLoginOtp(req.body.identifier);
  return ApiResponse.ok(res, result, "کد ورود برای شما ارسال شد");
}

export async function verifyLoginOtp(req: Request, res: Response) {
  const { identifier, code } = req.body;
  const { user, tokens } = await authService.verifyLoginOtp(
    identifier,
    code,
    getDevice(req)
  );
  return ApiResponse.ok(res, { user, ...tokens }, "ورود موفقیت‌آمیز بود");
}

export async function refreshToken(req: Request, res: Response) {
  const tokens = await authService.refreshTokens(req.body.refreshToken);
  return ApiResponse.ok(res, tokens, "توکن تازه‌سازی شد");
}

export async function logout(req: Request, res: Response) {
  if (!req.sessionId) throw ApiError.unauthorized();
  await authService.logout(req.sessionId);
  return ApiResponse.ok(res, null, "خروج با موفقیت انجام شد");
}

export async function logoutAll(req: Request, res: Response) {
  if (!req.user || !req.sessionId) throw ApiError.unauthorized();
  await authService.logoutAllDevices(req.user.id, req.sessionId);
  return ApiResponse.ok(res, null, "از تمام دستگاه‌های دیگر خارج شدید");
}

export async function forgotPassword(req: Request, res: Response) {
  const result = await authService.forgotPassword(req.body.identifier);
  return ApiResponse.ok(res, result, "در صورت وجود حساب، کد بازیابی ارسال شد");
}

export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(req.body);
  return ApiResponse.ok(res, null, "رمز عبور با موفقیت تغییر کرد، دوباره وارد شوید");
}
