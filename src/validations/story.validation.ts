import { z } from "zod";

export const createStorySchema = z.object({
  title: z.string().min(1).max(200),
  coverImageUrl: z.string().optional(),
  coverImageMediaId: z.coerce.number().int().positive().nullable().optional(),
  videoUrl: z.string().optional(),
  videoMediaId: z.coerce.number().int().positive().nullable().optional(),
  expiresAt: z.coerce.date(),
  order: z.coerce.number().int().optional().default(0),
  productIds: z.array(z.coerce.number().int()).optional().default([]),
});

export const updateStorySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  coverImageUrl: z.string().optional(),
  coverImageMediaId: z.coerce.number().int().positive().nullable().optional(),
  videoUrl: z.string().optional(),
  videoMediaId: z.coerce.number().int().positive().nullable().optional(),
  expiresAt: z.coerce.date().optional(),
  order: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
  productIds: z.array(z.coerce.number().int()).optional(),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
