import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import { resolveCartIdentity } from "../utils/cartIdentity";
import * as discountService from "../services/discount/discount.service";
import * as discountApplyService from "../services/discount/discount-apply.service";

export async function create(req: Request, res: Response) {
  const discountCode = await discountService.createDiscountCode(req.body);
  return ApiResponse.created(res, discountCode, "کد تخفیف ایجاد شد");
}

export async function update(req: Request, res: Response) {
  const discountCode = await discountService.updateDiscountCode(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, discountCode, "کد تخفیف به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await discountService.deleteDiscountCode(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "کد تخفیف حذف شد");
}

export async function getById(req: Request, res: Response) {
  return ApiResponse.ok(res, await discountService.getDiscountCodeById(paramStr(req.params.id)));
}

export async function list(req: Request, res: Response) {
  return ApiResponse.ok(res, await discountService.listDiscountCodesAdmin(req.query as never));
}

export async function apply(req: Request, res: Response) {
  const { identity, guestToken } = resolveCartIdentity(req);
  const result = await discountApplyService.evaluateDiscountCode(req.body.code, identity);
  return ApiResponse.ok(res, { ...result, ...(guestToken ? { guestToken } : {}) });
}
