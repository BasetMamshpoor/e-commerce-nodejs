import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().trim().min(2).max(150),
  slug: z.string().trim().min(2).max(160).optional(),
  description: z.string().max(2000).optional(),
  logoId: z.string().optional(),
  isActive: z.coerce.boolean().optional().default(true),
  metaTitle: z.string().max(160).optional(),
  metaDescription: z.string().max(300).optional(),
});

export const updateBrandSchema = createBrandSchema.partial();

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
