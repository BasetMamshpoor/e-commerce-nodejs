import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import { resolveComparisonIdentity } from "../utils/comparisonIdentity";
import * as comparisonService from "../services/shopping/comparison.service";

function withGuestToken<T extends Record<string, unknown>>(
  data: T,
  guestToken: string | undefined
) {
  return guestToken ? { ...data, guestToken } : data;
}

export async function get(req: Request, res: Response) {
  const { identity, guestToken } = resolveComparisonIdentity(req);
  const comparison = await comparisonService.getComparison(identity);
  return ApiResponse.ok(res, withGuestToken({ comparison }, guestToken));
}

export async function add(req: Request, res: Response) {
  const { identity, guestToken } = resolveComparisonIdentity(req);
  const comparison = await comparisonService.addToComparison(identity, req.body.productId);
  return ApiResponse.created(res, withGuestToken({ comparison }, guestToken), "محصول به لیست مقایسه اضافه شد");
}

export async function remove(req: Request, res: Response) {
  const { identity, guestToken } = resolveComparisonIdentity(req);
  const comparison = await comparisonService.removeFromComparison(
    identity,
    paramStr(req.params.productId)
  );
  return ApiResponse.ok(res, withGuestToken({ comparison }, guestToken), "محصول از لیست مقایسه حذف شد");
}

export async function clear(req: Request, res: Response) {
  const { identity, guestToken } = resolveComparisonIdentity(req);
  const comparison = await comparisonService.clearComparison(identity);
  return ApiResponse.ok(res, withGuestToken({ comparison }, guestToken), "لیست مقایسه خالی شد");
}
