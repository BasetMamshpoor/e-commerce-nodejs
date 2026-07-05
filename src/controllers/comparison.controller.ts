import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import * as comparisonService from "../services/shopping/comparison.service";

export async function compare(req: Request, res: Response) {
  const productIdsParam = req.query.productIds;
  if (typeof productIdsParam !== "string" || productIdsParam.length === 0) {
    throw ApiError.badRequest("productIds را به‌صورت query ارسال کنید (مثلا ?productIds=1,2,3)");
  }

  const productIds = productIdsParam
    .split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (productIds.length < 1 || productIds.length > 4) {
    throw ApiError.badRequest("حداقل ۱ و حداکثر ۴ محصول را ارسال کنید");
  }

  const result = await comparisonService.getComparisonByProductIds(productIds);
  return ApiResponse.ok(res, result);
}
