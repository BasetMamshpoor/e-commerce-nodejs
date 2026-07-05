import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import * as searchService from "../services/cms/search.service";

export async function search(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const result = await searchService.globalSearch(q);
  return ApiResponse.ok(res, result);
}

export async function quickSearch(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const result = await searchService.quickSearch(q);
  return ApiResponse.ok(res, result);
}

export async function mainSearch(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const result = await searchService.mainSearch({
    q,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    brandIds: typeof req.query.brandIds === "string" ? req.query.brandIds : undefined,
    categoryIds: typeof req.query.categoryIds === "string" ? req.query.categoryIds : undefined,
    inStock: req.query.inStock === "true",
    hasDiscount: req.query.hasDiscount === "true",
    sort: typeof req.query.sort === "string" && ["relevance", "price_asc", "price_desc", "newest", "most_popular", "bestselling"].includes(req.query.sort)
      ? req.query.sort as "relevance"
      : undefined,
  });
  return ApiResponse.ok(res, result);
}
