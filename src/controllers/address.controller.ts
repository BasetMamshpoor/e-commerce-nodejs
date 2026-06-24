import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { paramStr } from "../utils/params";
import * as addressService from "../services/address/address.service";

function userId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

export async function create(req: Request, res: Response) {
  const address = await addressService.createAddress(userId(req), req.body);
  return ApiResponse.created(res, address, "آدرس اضافه شد");
}

export async function update(req: Request, res: Response) {
  const address = await addressService.updateAddress(userId(req), paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, address, "آدرس به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await addressService.deleteAddress(userId(req), paramStr(req.params.id));
  return ApiResponse.ok(res, null, "آدرس حذف شد");
}

export async function list(req: Request, res: Response) {
  return ApiResponse.ok(res, await addressService.listAddresses(userId(req)));
}

export async function getById(req: Request, res: Response) {
  return ApiResponse.ok(res, await addressService.getOwnedAddress(userId(req), paramStr(req.params.id)));
}
