import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import * as wishlistService from "../services/shopping/wishlist.service";

export async function add(req: Request, res: Response) {
  const item = await wishlistService.addToWishlist(req.user!.id, req.body.productId);
  return ApiResponse.created(res, item, "محصول به لیست علاقه‌مندی اضافه شد");
}

export async function remove(req: Request, res: Response) {
  await wishlistService.removeFromWishlist(req.user!.id, paramStr(req.params.productId));
  return ApiResponse.ok(res, null, "محصول از لیست علاقه‌مندی حذف شد");
}

export async function list(req: Request, res: Response) {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const result = await wishlistService.listWishlist(req.user!.id, page, limit);
  return ApiResponse.ok(res, result);
}
