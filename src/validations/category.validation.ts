import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(160).optional(),
  description: z.string().max(2000).optional(),
  imageId: z.string().optional(),
  parentId: z.string().optional(),
  order: z.coerce.number().int().optional().default(0),
  isActive: z.coerce.boolean().optional().default(true),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(300).optional(),
  canonicalUrl: z.string().url().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const attachAttributeSchema = z.object({
  attributeId: z.string().min(1),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
