import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import * as landingService from "../services/cms/landing.service";

export async function getLandingData(_req: Request, res: Response) {
  const data = await landingService.getLandingPageData();
  return ApiResponse.ok(res, data);
}
