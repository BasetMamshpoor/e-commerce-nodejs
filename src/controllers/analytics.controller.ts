import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import * as analyticsService from "../services/analytics/analytics.service";

export async function overview(_req: Request, res: Response) {
  return ApiResponse.ok(res, await analyticsService.getOverview());
}

export async function salesOverTime(req: Request, res: Response) {
  return ApiResponse.ok(res, await analyticsService.getSalesOverTime(req.validatedQuery as never));
}

export async function orderStatusBreakdown(_req: Request, res: Response) {
  return ApiResponse.ok(res, await analyticsService.getOrderStatusBreakdown());
}

export async function topProducts(req: Request, res: Response) {
  return ApiResponse.ok(res, await analyticsService.getTopProducts(req.validatedQuery as never));
}

export async function newUsersOverTime(req: Request, res: Response) {
  return ApiResponse.ok(res, await analyticsService.getNewUsersOverTime(req.validatedQuery as never));
}
