import { z } from "zod";

export const listMediaQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  type: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]).optional(),
  uploadedById: z.string().optional(),
});

export type ListMediaQuery = z.infer<typeof listMediaQuerySchema>;

export const getMediaByIdsQuerySchema = z.object({
  ids: z.string().min(1, "ids الزامی است (با کاما جدا کنید)"),
});

export type GetMediaByIdsQuery = z.infer<typeof getMediaByIdsQuerySchema>;
