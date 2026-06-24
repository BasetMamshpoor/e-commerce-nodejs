import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import * as shippingService from "../services/shipping/shipping-company.service";

export async function create(req: Request, res: Response) {
  const company = await shippingService.createShippingCompany(req.body);
  return ApiResponse.created(res, company, "شرکت ارسال ایجاد شد");
}

export async function update(req: Request, res: Response) {
  const company = await shippingService.updateShippingCompany(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, company, "شرکت ارسال به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await shippingService.deleteShippingCompany(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "شرکت ارسال حذف شد");
}

export async function list(req: Request, res: Response) {
  const includeInactive = req.query.includeInactive === "true";
  return ApiResponse.ok(res, await shippingService.listShippingCompanies(includeInactive));
}

export async function getById(req: Request, res: Response) {
  return ApiResponse.ok(res, await shippingService.getShippingCompanyById(paramStr(req.params.id)));
}
