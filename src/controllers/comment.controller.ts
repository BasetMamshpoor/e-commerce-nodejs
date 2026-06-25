import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { paramStr } from "../utils/params";
import * as commentService from "../services/comment/comment.service";

function userId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

export async function listForProduct(req: Request, res: Response) {
  const result = await commentService.listApprovedComments(
    paramStr(req.params.productId),
    req.validatedQuery as never
  );
  return ApiResponse.ok(res, result);
}

export async function create(req: Request, res: Response) {
  const comment = await commentService.createComment(
    userId(req),
    paramStr(req.params.productId),
    req.body
  );
  return ApiResponse.created(res, comment, "دیدگاه شما ثبت شد و پس از بررسی نمایش داده می‌شود");
}

export async function update(req: Request, res: Response) {
  const comment = await commentService.updateComment(userId(req), paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, comment, "دیدگاه ویرایش شد و دوباره در صف بررسی قرار گرفت");
}

export async function remove(req: Request, res: Response) {
  const isStaff = req.user ? req.user.role !== "CUSTOMER" : false;
  await commentService.deleteComment(userId(req), paramStr(req.params.id), isStaff);
  return ApiResponse.ok(res, null, "دیدگاه حذف شد");
}

export async function like(req: Request, res: Response) {
  const result = await commentService.toggleLike(userId(req), paramStr(req.params.id));
  return ApiResponse.ok(res, result);
}

// --- ادمین ---

export async function listAdmin(req: Request, res: Response) {
  return ApiResponse.ok(res, await commentService.listCommentsAdmin(req.validatedQuery as never));
}

export async function moderate(req: Request, res: Response) {
  const comment = await commentService.moderateComment(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, comment, "دیدگاه به‌روزرسانی شد");
}
