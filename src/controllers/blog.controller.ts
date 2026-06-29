import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { paramStr } from "../utils/params";
import * as postService from "../services/blog/blog-post.service";
import * as categoryService from "../services/blog/blog-category.service";

// --- پست‌ها ---

export async function createPost(req: Request, res: Response) {
  const post = await postService.createBlogPost(req.user?.id, req.body);
  return ApiResponse.created(res, post, "پست وبلاگ ایجاد شد");
}

export async function updatePost(req: Request, res: Response) {
  const post = await postService.updateBlogPost(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, post, "پست وبلاگ به‌روزرسانی شد");
}

export async function removePost(req: Request, res: Response) {
  await postService.deleteBlogPost(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "پست وبلاگ حذف شد");
}

export async function getBySlugPublic(req: Request, res: Response) {
  return ApiResponse.ok(res, await postService.getBlogPostBySlugPublic(paramStr(req.params.slug)));
}

export async function getByIdAdmin(req: Request, res: Response) {
  return ApiResponse.ok(res, await postService.getBlogPostByIdAdmin(paramStr(req.params.id)));
}

export async function listPublic(req: Request, res: Response) {
  return ApiResponse.ok(res, await postService.listBlogPostsPublic(req.validatedQuery as never));
}

export async function listAdmin(req: Request, res: Response) {
  return ApiResponse.ok(res, await postService.listBlogPostsAdmin(req.validatedQuery as never));
}

export async function trackView(req: Request, res: Response) {
  await postService.trackBlogPostView(paramStr(req.params.id));
  return ApiResponse.ok(res, null);
}

// --- دسته‌بندی‌ها ---

export async function createCategory(req: Request, res: Response) {
  return ApiResponse.created(
    res,
    await categoryService.createBlogCategory(req.body),
    "دسته‌بندی وبلاگ ایجاد شد"
  );
}

export async function updateCategory(req: Request, res: Response) {
  const category = await categoryService.updateBlogCategory(paramStr(req.params.id), req.body);
  return ApiResponse.ok(res, category, "دسته‌بندی وبلاگ به‌روزرسانی شد");
}

export async function removeCategory(req: Request, res: Response) {
  await categoryService.deleteBlogCategory(paramStr(req.params.id));
  return ApiResponse.ok(res, null, "دسته‌بندی وبلاگ حذف شد");
}

export async function listCategories(_req: Request, res: Response) {
  return ApiResponse.ok(res, await categoryService.listBlogCategories());
}
