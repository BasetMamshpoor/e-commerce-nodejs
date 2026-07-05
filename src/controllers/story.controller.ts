import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramInt } from "../utils/params";
import * as storyService from "../services/cms/story.service";

export async function create(req: Request, res: Response) {
  const story = await storyService.createStory(req.body);
  return ApiResponse.created(res, story, "استوری ایجاد شد");
}

export async function update(req: Request, res: Response) {
  const story = await storyService.updateStory(paramInt(req.params.id), req.body);
  return ApiResponse.ok(res, story, "استوری به‌روزرسانی شد");
}

export async function remove(req: Request, res: Response) {
  await storyService.deleteStory(paramInt(req.params.id));
  return ApiResponse.ok(res, null, "استوری حذف شد");
}

export async function listActive(_req: Request, res: Response) {
  return ApiResponse.ok(res, await storyService.listActiveStories());
}

export async function listAdmin(req: Request, res: Response) {
  const { page, limit } = req.query as { page?: string; limit?: string };
  return ApiResponse.ok(res, await storyService.listStoriesAdmin({ page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined }));
}
