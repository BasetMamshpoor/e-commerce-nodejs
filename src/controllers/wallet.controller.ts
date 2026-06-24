import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { paramStr } from "../utils/params";
import * as walletService from "../services/wallet/wallet.service";

function userId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

export async function overview(req: Request, res: Response) {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const result = await walletService.getWalletOverview(
    userId(req),
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined
  );
  return ApiResponse.ok(res, result);
}

export async function chargeInitiate(req: Request, res: Response) {
  const result = await walletService.initiateWalletCharge(
    userId(req),
    req.body.amount,
    req.body.gatewaySlug
  );
  return ApiResponse.ok(res, result, "به درگاه پرداخت منتقل می‌شوید");
}

export async function chargeVerify(req: Request, res: Response) {
  const result = await walletService.verifyWalletCharge(
    userId(req),
    paramStr(req.params.transactionId),
    req.body.providerParams ?? {}
  );
  return ApiResponse.ok(res, result, "کیف پول با موفقیت شارژ شد");
}
