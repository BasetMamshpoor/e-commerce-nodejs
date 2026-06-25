import { z } from "zod";

export const createCommentSchema = z
  .object({
    content: z.string().trim().min(1).max(2000),
    parentId: z.string().optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    attachmentMediaIds: z.array(z.string()).optional().default([]),
  })
  .refine((d) => !d.parentId || d.rating === undefined, {
    message: "امتیاز (rating) فقط برای دیدگاه اصلی (نه پاسخ) معنا دارد",
    path: ["rating"],
  });

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const adminListCommentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export const moderateCommentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
export type AdminListCommentsQuery = z.infer<typeof adminListCommentsQuerySchema>;
export type ModerateCommentInput = z.infer<typeof moderateCommentSchema>;
