import { z } from "zod";

const isoDate = z.coerce.date();

export const createBannerSchema = z.object({
  title: z.string().trim().max(150).optional(),
  mediaId: z.string().min(1, "تصویر بنر الزامی است"),
  link: z.string().optional(),
  position: z.enum(["HOME_MAIN", "HOME_MIDDLE", "CATEGORY_TOP", "SIDEBAR"]),
  order: z.coerce.number().int().optional().default(0),
  isActive: z.coerce.boolean().optional().default(true),
  startsAt: isoDate.optional(),
  endsAt: isoDate.optional(),
});
export const updateBannerSchema = createBannerSchema.partial();

export const createPopupSchema = z.object({
  title: z.string().trim().min(1).max(150),
  content: z.string().max(2000).optional(),
  mediaId: z.string().optional(),
  link: z.string().optional(),
  isActive: z.coerce.boolean().optional().default(true),
  startsAt: isoDate.optional(),
  endsAt: isoDate.optional(),
  showOncePerSession: z.coerce.boolean().optional().default(true),
});
export const updatePopupSchema = createPopupSchema.partial();

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type CreatePopupInput = z.infer<typeof createPopupSchema>;
export type UpdatePopupInput = z.infer<typeof updatePopupSchema>;
