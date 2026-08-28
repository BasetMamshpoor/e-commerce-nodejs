import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import * as newsletterService from "../services/cms/newsletter.service";

export async function subscribe(req: Request, res: Response) {
  const result = await newsletterService.subscribe(req.body.email);
  return ApiResponse.ok(res, result, "عضویت در خبرنامه با موفقیت ثبت شد");
}

export async function unsubscribe(req: Request, res: Response) {
  await newsletterService.unsubscribe(req.body.email);
  return ApiResponse.ok(res, null, "عضویت در خبرنامه لغو شد");
}

export async function listSubscribers(req: Request, res: Response) {
  const { page, limit, search } = req.query as { page?: string; limit?: string; search?: string };
  return ApiResponse.ok(
    res,
    await newsletterService.listSubscribers(page ? Number(page) : undefined, limit ? Number(limit) : undefined, search)
  );
}

export async function exportSubscribers(req: Request, res: Response) {
  const { search } = req.query as { search?: string };
  return ApiResponse.ok(res, await newsletterService.listAllSubscribersForExport(search));
}
