import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import * as gatewayService from "../services/payment/payment-gateway-admin.service";

export async function create(req: Request, res: Response) {
  const gateway = await gatewayService.createPaymentGateway(req.body);
  return ApiResponse.created(res, gateway, "درگاه پرداخت ایجاد شد");
}

export async function update(req: Request, res: Response) {
  const gateway = await gatewayService.updatePaymentGateway(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, gateway, "درگاه پرداخت به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await gatewayService.deletePaymentGateway(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "درگاه پرداخت حذف شد");
}

export async function list(req: Request, res: Response) {
  const includeInactive = req.query.includeInactive === "true";
  return ApiResponse.ok(res, await gatewayService.listPaymentGateways(includeInactive));
}
