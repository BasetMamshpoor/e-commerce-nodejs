import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import * as blockedIpService from "../services/security/blocked-ip.service";

export async function block(req: Request, res: Response) {
  return ApiResponse.created(res, await blockedIpService.blockIp(req.body), "آی‌پی مسدود شد");
}

export async function unblock(req: Request, res: Response) {
  await blockedIpService.unblockIp(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "مسدودیت این آی‌پی برداشته شد");
}

export async function list(_req: Request, res: Response) {
  return ApiResponse.ok(res, await blockedIpService.listBlockedIps());
}
