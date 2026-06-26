import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as profileService from "../services/user/profile.service";

function userId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

export async function getMe(req: Request, res: Response) {
  return ApiResponse.ok(res, await profileService.getMyProfile(userId(req)));
}

export async function updateMe(req: Request, res: Response) {
  const user = await profileService.updateMyProfile(userId(req), req.body);
  return ApiResponse.ok(res, user, "پروفایل به‌روزرسانی شد");
}

export async function setAvatar(req: Request, res: Response) {
  const user = await profileService.setMyAvatar(userId(req), req.body.mediaId);
  return ApiResponse.ok(res, user, "تصویر پروفایل به‌روزرسانی شد");
}

export async function changePassword(req: Request, res: Response) {
  if (!req.sessionId) throw ApiError.unauthorized();
  await profileService.changeMyPassword(userId(req), req.sessionId, req.body);
  return ApiResponse.ok(res, null, "رمز عبور با موفقیت تغییر کرد");
}

export async function requestChangeIdentifier(req: Request, res: Response) {
  const result = await profileService.requestChangeIdentifier(userId(req), req.body.newIdentifier);
  return ApiResponse.ok(res, result, "کد تایید برای شناسه‌ی جدید ارسال شد");
}

export async function verifyChangeIdentifier(req: Request, res: Response) {
  const user = await profileService.verifyChangeIdentifier(
    userId(req),
    req.body.newIdentifier,
    req.body.code
  );
  return ApiResponse.ok(res, user, "شناسه‌ی حساب با موفقیت تغییر کرد");
}
