import { z } from "zod";

export const createBlogCategorySchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(160).optional(),
  description: z.string().max(1000).optional(),
});
export const updateBlogCategorySchema = createBlogCategorySchema.partial();

export const createBlogPostSchema = z.object({
  title: z.string().trim().min(2).max(250),
  slug: z.string().trim().min(2).max(260).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1), // HTML از تکست ادیتور
  coverImageId: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("DRAFT"),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(300).optional(),
  canonicalUrl: z.string().url().optional(),
});
export const updateBlogPostSchema = createBlogPostSchema.partial();

export const listBlogPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  categorySlug: z.string().optional(),
  search: z.string().optional(),
});

export const adminListBlogPostsQuerySchema = listBlogPostsQuerySchema.extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategorySchema>;
export type UpdateBlogCategoryInput = z.infer<typeof updateBlogCategorySchema>;
export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
export type ListBlogPostsQuery = z.infer<typeof listBlogPostsQuerySchema>;
export type AdminListBlogPostsQuery = z.infer<typeof adminListBlogPostsQuerySchema>;
