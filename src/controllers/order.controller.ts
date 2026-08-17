import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { paramInt } from "../utils/params";
import * as orderService from "../services/order/order.service";
import * as cancellationService from "../services/order/order-cancellation.service";
import * as returnService from "../services/order/order-return.service";
import * as paymentService from "../services/order/order-payment.service";

function userId(req: Request): number {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

// --- مشتری ---

export async function create(req: Request, res: Response) {
  const order = await orderService.createOrder(userId(req), req.body);
  const detail = await orderService.getOrderDetail(order.id, userId(req));
  return ApiResponse.created(res, detail, "سفارش با موفقیت ثبت شد");
}

export async function shippingEstimate(req: Request, res: Response) {
  const query = req.validatedQuery as { addressId: number; shippingCompanyId: number };
  const result = await orderService.estimateShippingCost(userId(req), query.addressId, query.shippingCompanyId);
  return ApiResponse.ok(res, result);
}

export async function listMine(req: Request, res: Response) {
  return ApiResponse.ok(res, await orderService.listOrders(userId(req), req.validatedQuery as never));
}

export async function getMine(req: Request, res: Response) {
  const order = await orderService.getOrderDetail(paramInt(req.params.id), userId(req));
  return ApiResponse.ok(res, order);
}

export async function cancel(req: Request, res: Response) {
  const order = await cancellationService.cancelOrder(
    userId(req),
    paramInt(req.params.id),
    req.body.reason
  );
  return ApiResponse.ok(res, order, "سفارش لغو شد");
}

export async function requestReturn(req: Request, res: Response) {
  const orderReturn = await returnService.requestReturn(userId(req), paramInt(req.params.id), req.body);
  return ApiResponse.created(res, orderReturn, "درخواست مرجوعی ثبت شد و در انتظار بررسی است");
}

export async function initiatePayment(req: Request, res: Response) {
  const result = await paymentService.initiateOrderPayment(
    userId(req),
    paramInt(req.params.id),
    req.body.gatewaySlug
  );
  return ApiResponse.ok(res, result, "به درگاه پرداخت منتقل می‌شوید");
}

export async function verifyPayment(req: Request, res: Response) {
  const order = await paymentService.verifyOrderPayment(
    userId(req),
    paramInt(req.params.id),
    req.body.providerParams ?? {}
  );
  return ApiResponse.ok(res, order, "پرداخت با موفقیت تایید شد");
}

// --- ادمین/پشتیبانی ---

export async function listAdmin(req: Request, res: Response) {
  return ApiResponse.ok(res, await orderService.listOrdersAdmin(req.validatedQuery as never));
}

export async function getByIdAdmin(req: Request, res: Response) {
  return ApiResponse.ok(res, await orderService.getOrderDetail(paramInt(req.params.id)));
}

export async function updateStatusAdmin(req: Request, res: Response) {
  const order = await orderService.updateOrderStatusAdmin(paramInt(req.params.id), req.body);
  return ApiResponse.ok(res, order, "وضعیت سفارش به‌روزرسانی شد");
}

export async function listReturnsAdmin(req: Request, res: Response) {
  return ApiResponse.ok(res, await returnService.listReturnsAdmin(req.validatedQuery as never));
}

export async function getReturnByIdAdmin(req: Request, res: Response) {
  return ApiResponse.ok(res, await returnService.getReturnDetailAdmin(paramInt(req.params.returnId)));
}

export async function updateReturnAdmin(req: Request, res: Response) {
  const orderReturn = await returnService.updateReturnAdmin(paramInt(req.params.returnId), req.body);
  return ApiResponse.ok(res, orderReturn, "درخواست مرجوعی به‌روزرسانی شد");
}
