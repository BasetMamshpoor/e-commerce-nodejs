import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { paramInt } from "../utils/params";
import * as walletService from "../services/wallet/wallet.service";
import * as withdrawalService from "../services/wallet/wallet-withdrawal.service";

function userId(req: Request): number {
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
    paramInt(req.params.transactionId),
    req.body.providerParams ?? {}
  );
  return ApiResponse.ok(res, result, "کیف پول با موفقیت شارژ شد");
}

export async function requestWithdrawal(req: Request, res: Response) {
  const withdrawal = await withdrawalService.requestWithdrawal(userId(req), req.body.amount, req.body.description);
  return ApiResponse.created(res, withdrawal, "درخواست برداشت ثبت شد و در انتظار بررسی است");
}

export async function listMyWithdrawals(req: Request, res: Response) {
  const { page, limit } = req.query as { page?: string; limit?: string };
  const result = await withdrawalService.listMyWithdrawals(userId(req), page ? Number(page) : undefined, limit ? Number(limit) : undefined);
  return ApiResponse.ok(res, result);
}

export async function listWithdrawalsAdmin(req: Request, res: Response) {
  const { page, limit, status, userId: uid } = req.query as { page?: string; limit?: string; status?: string; userId?: string };
  const result = await withdrawalService.listWithdrawalsAdmin({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    status,
    userId: uid ? Number(uid) : undefined,
  });
  return ApiResponse.ok(res, result);
}

export async function reviewWithdrawalAdmin(req: Request, res: Response) {
  const result = await withdrawalService.reviewWithdrawalAdmin(paramInt(req.params.id), req.body.status, req.body.adminNote);
  return ApiResponse.ok(res, result, "درخواست برداشت بررسی شد");
}
