import { z } from "zod";

export const createAttributeSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(120).optional(),
  inputType: z.enum(["TEXT", "COLOR", "SELECT"]).optional().default("SELECT"),
  isFilterable: z.coerce.boolean().optional().default(true),
  isVariant: z.coerce.boolean().optional().default(true),
  isDisplay: z.coerce.boolean().optional().default(false),
  // Categories this attribute applies to. Omitted/empty means "applies to
  // every category" (the pre-existing, unrestricted default), so existing
  // attributes created before this field is used everywhere unchanged.
  categoryIds: z.array(z.coerce.number().int().positive()).optional(),
});
export const updateAttributeSchema = createAttributeSchema.partial();

export const createAttributeValueSchema = z.object({
  value: z.string().trim().min(1).max(150),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "کد رنگ باید مثل #FF0000 باشد")
    .optional(),
  order: z.coerce.number().int().optional().default(0),
});
export const updateAttributeValueSchema = createAttributeValueSchema.partial();

export type CreateAttributeInput = z.infer<typeof createAttributeSchema>;
export type UpdateAttributeInput = z.infer<typeof updateAttributeSchema>;
export type CreateAttributeValueInput = z.infer<typeof createAttributeValueSchema>;
export type UpdateAttributeValueInput = z.infer<typeof updateAttributeValueSchema>;
