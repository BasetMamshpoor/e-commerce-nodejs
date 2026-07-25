import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import * as currencyService from "../services/currency.service";

export async function list(req: Request, res: Response) {
  const currencies = await currencyService.listCurrencies();
  return ApiResponse.ok(res, currencies);
}

export async function create(req: Request, res: Response) {
  const currency = await currencyService.createCurrency(req.body);
  return ApiResponse.created(res, currency, "ارز جدید اضافه شد");
}

export async function update(req: Request, res: Response) {
  const currency = await currencyService.updateCurrency(Number(req.params.id), req.body);
  return ApiResponse.ok(res, currency, "ارز به‌روزرسانی شد");
}
