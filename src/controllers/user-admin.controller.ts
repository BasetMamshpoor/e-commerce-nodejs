import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import * as userAdminService from "../services/user/user-admin.service";

export async function list(req: Request, res: Response) {
  return ApiResponse.ok(res, await userAdminService.listUsersAdmin(req.validatedQuery as never));
}

export async function getById(req: Request, res: Response) {
  return ApiResponse.ok(res, await userAdminService.getUserDetailAdmin(paramStr(req.params.id)));
}

export async function block(req: Request, res: Response) {
  const user = await userAdminService.blockUser(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, user, "کاربر مسدود شد و از همه‌ی دستگاه‌ها خارج شد");
}

export async function unblock(req: Request, res: Response) {
  const user = await userAdminService.unblockUser(paramStr(req.params.id));
  return ApiResponse.ok(res, user, "مسدودیت کاربر برداشته شد");
}

export async function updateRole(req: Request, res: Response) {
  const user = await userAdminService.updateUserRole(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, user, "نقش کاربر تغییر کرد");
}

export async function listSessions(req: Request, res: Response) {
  return ApiResponse.ok(res, await userAdminService.listUserSessions(paramStr(req.params.id)));
}

export async function revokeSession(req: Request, res: Response) {
  await userAdminService.revokeUserSessionAdmin(
    paramStr(req.params.id),
    paramStr(req.params.sessionId)
  );
  return ApiResponse.ok(res, null, "نشست باطل شد");
}

export async function revokeAllSessions(req: Request, res: Response) {
  await userAdminService.revokeAllUserSessionsAdmin(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "همه‌ی نشست‌های این کاربر باطل شد");
}
